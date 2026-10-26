import React, { useState } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import { midiManager } from '../../audio/midiManager'
import { useAppDispatch, useAppSelector } from '../../store'
import { toggleKeyboard } from '../../store/uiSlice'

const KEY_MAPPINGS = [
  { note: 'C', key: 'A', isBlack: false, pitchOffset: 0 },
  { note: 'C#', key: 'W', isBlack: true, pitchOffset: 1 },
  { note: 'D', key: 'S', isBlack: false, pitchOffset: 2 },
  { note: 'D#', key: 'E', isBlack: true, pitchOffset: 3 },
  { note: 'E', key: 'D', isBlack: false, pitchOffset: 4 },
  { note: 'F', key: 'F', isBlack: false, pitchOffset: 5 },
  { note: 'F#', key: 'T', isBlack: true, pitchOffset: 6 },
  { note: 'G', key: 'G', isBlack: false, pitchOffset: 7 },
  { note: 'G#', key: 'Y', isBlack: true, pitchOffset: 8 },
  { note: 'A', key: 'H', isBlack: false, pitchOffset: 9 },
  { note: 'A#', key: 'U', isBlack: true, pitchOffset: 10 },
  { note: 'B', key: 'J', isBlack: false, pitchOffset: 11 },
  { note: 'C', key: 'K', isBlack: false, pitchOffset: 12 },
  { note: 'C#', key: 'O', isBlack: true, pitchOffset: 13 },
  { note: 'D', key: 'L', isBlack: false, pitchOffset: 14 }
]

export const VirtualKeyboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const keyboardOpen = useAppSelector((state) => state.ui.keyboardOpen)
  const [octave, setOctave] = useState(0)

  if (!keyboardOpen) return null

  const handleOctaveChange = (delta: number) => {
    const newOctave = Math.max(-2, Math.min(2, octave + delta))
    setOctave(newOctave)
    midiManager.setOctaveOffset(newOctave)
  }

  const handleNoteDown = (pitchOffset: number) => {
    const pitch = 60 + octave * 12 + pitchOffset
    ;(midiManager as any).listeners.forEach((l: any) => l.onNoteOn(pitch, 100))
  }

  const handleNoteUp = (pitchOffset: number) => {
    const pitch = 60 + octave * 12 + pitchOffset
    ;(midiManager as any).listeners.forEach((l: any) => l.onNoteOff(pitch))
  }

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#161824',
        border: '1px solid #282c3f',
        p: 1.5,
        borderRadius: 2,
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon sx={{ color: '#00e5ff', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#eceff4' }}>
            Musical Typing & Web MIDI
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOctaveChange(-1)}
            sx={{ minWidth: 28, height: 22, p: 0, fontSize: '0.65rem' }}
          >
            -Oct (Z)
          </Button>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#00e5ff' }}>
            Octave: {octave > 0 ? `+${octave}` : octave}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOctaveChange(1)}
            sx={{ minWidth: 28, height: 22, p: 0, fontSize: '0.65rem' }}
          >
            +Oct (X)
          </Button>

          <Button
            size="small"
            variant="text"
            onClick={() => dispatch(toggleKeyboard())}
            sx={{ minWidth: 24, height: 20, p: 0, color: '#8b91a7', ml: 1 }}
          >
            Close
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          height: 90,
          backgroundColor: '#0d0e14',
          p: 0.5,
          borderRadius: 1
        }}
      >
        {KEY_MAPPINGS.filter((k) => !k.isBlack).map((k) => (
          <Box
            key={k.key}
            onPointerDown={() => handleNoteDown(k.pitchOffset)}
            onPointerUp={() => handleNoteUp(k.pitchOffset)}
            sx={{
              width: 32,
              height: 80,
              backgroundColor: '#eceff4',
              color: '#10111a',
              border: '1px solid #232736',
              borderRadius: '0 0 3px 3px',
              mr: 0.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              pb: 0.5,
              cursor: 'pointer',
              userSelect: 'none',
              '&:active': {
                backgroundColor: '#00e5ff'
              }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800 }}>
              {k.key}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#686e85' }}>
              {k.note}
            </Typography>
          </Box>
        ))}

        <Box sx={{ position: 'absolute', top: 4, left: 4, right: 4, pointerEvents: 'none', display: 'flex' }}>
          <Box sx={{ width: 20 }} />
          <Box
            onPointerDown={() => handleNoteDown(1)}
            onPointerUp={() => handleNoteUp(1)}
            sx={{
              width: 20,
              height: 50,
              backgroundColor: '#161824',
              color: '#eceff4',
              borderRadius: '0 0 2px 2px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              pb: 0.5,
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              border: '1px solid #353a4f',
              '&:active': { backgroundColor: '#7c4dff' }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800 }}>
              W
            </Typography>
          </Box>

          <Box sx={{ width: 14 }} />
          <Box
            onPointerDown={() => handleNoteDown(3)}
            onPointerUp={() => handleNoteUp(3)}
            sx={{
              width: 20,
              height: 50,
              backgroundColor: '#161824',
              color: '#eceff4',
              borderRadius: '0 0 2px 2px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              pb: 0.5,
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              border: '1px solid #353a4f',
              '&:active': { backgroundColor: '#7c4dff' }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800 }}>
              E
            </Typography>
          </Box>

          <Box sx={{ width: 48 }} />
          <Box
            onPointerDown={() => handleNoteDown(6)}
            onPointerUp={() => handleNoteUp(6)}
            sx={{
              width: 20,
              height: 50,
              backgroundColor: '#161824',
              color: '#eceff4',
              borderRadius: '0 0 2px 2px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              pb: 0.5,
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              border: '1px solid #353a4f',
              '&:active': { backgroundColor: '#7c4dff' }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800 }}>
              T
            </Typography>
          </Box>

          <Box sx={{ width: 14 }} />
          <Box
            onPointerDown={() => handleNoteDown(8)}
            onPointerUp={() => handleNoteUp(8)}
            sx={{
              width: 20,
              height: 50,
              backgroundColor: '#161824',
              color: '#eceff4',
              borderRadius: '0 0 2px 2px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              pb: 0.5,
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              border: '1px solid #353a4f',
              '&:active': { backgroundColor: '#7c4dff' }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800 }}>
              Y
            </Typography>
          </Box>

          <Box sx={{ width: 14 }} />
          <Box
            onPointerDown={() => handleNoteDown(10)}
            onPointerUp={() => handleNoteUp(10)}
            sx={{
              width: 20,
              height: 50,
              backgroundColor: '#161824',
              color: '#eceff4',
              borderRadius: '0 0 2px 2px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              pb: 0.5,
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              border: '1px solid #353a4f',
              '&:active': { backgroundColor: '#7c4dff' }
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800 }}>
              U
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}
