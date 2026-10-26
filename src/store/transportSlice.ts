import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TimeSignature } from '../types/daw'

export interface TransportState {
  isPlaying: boolean
  isRecording: boolean
  bpm: number
  timeSignature: TimeSignature
  playheadBeat: number
  loopEnabled: boolean
  loopStartBeat: number
  loopEndBeat: number
  masterVolume: number
  metronome: boolean
}

const initialState: TransportState = {
  isPlaying: false,
  isRecording: false,
  bpm: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  playheadBeat: 0,
  loopEnabled: true,
  loopStartBeat: 0,
  loopEndBeat: 16,
  masterVolume: 1.0,
  metronome: false
}

export const transportSlice = createSlice({
  name: 'transport',
  initialState,
  reducers: {
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload
    },
    setIsRecording(state, action: PayloadAction<boolean>) {
      state.isRecording = action.payload
    },
    setBpm(state, action: PayloadAction<number>) {
      state.bpm = Math.max(30, Math.min(300, action.payload))
    },
    setTimeSignature(state, action: PayloadAction<TimeSignature>) {
      state.timeSignature = action.payload
    },
    setPlayheadBeat(state, action: PayloadAction<number>) {
      state.playheadBeat = Math.max(0, action.payload)
    },
    setLoopEnabled(state, action: PayloadAction<boolean>) {
      state.loopEnabled = action.payload
    },
    setLoopPoints(state, action: PayloadAction<{ start: number; end: number }>) {
      state.loopStartBeat = Math.max(0, action.payload.start)
      state.loopEndBeat = Math.max(state.loopStartBeat + 1, action.payload.end)
    },
    setMasterVolume(state, action: PayloadAction<number>) {
      state.masterVolume = Math.max(0, Math.min(2, action.payload))
    },
    toggleMetronome(state) {
      state.metronome = !state.metronome
    }
  }
})

export const {
  setIsPlaying,
  setIsRecording,
  setBpm,
  setTimeSignature,
  setPlayheadBeat,
  setLoopEnabled,
  setLoopPoints,
  setMasterVolume,
  toggleMetronome
} = transportSlice.actions

export default transportSlice.reducer
