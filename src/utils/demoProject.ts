import { audioEngine } from '../audio/audioEngine'
import { waveformManager } from '../audio/waveformManager'
import { defaultEffects } from '../store/tracksSlice'
import { defaultSynthSettings } from '../audio/synthEngine'
import { AudioClip, MidiClip, Track } from '../types/daw'
import { generateDrumBeatLoop, generateSynthBassLoop } from './audioSampleGenerator'

export async function createDemoProject(ctx: BaseAudioContext): Promise<Track[]> {
  const bpm = 120

  const drumBuffer = generateDrumBeatLoop(ctx, bpm)
  const bassBuffer = generateSynthBassLoop(ctx, bpm)

  const drumBufId = 'drum_beat_loop_120'
  const bassBufId = 'synth_bass_loop_120'

  audioEngine.storeAudioBuffer(drumBufId, drumBuffer)
  audioEngine.storeAudioBuffer(bassBufId, bassBuffer)

  try {
    await waveformManager.generatePeaks(drumBufId, drumBuffer.getChannelData(0))
    await waveformManager.generatePeaks(bassBufId, bassBuffer.getChannelData(0))
  } catch {
    // Non-fatal
  }

  const drumClip1: AudioClip = {
    id: 'clip_drums_1',
    trackId: 'track_drums',
    type: 'audio',
    name: 'Drum Loop 1',
    startBeat: 0,
    durationBeats: 8,
    offsetBeats: 0,
    loop: true,
    audioBufferId: drumBufId,
    sampleRate: drumBuffer.sampleRate,
    durationSeconds: drumBuffer.duration
  }

  const drumClip2: AudioClip = {
    id: 'clip_drums_2',
    trackId: 'track_drums',
    type: 'audio',
    name: 'Drum Loop 2',
    startBeat: 8,
    durationBeats: 8,
    offsetBeats: 0,
    loop: true,
    audioBufferId: drumBufId,
    sampleRate: drumBuffer.sampleRate,
    durationSeconds: drumBuffer.duration
  }

  const bassClip1: AudioClip = {
    id: 'clip_bass_1',
    trackId: 'track_bass',
    type: 'audio',
    name: 'Sub Bass 1',
    startBeat: 0,
    durationBeats: 8,
    offsetBeats: 0,
    loop: true,
    audioBufferId: bassBufId,
    sampleRate: bassBuffer.sampleRate,
    durationSeconds: bassBuffer.duration
  }

  const bassClip2: AudioClip = {
    id: 'clip_bass_2',
    trackId: 'track_bass',
    type: 'audio',
    name: 'Sub Bass 2',
    startBeat: 8,
    durationBeats: 8,
    offsetBeats: 0,
    loop: true,
    audioBufferId: bassBufId,
    sampleRate: bassBuffer.sampleRate,
    durationSeconds: bassBuffer.duration
  }

  const chordsClip: MidiClip = {
    id: 'clip_chords',
    trackId: 'track_chords',
    type: 'midi',
    name: 'Warm Progression',
    startBeat: 0,
    durationBeats: 16,
    offsetBeats: 0,
    loop: false,
    notes: [
      { id: 'c1', pitch: 57, startBeat: 0, durationBeats: 3.8, velocity: 95 },
      { id: 'c2', pitch: 60, startBeat: 0, durationBeats: 3.8, velocity: 90 },
      { id: 'c3', pitch: 64, startBeat: 0, durationBeats: 3.8, velocity: 88 },
      { id: 'c4', pitch: 67, startBeat: 0, durationBeats: 3.8, velocity: 92 },

      { id: 'c5', pitch: 53, startBeat: 4, durationBeats: 3.8, velocity: 96 },
      { id: 'c6', pitch: 57, startBeat: 4, durationBeats: 3.8, velocity: 90 },
      { id: 'c7', pitch: 60, startBeat: 4, durationBeats: 3.8, velocity: 92 },
      { id: 'c8', pitch: 65, startBeat: 4, durationBeats: 3.8, velocity: 90 },

      { id: 'c9', pitch: 48, startBeat: 8, durationBeats: 3.8, velocity: 95 },
      { id: 'c10', pitch: 55, startBeat: 8, durationBeats: 3.8, velocity: 90 },
      { id: 'c11', pitch: 60, startBeat: 8, durationBeats: 3.8, velocity: 92 },
      { id: 'c12', pitch: 64, startBeat: 8, durationBeats: 3.8, velocity: 94 },

      { id: 'c13', pitch: 55, startBeat: 12, durationBeats: 3.8, velocity: 98 },
      { id: 'c14', pitch: 59, startBeat: 12, durationBeats: 3.8, velocity: 92 },
      { id: 'c15', pitch: 62, startBeat: 12, durationBeats: 3.8, velocity: 94 },
      { id: 'c16', pitch: 67, startBeat: 12, durationBeats: 3.8, velocity: 95 }
    ]
  }

  const leadClip: MidiClip = {
    id: 'clip_lead',
    trackId: 'track_lead',
    type: 'midi',
    name: 'Topline Lead',
    startBeat: 0,
    durationBeats: 16,
    offsetBeats: 0,
    loop: false,
    notes: [
      { id: 'l1', pitch: 69, startBeat: 0, durationBeats: 0.75, velocity: 105 },
      { id: 'l2', pitch: 72, startBeat: 0.75, durationBeats: 0.75, velocity: 100 },
      { id: 'l3', pitch: 71, startBeat: 1.5, durationBeats: 1.0, velocity: 102 },
      { id: 'l4', pitch: 67, startBeat: 2.5, durationBeats: 1.2, velocity: 98 },

      { id: 'l5', pitch: 69, startBeat: 4, durationBeats: 0.75, velocity: 105 },
      { id: 'l6', pitch: 74, startBeat: 4.75, durationBeats: 0.75, velocity: 108 },
      { id: 'l7', pitch: 72, startBeat: 5.5, durationBeats: 1.5, velocity: 104 },

      { id: 'l8', pitch: 76, startBeat: 8, durationBeats: 0.75, velocity: 110 },
      { id: 'l9', pitch: 74, startBeat: 8.75, durationBeats: 0.75, velocity: 105 },
      { id: 'l10', pitch: 72, startBeat: 9.5, durationBeats: 1.0, velocity: 102 },
      { id: 'l11', pitch: 69, startBeat: 10.5, durationBeats: 1.2, velocity: 100 },

      { id: 'l12', pitch: 71, startBeat: 12, durationBeats: 1.0, velocity: 105 },
      { id: 'l13', pitch: 74, startBeat: 13, durationBeats: 1.0, velocity: 108 },
      { id: 'l14', pitch: 76, startBeat: 14, durationBeats: 1.8, velocity: 112 }
    ]
  }

  const tracks: Track[] = [
    {
      id: 'track_drums',
      name: 'Punchy Drums',
      type: 'audio',
      color: '#ff3d00',
      volume: 0.85,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      clips: [drumClip1, drumClip2],
      automationLanes: [
        {
          id: 'auto_drums_vol',
          param: 'volume',
          enabled: false,
          points: [
            { id: 'dp1', beat: 0, value: 0.85 },
            { id: 'dp2', beat: 16, value: 0.85 }
          ]
        }
      ],
      effects: {
        ...defaultEffects,
        compressor: {
          ...defaultEffects.compressor,
          enabled: true,
          threshold: -16,
          ratio: 4.0
        }
      }
    },
    {
      id: 'track_bass',
      name: 'Sub & Bass',
      type: 'audio',
      color: '#ffea00',
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      clips: [bassClip1, bassClip2],
      automationLanes: [
        {
          id: 'auto_bass_vol',
          param: 'volume',
          enabled: false,
          points: [
            { id: 'bp1', beat: 0, value: 0.8 },
            { id: 'bp2', beat: 16, value: 0.8 }
          ]
        }
      ],
      effects: {
        ...defaultEffects,
        eq: {
          ...defaultEffects.eq,
          enabled: true,
          lowGain: 3.5,
          lowFreq: 80
        }
      }
    },
    {
      id: 'track_chords',
      name: 'Poly Chords',
      type: 'midi',
      color: '#7c4dff',
      volume: 0.75,
      pan: -0.2,
      muted: false,
      soloed: false,
      armed: false,
      clips: [chordsClip],
      automationLanes: [
        {
          id: 'auto_chords_pan',
          param: 'pan',
          enabled: true,
          points: [
            { id: 'ap1', beat: 0, value: -0.4 },
            { id: 'ap2', beat: 8, value: 0.4 },
            { id: 'ap3', beat: 16, value: -0.4 }
          ]
        }
      ],
      effects: {
        ...defaultEffects,
        delay: {
          enabled: true,
          time: 0.375,
          feedback: 0.45,
          mix: 0.35,
          dampFreq: 4000
        }
      },
      synthSettings: {
        ...defaultSynthSettings,
        osc1Type: 'sawtooth',
        osc2Type: 'triangle',
        osc2Detune: 5,
        attack: 0.05,
        decay: 0.3,
        sustain: 0.7,
        release: 0.4,
        filterCutoff: 3200,
        filterResonance: 2.0
      }
    },
    {
      id: 'track_lead',
      name: 'Lead Synth',
      type: 'midi',
      color: '#00e5ff',
      volume: 0.78,
      pan: 0.2,
      muted: false,
      soloed: false,
      armed: true,
      clips: [leadClip],
      automationLanes: [
        {
          id: 'auto_lead_vol',
          param: 'volume',
          enabled: false,
          points: [
            { id: 'lp1', beat: 0, value: 0.78 },
            { id: 'lp2', beat: 16, value: 0.78 }
          ]
        }
      ],
      effects: {
        ...defaultEffects,
        delay: {
          enabled: true,
          time: 0.25,
          feedback: 0.4,
          mix: 0.28,
          dampFreq: 5000
        }
      },
      synthSettings: {
        ...defaultSynthSettings,
        osc1Type: 'sawtooth',
        osc2Type: 'square',
        osc2Detune: 8,
        attack: 0.015,
        decay: 0.15,
        sustain: 0.5,
        release: 0.25,
        filterCutoff: 4500,
        filterResonance: 3.5
      }
    }
  ]

  return tracks
}
