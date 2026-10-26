import { SynthSettings } from '../types/daw'

export const defaultSynthSettings: SynthSettings = {
  osc1Type: 'sawtooth',
  osc2Type: 'square',
  osc2Detune: 7,
  oscMix: 0.5,
  attack: 0.02,
  decay: 0.15,
  sustain: 0.6,
  release: 0.3,
  filterType: 'lowpass',
  filterCutoff: 2400,
  filterResonance: 3,
  filterEnvAmount: 1800
}

export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12)
}

interface ActiveVoice {
  pitch: number
  osc1: OscillatorNode
  osc2: OscillatorNode
  gainNode: GainNode
  filterNode: BiquadFilterNode
  stopTime?: number
}

export class SynthEngine {
  private ctx: BaseAudioContext
  private outputNode: AudioNode
  private activeVoices = new Map<number, ActiveVoice[]>()

  constructor(ctx: BaseAudioContext, outputNode: AudioNode) {
    this.ctx = ctx
    this.outputNode = outputNode
  }

  public setOutput(outputNode: AudioNode) {
    this.outputNode = outputNode
  }

  public noteOn(
    pitch: number,
    velocity: number = 100,
    time: number = this.ctx.currentTime,
    settings: SynthSettings = defaultSynthSettings,
    duration?: number
  ) {
    const freq = midiToFrequency(pitch)
    const velScale = Math.max(0.01, Math.min(1.0, velocity / 127))

    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const osc1Gain = this.ctx.createGain()
    const osc2Gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    const ampGain = this.ctx.createGain()

    osc1.type = settings.osc1Type
    osc1.frequency.setValueAtTime(freq, time)

    osc2.type = settings.osc2Type
    osc2.frequency.setValueAtTime(freq, time)
    osc2.detune.setValueAtTime(settings.osc2Detune, time)

    osc1Gain.gain.setValueAtTime(1 - settings.oscMix, time)
    osc2Gain.gain.setValueAtTime(settings.oscMix, time)

    filter.type = settings.filterType
    const baseCutoff = Math.max(20, Math.min(20000, settings.filterCutoff))
    const envAmount = settings.filterEnvAmount * velScale
    filter.frequency.setValueAtTime(baseCutoff, time)
    filter.frequency.linearRampToValueAtTime(
      Math.max(20, Math.min(20000, baseCutoff + envAmount)),
      time + Math.max(0.005, settings.attack)
    )
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, Math.min(20000, baseCutoff + envAmount * settings.sustain)),
      time + Math.max(0.01, settings.attack + settings.decay)
    )
    filter.Q.setValueAtTime(settings.filterResonance, time)

    const peakAmp = 0.25 * velScale
    ampGain.gain.setValueAtTime(0.0001, time)
    ampGain.gain.linearRampToValueAtTime(peakAmp, time + Math.max(0.005, settings.attack))
    ampGain.gain.linearRampToValueAtTime(
      Math.max(0.0001, peakAmp * settings.sustain),
      time + Math.max(0.01, settings.attack + settings.decay)
    )

    osc1.connect(osc1Gain)
    osc2.connect(osc2Gain)
    osc1Gain.connect(filter)
    osc2Gain.connect(filter)
    filter.connect(ampGain)
    ampGain.connect(this.outputNode)

    osc1.start(time)
    osc2.start(time)

    const voice: ActiveVoice = {
      pitch,
      osc1,
      osc2,
      gainNode: ampGain,
      filterNode: filter
    }

    if (!this.activeVoices.has(pitch)) {
      this.activeVoices.set(pitch, [])
    }
    this.activeVoices.get(pitch)!.push(voice)

    if (duration !== undefined && duration > 0) {
      this.noteOff(pitch, time + duration, settings)
    }
  }

  public noteOff(
    pitch: number,
    time: number = this.ctx.currentTime,
    settings: SynthSettings = defaultSynthSettings
  ) {
    const voices = this.activeVoices.get(pitch)
    if (!voices || voices.length === 0) return

    const voice = voices.shift()!
    const releaseTime = Math.max(0.01, settings.release)
    const stopTime = time + releaseTime

    const currentGain = voice.gainNode.gain
    currentGain.cancelScheduledValues(time)
    currentGain.setValueAtTime(Math.max(0.0001, currentGain.value), time)
    currentGain.exponentialRampToValueAtTime(0.0001, stopTime)

    voice.osc1.stop(stopTime + 0.05)
    voice.osc2.stop(stopTime + 0.05)

    const cleanup = () => {
      try {
        voice.osc1.disconnect()
        voice.osc2.disconnect()
        voice.filterNode.disconnect()
        voice.gainNode.disconnect()
      } catch {
        // Node already disconnected
      }
    }

    if (typeof setTimeout !== 'undefined') {
      const ms = Math.max(50, (stopTime - this.ctx.currentTime + 0.1) * 1000)
      setTimeout(cleanup, ms)
    }
  }

  public releaseAll() {
    this.activeVoices.forEach((voices) => {
      voices.forEach((v) => {
        try {
          v.osc1.stop()
          v.osc2.stop()
          v.osc1.disconnect()
          v.osc2.disconnect()
          v.filterNode.disconnect()
          v.gainNode.disconnect()
        } catch {
          // Ignore
        }
      })
    })
    this.activeVoices.clear()
  }
}
