import React, { useEffect, useRef, useState } from 'react'
import { Box, ThemeProvider, CssBaseline } from '@mui/material'
import { dawTheme } from './theme'
import { useAppDispatch, useAppSelector } from './store'
import { audioEngine } from './audio/audioEngine'
import { midiManager } from './audio/midiManager'
import { createDemoProject } from './utils/demoProject'
import { loadProjectFromStorage } from './utils/indexedDB'
import { undoRedoStack } from './store/history'
import { setTracks, addNoteToMidiClip, addClip } from './store/tracksSlice'
import {
  setIsPlaying,
  setIsRecording,
  setPlayheadBeat,
  setBpm,
  setTimeSignature,
  setLoopPoints
} from './store/transportSlice'
import { announce } from './store/uiSlice'
import { MeterData, Note } from './types/daw'
import { TransportBar } from './components/Header/TransportBar'
import { Timeline } from './components/Timeline/Timeline'
import { MixerPanel } from './components/Mixer/MixerPanel'
import { VirtualKeyboard } from './components/Keyboard/VirtualKeyboard'
import { LiveAnnouncer } from './components/Accessibility/LiveAnnouncer'

const PianoRollModal = React.lazy(() =>
  import('./components/PianoRoll/PianoRollModal').then((m) => ({ default: m.PianoRollModal }))
)
const EffectRackModal = React.lazy(() =>
  import('./components/Effects/EffectRackModal').then((m) => ({ default: m.EffectRackModal }))
)
const SynthModal = React.lazy(() =>
  import('./components/Synth/SynthModal').then((m) => ({ default: m.SynthModal }))
)
const ExportModal = React.lazy(() =>
  import('./components/Export/ExportModal').then((m) => ({ default: m.ExportModal }))
)
const ShortcutsModal = React.lazy(() =>
  import('./components/Accessibility/ShortcutsModal').then((m) => ({ default: m.ShortcutsModal }))
)

