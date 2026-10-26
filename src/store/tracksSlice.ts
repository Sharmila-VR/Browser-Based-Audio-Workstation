import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  AutomationParam,
  AutomationPoint,
  Clip,
  GridSnap,
  Note,
  SynthSettings,
  Track,
  TrackEffects
} from '../types/daw'
import { defaultSynthSettings } from '../audio/synthEngine'
import { quantizeNotes } from '../utils/quantize'

export const defaultEffects: TrackEffects = {
  eq: {
    enabled: true,
    lowGain: 0,
    lowFreq: 100,
    midGain: 0,
    midFreq: 1000,
    midQ: 1.0,
    highGain: 0,
    highFreq: 6000
  },
  compressor: {
    enabled: false,
    threshold: -18,
    ratio: 3.5,
    attack: 0.015,
    release: 0.12,
    knee: 6,
    makeupGain: 0
  },
  delay: {
    enabled: false,
    time: 0.35,
    feedback: 0.4,
    mix: 0.3,
    dampFreq: 3500
  }
}

export interface TracksState {
  tracks: Track[]
}

const initialState: TracksState = {
  tracks: []
}

export const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    setTracks(state, action: PayloadAction<Track[]>) {
      state.tracks = action.payload
    },
    addTrack(state, action: PayloadAction<{ name: string; type: 'audio' | 'midi' }>) {
      const colors = ['#00e5ff', '#7c4dff', '#ff3d00', '#00e676', '#ffea00', '#e040fb']
      const color = colors[state.tracks.length % colors.length]
      const newTrack: Track = {
        id: 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: action.payload.name,
        type: action.payload.type,
        color,
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        armed: false,
        clips: [],
        automationLanes: [
          {
            id: 'auto_vol_' + Date.now(),
            param: 'volume',
            enabled: false,
            points: [
              { id: 'p1', beat: 0, value: 0.8 },
              { id: 'p2', beat: 16, value: 0.8 }
            ]
          }
        ],
        effects: JSON.parse(JSON.stringify(defaultEffects)),
        synthSettings: action.payload.type === 'midi' ? { ...defaultSynthSettings } : undefined
      }
      state.tracks.push(newTrack)
    },
    removeTrack(state, action: PayloadAction<string>) {
      state.tracks = state.tracks.filter((t) => t.id !== action.payload)
    },
    setTrackVolume(state, action: PayloadAction<{ trackId: string; volume: number }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        track.volume = Math.max(0, Math.min(2, action.payload.volume))
      }
    },
    setTrackPan(state, action: PayloadAction<{ trackId: string; pan: number }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        track.pan = Math.max(-1, Math.min(1, action.payload.pan))
      }
    },
    toggleTrackMute(state, action: PayloadAction<string>) {
      const track = state.tracks.find((t) => t.id === action.payload)
      if (track) {
        track.muted = !track.muted
      }
    },
    toggleTrackSolo(state, action: PayloadAction<string>) {
      const track = state.tracks.find((t) => t.id === action.payload)
      if (track) {
        track.soloed = !track.soloed
      }
    },
    toggleTrackArm(state, action: PayloadAction<string>) {
      state.tracks.forEach((t) => {
        if (t.id === action.payload) {
          t.armed = !t.armed
        } else {
          t.armed = false
        }
      })
    },
    updateTrackEffects(state, action: PayloadAction<{ trackId: string; effects: TrackEffects }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        track.effects = action.payload.effects
      }
    },
    updateSynthSettings(state, action: PayloadAction<{ trackId: string; settings: SynthSettings }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        track.synthSettings = action.payload.settings
      }
    },
    addClip(state, action: PayloadAction<{ trackId: string; clip: Clip }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        track.clips.push(action.payload.clip)
      }
    },
    removeClip(state, action: PayloadAction<{ trackId: string; clipId: string }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        track.clips = track.clips.filter((c) => c.id !== action.payload.clipId)
      }
    },
    updateClip(
      state,
      action: PayloadAction<{
        trackId: string
        clipId: string
        changes: Partial<Clip>
      }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (track) {
        const clipIdx = track.clips.findIndex((c) => c.id === action.payload.clipId)
        if (clipIdx !== -1) {
          track.clips[clipIdx] = { ...track.clips[clipIdx], ...action.payload.changes } as Clip
        }
      }
    },
    splitClipAtBeat(
      state,
      action: PayloadAction<{ trackId: string; clipId: string; splitBeat: number }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return

      const clip = track.clips.find((c) => c.id === action.payload.clipId)
      if (!clip) return

      const { splitBeat } = action.payload
      if (splitBeat <= clip.startBeat || splitBeat >= clip.startBeat + clip.durationBeats) {
        return
      }

      const firstPartDuration = splitBeat - clip.startBeat
      const secondPartDuration = clip.durationBeats - firstPartDuration

      const secondClipId = 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)

      if (clip.type === 'audio') {
        const secondClip: Clip = {
          ...clip,
          id: secondClipId,
          startBeat: splitBeat,
          durationBeats: secondPartDuration,
          offsetBeats: clip.offsetBeats + firstPartDuration
        }
        clip.durationBeats = firstPartDuration
        track.clips.push(secondClip)
      } else if (clip.type === 'midi') {
        const firstNotes: Note[] = []
        const secondNotes: Note[] = []

        clip.notes.forEach((n) => {
          if (n.startBeat < firstPartDuration) {
            firstNotes.push(n)
          } else {
            secondNotes.push({
              ...n,
              startBeat: n.startBeat - firstPartDuration
            })
          }
        })

        const secondClip: Clip = {
          ...clip,
          id: secondClipId,
          startBeat: splitBeat,
          durationBeats: secondPartDuration,
          notes: secondNotes
        }
        clip.durationBeats = firstPartDuration
        clip.notes = firstNotes
        track.clips.push(secondClip)
      }
    },
    toggleAutomationLane(
      state,
      action: PayloadAction<{ trackId: string; param: AutomationParam }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return

      let lane = track.automationLanes.find((l) => l.param === action.payload.param)
      if (!lane) {
        lane = {
          id: 'lane_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          param: action.payload.param,
          enabled: true,
          points: [
            { id: 'p1', beat: 0, value: 0.8 },
            { id: 'p2', beat: 16, value: 0.8 }
          ]
        }
        track.automationLanes.push(lane)
      } else {
        lane.enabled = !lane.enabled
      }
    },
    addOrUpdateAutomationPoint(
      state,
      action: PayloadAction<{
        trackId: string
        laneId: string
        point: AutomationPoint
      }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return
      const lane = track.automationLanes.find((l) => l.id === action.payload.laneId)
      if (!lane) return

      const idx = lane.points.findIndex((p) => Math.abs(p.beat - action.payload.point.beat) < 0.1)
      if (idx !== -1) {
        lane.points[idx] = action.payload.point
      } else {
        lane.points.push(action.payload.point)
        lane.points.sort((a, b) => a.beat - b.beat)
      }
    },
    removeAutomationPoint(
      state,
      action: PayloadAction<{ trackId: string; laneId: string; pointId: string }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return
      const lane = track.automationLanes.find((l) => l.id === action.payload.laneId)
      if (!lane) return
      lane.points = lane.points.filter((p) => p.id !== action.payload.pointId)
    },
    addNoteToMidiClip(
      state,
      action: PayloadAction<{ trackId: string; clipId: string; note: Note }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return
      const clip = track.clips.find((c) => c.id === action.payload.clipId)
      if (clip && clip.type === 'midi') {
        clip.notes.push(action.payload.note)
      }
    },
    removeNoteFromMidiClip(
      state,
      action: PayloadAction<{ trackId: string; clipId: string; noteId: string }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return
      const clip = track.clips.find((c) => c.id === action.payload.clipId)
      if (clip && clip.type === 'midi') {
        clip.notes = clip.notes.filter((n) => n.id !== action.payload.noteId)
      }
    },
    updateNoteInMidiClip(
      state,
      action: PayloadAction<{
        trackId: string
        clipId: string
        noteId: string
        changes: Partial<Note>
      }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return
      const clip = track.clips.find((c) => c.id === action.payload.clipId)
      if (clip && clip.type === 'midi') {
        const note = clip.notes.find((n) => n.id === action.payload.noteId)
        if (note) {
          Object.assign(note, action.payload.changes)
        }
      }
    },
    quantizeMidiClip(
      state,
      action: PayloadAction<{
        trackId: string
        clipId: string
        grid: GridSnap
        strength?: number
      }>
    ) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId)
      if (!track) return
      const clip = track.clips.find((c) => c.id === action.payload.clipId)
      if (clip && clip.type === 'midi') {
        clip.notes = quantizeNotes(clip.notes, action.payload.grid, action.payload.strength ?? 1.0)
      }
    }
  }
})

export const {
  setTracks,
  addTrack,
  removeTrack,
  setTrackVolume,
  setTrackPan,
  toggleTrackMute,
  toggleTrackSolo,
  toggleTrackArm,
  updateTrackEffects,
  updateSynthSettings,
  addClip,
  removeClip,
  updateClip,
  splitClipAtBeat,
  toggleAutomationLane,
  addOrUpdateAutomationPoint,
  removeAutomationPoint,
  addNoteToMidiClip,
  removeNoteFromMidiClip,
  updateNoteInMidiClip,
  quantizeMidiClip
} = tracksSlice.actions

export default tracksSlice.reducer
