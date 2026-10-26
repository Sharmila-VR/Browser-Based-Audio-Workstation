import { Track } from '../types/daw'
import { audioBufferToWav } from '../utils/wavEncoder'
import { beatsToSeconds } from '../utils/tempoMath'
import { SynthEngine } from './synthEngine'

export interface RenderProgress {
  progress: number
  status: string
}

export async function renderProjectToWav(
  tracks: Track[],
  bpm: number,
  audioBuffers: Map<string, AudioBuffer>,
  onProgress: (progress: RenderProgress) => void,
  cancelSignal?: { isCancelled: boolean }
): Promise<Blob | null> {
  onProgress({ progress: 0.05, status: 'Preparing audio graph...' })

  let maxBeat = 16
  tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      const clipEnd = clip.startBeat + clip.durationBeats
      if (clipEnd > maxBeat) maxBeat = clipEnd
    })
  })

  const tailSec = 2.0
  const durationSec = beatsToSeconds(maxBeat, bpm) + tailSec
  const sampleRate = 44100
  const totalFrames = Math.max(sampleRate, Math.floor(durationSec * sampleRate))

  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate)
  const masterGain = offlineCtx.createGain()
  masterGain.connect(offlineCtx.destination)

  const hasAnySolo = tracks.some((t) => t.soloed)

  for (let t = 0; t < tracks.length; t++) {
    if (cancelSignal?.isCancelled) return null

    const track = tracks[t]
    const isAudible = !track.muted && (!hasAnySolo || track.soloed)
    if (!isAudible) continue

    const inputGain = offlineCtx.createGain()
    const volumeGain = offlineCtx.createGain()
    volumeGain.gain.value = track.volume
    const panner = offlineCtx.createStereoPanner()
    panner.pan.value = Math.max(-1, Math.min(1, track.pan))

    const lowEq = offlineCtx.createBiquadFilter()
    lowEq.type = 'lowshelf'
    lowEq.frequency.value = track.effects.eq.lowFreq
    lowEq.gain.value = track.effects.eq.enabled ? track.effects.eq.lowGain : 0

    const midEq = offlineCtx.createBiquadFilter()
    midEq.type = 'peaking'
    midEq.frequency.value = track.effects.eq.midFreq
    midEq.Q.value = track.effects.eq.midQ
    midEq.gain.value = track.effects.eq.enabled ? track.effects.eq.midGain : 0

    const highEq = offlineCtx.createBiquadFilter()
    highEq.type = 'highshelf'
    highEq.frequency.value = track.effects.eq.highFreq
    highEq.gain.value = track.effects.eq.enabled ? track.effects.eq.highGain : 0

    const comp = offlineCtx.createDynamicsCompressor()
    if (track.effects.compressor.enabled) {
      comp.threshold.value = track.effects.compressor.threshold
      comp.ratio.value = track.effects.compressor.ratio
      comp.attack.value = track.effects.compressor.attack
      comp.release.value = track.effects.compressor.release
      comp.knee.value = track.effects.compressor.knee
    }

    inputGain.connect(lowEq)
    lowEq.connect(midEq)
    midEq.connect(highEq)
    highEq.connect(comp)
    comp.connect(volumeGain)
    volumeGain.connect(panner)
    panner.connect(masterGain)

    const synth = new SynthEngine(offlineCtx, inputGain)

    for (const clip of track.clips) {
      if (clip.type === 'audio') {
        const buffer = audioBuffers.get(clip.audioBufferId)
        if (buffer) {
          const source = offlineCtx.createBufferSource()
          source.buffer = buffer
          source.connect(inputGain)
          const startSec = beatsToSeconds(clip.startBeat, bpm)
          source.start(startSec, beatsToSeconds(clip.offsetBeats, bpm))
        }
      } else if (clip.type === 'midi') {
        for (const note of clip.notes) {
          const noteStartSec = beatsToSeconds(clip.startBeat + note.startBeat, bpm)
          const noteDurSec = beatsToSeconds(note.durationBeats, bpm)
          synth.noteOn(
            note.pitch,
            note.velocity,
            noteStartSec,
            track.synthSettings,
            noteDurSec
          )
        }
      }
    }

    onProgress({
      progress: 0.1 + (0.3 * (t + 1)) / tracks.length,
      status: `Assembled track ${track.name}...`
    })
  }

  if (cancelSignal?.isCancelled) return null

  onProgress({ progress: 0.45, status: 'Rendering offline audio...' })

  let progressInterval: any = null
  let fakeProgress = 0.45
  progressInterval = setInterval(() => {
    if (fakeProgress < 0.88) {
      fakeProgress += 0.05
      onProgress({ progress: fakeProgress, status: 'Processing DSP and voices...' })
    }
  }, 100)

  try {
    const rendered = await offlineCtx.startRendering()
    clearInterval(progressInterval)

    if (cancelSignal?.isCancelled) return null

    onProgress({ progress: 0.92, status: 'Encoding 16-bit PCM WAV...' })
    const wavBlob = audioBufferToWav(rendered)
    onProgress({ progress: 1.0, status: 'Export complete' })
    return wavBlob
  } catch (err) {
    clearInterval(progressInterval)
    throw err
  }
}
