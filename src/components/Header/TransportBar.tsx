import React from 'react'
import {
  Box,
  IconButton,
  Button,
  Typography,
  Slider,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import StopIcon from '@mui/icons-material/Stop'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import LoopIcon from '@mui/icons-material/Loop'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import TuneIcon from '@mui/icons-material/Tune'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SaveIcon from '@mui/icons-material/Save'
import HelpIcon from '@mui/icons-material/Help'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { audioEngine } from '../../audio/audioEngine'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  setIsPlaying,
  setIsRecording,
  setPlayheadBeat,
  setBpm,
  setTimeSignature,
  setLoopEnabled,
  setMasterVolume
} from '../../store/transportSlice'
import { setTracks } from '../../store/tracksSlice'
import {
  toggleMixer,
  toggleKeyboard,
  setExportModalOpen,
  setShortcutsModalOpen,
  announce
} from '../../store/uiSlice'
import { undoRedoStack } from '../../store/history'
import { formatBarsBeats, formatTime, beatsToSeconds } from '../../utils/tempoMath'
import { saveProjectToStorage } from '../../utils/indexedDB'

interface TransportBarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export const TransportBar: React.FC<TransportBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const dispatch = useAppDispatch()
  const isPlaying = useAppSelector((state) => state.transport.isPlaying)
  const isRecording = useAppSelector((state) => state.transport.isRecording)
  const bpm = useAppSelector((state) => state.transport.bpm)
  const timeSignature = useAppSelector((state) => state.transport.timeSignature)
  const playheadBeat = useAppSelector((state) => state.transport.playheadBeat)
  const loopEnabled = useAppSelector((state) => state.transport.loopEnabled)
  const masterVolume = useAppSelector((state) => state.transport.masterVolume)
  const mixerOpen = useAppSelector((state) => state.ui.mixerOpen)
  const keyboardOpen = useAppSelector((state) => state.ui.keyboardOpen)
  const tracks = useAppSelector((state) => state.tracks.tracks)
  const loopStart = useAppSelector((state) => state.transport.loopStartBeat)
  const loopEnd = useAppSelector((state) => state.transport.loopEndBeat)

  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.stopPlayback()
      dispatch(setIsPlaying(false))
      dispatch(setIsRecording(false))
      dispatch(announce('Playback stopped'))
    } else {
      audioEngine.startPlayback(
        playheadBeat,
        bpm,
        () => tracks,
        () => ({ enabled: loopEnabled, startBeat: loopStart, endBeat: loopEnd })
      )
      dispatch(setIsPlaying(true))
      dispatch(announce(`Playback started at beat ${playheadBeat.toFixed(2)}`))
    }
  }

  const handleStop = () => {
    audioEngine.stopPlayback()
    dispatch(setIsPlaying(false))
    dispatch(setIsRecording(false))
    dispatch(setPlayheadBeat(0))
    dispatch(announce('Playback stopped and returned to start'))
  }

  const handleToggleRecord = () => {
    if (isRecording) {
      dispatch(setIsRecording(false))
      dispatch(announce('Recording stopped'))
    } else {
      if (!isPlaying) {
        handlePlayPause()
      }
      dispatch(setIsRecording(true))
      dispatch(announce('Recording started'))
    }
  }

  const handleSave = async () => {
    try {
      const buffers = (audioEngine as any).audioBuffers || new Map()
      await saveProjectToStorage(
        {
          tracks,
          bpm,
          timeSignature,
          loopEnabled,
          loopStart,
          loopEnd
        },
        buffers
      )
      dispatch(announce('Project saved to IndexedDB storage'))
    } catch {
      dispatch(announce('Failed to save project'))
    }
  }

  const playheadSeconds = beatsToSeconds(playheadBeat, bpm)

  return (
    <Box
      sx={{
        height: 52,
        backgroundColor: '#12131c',
        borderBottom: '2px solid #232736',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        userSelect: 'none'
      }}
      role="toolbar"
      aria-label="DAW Transport Bar"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            letterSpacing: 1.5,
            fontSize: '1.05rem',
            background: 'linear-gradient(45deg, #00e5ff 30%, #7c4dff 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mr: 1
          }}
        >
          AURADAW
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#181a28', p: 0.4, borderRadius: 1 }}>
          <Tooltip title="Return to start (Enter / Home)">
            <IconButton size="small" onClick={handleStop} sx={{ color: '#8b91a7' }} aria-label="Stop playback">
              <StopIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
            <IconButton
              size="small"
              onClick={handlePlayPause}
              color={isPlaying ? 'primary' : 'default'}
              sx={{
                backgroundColor: isPlaying ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                color: isPlaying ? '#00e5ff' : '#eceff4'
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 22 }} /> : <PlayArrowIcon sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Record (R)">
            <IconButton
              size="small"
              onClick={handleToggleRecord}
              color={isRecording ? 'error' : 'default'}
              sx={{
                backgroundColor: isRecording ? 'rgba(255, 61, 0, 0.2)' : 'transparent',
                color: isRecording ? '#ff3d00' : '#8b91a7',
                animation: isRecording ? 'pulse 1s infinite' : 'none'
              }}
              aria-label="Record"
            >
              <FiberManualRecordIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Loop">
            <IconButton
              size="small"
              onClick={() => dispatch(setLoopEnabled(!loopEnabled))}
              color={loopEnabled ? 'primary' : 'default'}
              sx={{
                color: loopEnabled ? '#00e5ff' : '#686e85',
                backgroundColor: loopEnabled ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
              }}
              aria-label="Toggle Loop"
            >
              <LoopIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            backgroundColor: '#0a0b10',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            border: '1px solid #1e2230',
            fontFamily: 'monospace'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#686e85', fontSize: '0.6rem', display: 'block' }}>
              BAR.BEAT.16TH
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#00e5ff', fontSize: '0.85rem' }}>
              {formatBarsBeats(playheadBeat, timeSignature)}
            </Typography>
          </Box>

          <Box sx={{ width: 1, height: 24, backgroundColor: '#1e2230' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#686e85', fontSize: '0.6rem', display: 'block' }}>
              TIME
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#eceff4', fontSize: '0.85rem' }}>
              {formatTime(playheadSeconds)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 700, fontSize: '0.75rem' }}>
              BPM:
            </Typography>
            <TextField
              type="number"
              size="small"
              value={bpm}
              onChange={(e) => dispatch(setBpm(Number(e.target.value)))}
              sx={{
                width: 65,
                '& .MuiInputBase-input': {
                  py: 0.3,
                  px: 0.8,
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  backgroundColor: '#181a28'
                }
              }}
              slotProps={{ htmlInput: { min: 40, max: 240 } }}
            />
          </Box>

          <FormControl size="small">
            <Select
              value={`${timeSignature.numerator}/${timeSignature.denominator}`}
              onChange={(e) => {
                const [num, den] = (e.target.value as string).split('/').map(Number)
                dispatch(setTimeSignature({ numerator: num, denominator: den }))
              }}
              sx={{
                height: 28,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#181a28',
                color: '#eceff4'
              }}
            >
              <MenuItem value="4/4">4/4</MenuItem>
              <MenuItem value="3/4">3/4</MenuItem>
              <MenuItem value="6/8">6/8</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={onUndo} disabled={!canUndo} sx={{ color: '#8b91a7' }}>
                <UndoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton size="small" onClick={onRedo} disabled={!canRedo} sx={{ color: '#8b91a7' }}>
                <RedoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Box sx={{ width: 1, height: 24, backgroundColor: '#232736' }} />

        <Button
          size="small"
          variant={mixerOpen ? 'contained' : 'outlined'}
          color="primary"
          startIcon={<TuneIcon />}
          onClick={() => dispatch(toggleMixer())}
          sx={{ fontSize: '0.75rem', py: 0.4 }}
        >
          Mixer
        </Button>

        <Button
          size="small"
          variant={keyboardOpen ? 'contained' : 'outlined'}
          color="secondary"
          startIcon={<KeyboardIcon />}
          onClick={() => dispatch(toggleKeyboard())}
          sx={{ fontSize: '0.75rem', py: 0.4 }}
        >
          Keys
        </Button>

        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ fontSize: '0.75rem', py: 0.4 }}
        >
          Save
        </Button>

        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={() => dispatch(setExportModalOpen(true))}
          sx={{ fontSize: '0.75rem', py: 0.4 }}
        >
          Export WAV
        </Button>

        <Tooltip title="Keyboard Shortcuts & Accessibility Info">
          <IconButton
            size="small"
            onClick={() => dispatch(setShortcutsModalOpen(true))}
            sx={{ color: '#8b91a7' }}
          >
            <HelpIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
