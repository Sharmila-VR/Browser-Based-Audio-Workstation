export type TrackType = 'audio' | 'midi'

export interface AutomationPoint {
  id: string
  beat: number
  value: number
}

export type AutomationParam =
  | 'volume'
  | 'pan'
  | 'eqLow'
  | 'eqMid'
  | 'eqHigh'
  | 'compThreshold'
  | 'delayTime'
  | 'delayFeedback'
  | 'delayMix'

export interface AutomationLane {
  id: string
  param: AutomationParam
  enabled: boolean
  points: AutomationPoint[]
}

export interface Note {
  id: string
  pitch: number
  startBeat: number
  durationBeats: number
  velocity: number
}

export interface BaseClip {
  id: string
  trackId: string
  name: string
  startBeat: number
  durationBeats: number
  offsetBeats: number
  loop: boolean
}

export interface AudioClip extends BaseClip {
  type: 'audio'
  audioBufferId: string
  sampleRate: number
  durationSeconds: number
  peaks?: number[][]
}

export interface MidiClip extends BaseClip {
  type: 'midi'
  notes: Note[]
}

export type Clip = AudioClip | MidiClip

export interface TrackEffects {
  eq: {
    enabled: boolean
    lowGain: number
    lowFreq: number
    midGain: number
    midFreq: number
    midQ: number
    highGain: number
    highFreq: number
  }
  compressor: {
    enabled: boolean
    threshold: number
    ratio: number
    attack: number
    release: number
    knee: number
    makeupGain: number
  }
  delay: {
    enabled: boolean
    time: number
    feedback: number
    mix: number
    dampFreq: number
  }
}

export interface SynthSettings {
  osc1Type: OscillatorType
  osc2Type: OscillatorType
  osc2Detune: number
  oscMix: number
  attack: number
  decay: number
  sustain: number
  release: number
  filterType: BiquadFilterType
  filterCutoff: number
  filterResonance: number
  filterEnvAmount: number
}

export interface Track {
  id: string
  name: string
  type: TrackType
  color: string
  volume: number
  pan: number
  muted: boolean
  soloed: boolean
  armed: boolean
  clips: Clip[]
  automationLanes: AutomationLane[]
  effects: TrackEffects
  synthSettings?: SynthSettings
}

export interface TimeSignature {
  numerator: number
  denominator: number
}

export type GridSnap = 'off' | '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32'

export interface ProjectMetadata {
  id: string
  name: string
  bpm: number
  timeSignature: TimeSignature
  createdAt: number
  updatedAt: number
}

export interface MeterData {
  peakL: number
  peakR: number
  rmsL: number
  rmsR: number
}