export const App: React.FC = () => {
  const dispatch = useAppDispatch()
  const tracks = useAppSelector((state) => state.tracks.tracks)
  const isPlaying = useAppSelector((state) => state.transport.isPlaying)
  const isRecording = useAppSelector((state) => state.transport.isRecording)
  const playheadBeat = useAppSelector((state) => state.transport.playheadBeat)
  const bpm = useAppSelector((state) => state.transport.bpm)
  const loopEnabled = useAppSelector((state) => state.transport.loopEnabled)
  const loopStart = useAppSelector((state) => state.transport.loopStartBeat)
  const loopEnd = useAppSelector((state) => state.transport.loopEndBeat)
  const mixerOpen = useAppSelector((state) => state.ui.mixerOpen)

  const [trackMeters, setTrackMeters] = useState<Record<string, MeterData>>({})
  const [masterMeter, setMasterMeter] = useState<MeterData>({
    peakL: -60,
    peakR: -60,
    rmsL: -60,
    rmsR: -60
  })

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const activeNotesRecording = useRef<Map<number, { startBeat: number; velocity: number }>>(
    new Map()
  )

  useEffect(() => {
    const initApp = async () => {
      await audioEngine.init()
      const ctx = audioEngine.getContext()

      try {
        const stored = await loadProjectFromStorage(ctx)
        if (stored && stored.project && stored.project.tracks) {
          for (const [id, buf] of stored.buffers.entries()) {
            audioEngine.storeAudioBuffer(id, buf)
          }
          dispatch(setTracks(stored.project.tracks))
          undoRedoStack.reset(stored.project.tracks)
          if (stored.project.bpm) dispatch(setBpm(stored.project.bpm))
          if (stored.project.timeSignature) dispatch(setTimeSignature(stored.project.timeSignature))
          return
        }
      } catch {
        // Fallback to demo project
      }

      const demoTracks = await createDemoProject(ctx)
      dispatch(setTracks(demoTracks))
      undoRedoStack.reset(demoTracks)
    }

    initApp()
  }, [dispatch])

  useEffect(() => {
    audioEngine.syncTracks(tracks)
    setCanUndo(undoRedoStack.canUndo())
    setCanRedo(undoRedoStack.canRedo())
  }, [tracks])

  useEffect(() => {
    audioEngine.onPlayheadUpdate = (beat: number) => {
      dispatch(setPlayheadBeat(beat))
    }

    audioEngine.onMeterUpdate = (tMeters, mMeter) => {
      setTrackMeters(tMeters)
      setMasterMeter(mMeter)
    }
  }, [dispatch])

  const handleUndo = () => {
    const prev = undoRedoStack.undo()
    if (prev) {
      dispatch(setTracks(prev))
      dispatch(announce('Undo performed'))
    }
  }

  const handleRedo = () => {
    const next = undoRedoStack.redo()
    if (next) {
      dispatch(setTracks(next))
      dispatch(announce('Redo performed'))
    }
  }

  useEffect(() => {
    midiManager.startKeyboardListening()

    const onNoteOn = (pitch: number, velocity: number) => {
      const armedTrack = tracks.find((t) => t.armed && t.type === 'midi')
      if (armedTrack) {
        audioEngine.triggerLiveNoteOn(armedTrack.id, pitch, velocity, armedTrack.synthSettings)

        if (isRecording) {
          activeNotesRecording.current.set(pitch, {
            startBeat: playheadBeat,
            velocity
          })
        }
      }
    }

    const onNoteOff = (pitch: number) => {
      const armedTrack = tracks.find((t) => t.armed && t.type === 'midi')
      if (armedTrack) {
        audioEngine.triggerLiveNoteOff(armedTrack.id, pitch, armedTrack.synthSettings)

        if (isRecording && activeNotesRecording.current.has(pitch)) {
          const recorded = activeNotesRecording.current.get(pitch)!
          activeNotesRecording.current.delete(pitch)
          const durationBeats = Math.max(0.25, playheadBeat - recorded.startBeat)

          let targetClip = armedTrack.clips.find(
            (c) =>
              c.type === 'midi' &&
              recorded.startBeat >= c.startBeat &&
              recorded.startBeat < c.startBeat + c.durationBeats
          )

          if (!targetClip) {
            const newClip = {
              id: 'recorded_clip_' + Date.now(),
              trackId: armedTrack.id,
              name: 'Recorded MIDI',
              startBeat: Math.floor(recorded.startBeat / 4) * 4,
              durationBeats: 16,
              offsetBeats: 0,
              loop: false,
              type: 'midi' as const,
              notes: []
            }
            dispatch(addClip({ trackId: armedTrack.id, clip: newClip }))
            targetClip = newClip
          }

          const newNote: Note = {
            id: 'rec_note_' + Date.now() + '_' + pitch,
            pitch,
            startBeat: Math.max(0, recorded.startBeat - targetClip.startBeat),
            durationBeats,
            velocity: recorded.velocity
          }

          dispatch(
            addNoteToMidiClip({
              trackId: armedTrack.id,
              clipId: targetClip.id,
              note: newNote
            })
          )
        }
      }
    }

    const listener = { onNoteOn, onNoteOff }
    midiManager.addListener(listener)

    return () => {
      midiManager.removeListener(listener)
      midiManager.stopKeyboardListening()
    }
  }, [tracks, isRecording, playheadBeat, dispatch])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) {
          audioEngine.stopPlayback()
          dispatch(setIsPlaying(false))
          dispatch(setIsRecording(false))
        } else {
          audioEngine.startPlayback(
            playheadBeat,
            bpm,
            () => tracks,
            () => ({ enabled: loopEnabled, startBeat: loopStart, endBeat: loopEnd })
          )
          dispatch(setIsPlaying(true))
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        dispatch(setIsRecording(!isRecording))
      } else if (e.code === 'Enter' || e.code === 'Home') {
        audioEngine.stopPlayback()
        dispatch(setIsPlaying(false))
        dispatch(setIsRecording(false))
        dispatch(setPlayheadBeat(0))
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault()
        handleRedo()
      } else if (e.code === 'ArrowRight') {
        dispatch(setPlayheadBeat(playheadBeat + 1))
      } else if (e.code === 'ArrowLeft') {
        dispatch(setPlayheadBeat(Math.max(0, playheadBeat - 1)))
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isPlaying, isRecording, playheadBeat, bpm, loopEnabled, loopStart, loopEnd, tracks, dispatch])

  return (
    <ThemeProvider theme={dawTheme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d0e14',
          overflow: 'hidden'
        }}
      >
        <TransportBar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        <Timeline />

        {mixerOpen && <MixerPanel trackMeters={trackMeters} masterMeter={masterMeter} />}

        <VirtualKeyboard />
        <React.Suspense fallback={null}>
          <PianoRollModal />
          <EffectRackModal />
          <SynthModal />
          <ExportModal />
          <ShortcutsModal />
        </React.Suspense>
        <LiveAnnouncer />
      </Box>
    </ThemeProvider>
  )
}
export default App
