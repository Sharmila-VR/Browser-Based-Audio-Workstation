import React, { useRef, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import { audioEngine } from '../../audio/audioEngine'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  addNoteToMidiClip,
  removeNoteFromMidiClip,
  updateNoteInMidiClip,
  quantizeMidiClip
} from '../../store/tracksSlice'
import { closePianoRoll, announce } from '../../store/uiSlice'
import { GridSnap, MidiClip, Note } from '../../types/daw'
import { snapBeatToGrid } from '../../utils/tempoMath'
import { VelocityLane } from './VelocityLane'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const PianoRollModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const trackId = useAppSelector((state) => state.ui.pianoRollTrackId)
  const clipId = useAppSelector((state) => state.ui.pianoRollClipId)
  const tracks = useAppSelector((state) => state.tracks.tracks)

  const [quantizeSnap, setQuantizeSnap] = useState<GridSnap>('1/16')
  const [gridSnap, setGridSnap] = useState<GridSnap>('1/16')

  const track = tracks.find((t) => t.id === trackId)
  const clip = track?.clips.find((c) => c.id === clipId) as MidiClip | undefined

  const minPitch = 36
  const maxPitch = 84
  const numPitches = maxPitch - minPitch + 1
  const rowHeight = 16
  const beatWidth = 50
  const totalBeats = clip ? clip.durationBeats : 16

  const gridRef = useRef<HTMLDivElement | null>(null)

  if (!track || !clip || clip.type !== 'midi') {
    return null
  }

  const handleClose = () => {
    dispatch(closePianoRoll())
  }

  const handleKeyClick = (pitch: number) => {
    audioEngine.playSynthNote(track.id, pitch, 100, 0, 0.5, track.synthSettings)
  }

  const handleGridClick = (e: React.MouseEvent) => {
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const rowIndex = Math.floor(clickY / rowHeight)
    const pitch = maxPitch - rowIndex
    const rawBeat = clickX / beatWidth
    const startBeat = snapBeatToGrid(rawBeat, gridSnap)

    const newNote: Note = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      pitch,
      startBeat,
      durationBeats: 1.0,
      velocity: 100
    }

    dispatch(addNoteToMidiClip({ trackId: track.id, clipId: clip.id, note: newNote }))
    audioEngine.playSynthNote(track.id, pitch, 100, 0, 0.3, track.synthSettings)
  }

  const handleNoteDrag = (e: React.PointerEvent, note: Note) => {
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const isEdgeResize = e.clientX - rect.left > rect.width - 8
    target.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    const origStartBeat = note.startBeat
    const origDuration = note.durationBeats
    const origPitch = note.pitch

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaBeats = deltaX / beatWidth

      if (isEdgeResize) {
        const rawDuration = Math.max(0.125, origDuration + deltaBeats)
        const snappedDuration = snapBeatToGrid(rawDuration, gridSnap)
        dispatch(
          updateNoteInMidiClip({
            trackId: track.id,
            clipId: clip.id,
            noteId: note.id,
            changes: { durationBeats: Math.max(0.125, snappedDuration) }
          })
        )
      } else {
        const deltaY = moveEvent.clientY - startY
        const pitchDelta = -Math.round(deltaY / rowHeight)
        const newPitch = Math.max(minPitch, Math.min(maxPitch, origPitch + pitchDelta))
        const rawStart = Math.max(0, origStartBeat + deltaBeats)
        const snappedStart = snapBeatToGrid(rawStart, gridSnap)

        dispatch(
          updateNoteInMidiClip({
            trackId: track.id,
            clipId: clip.id,
            noteId: note.id,
            changes: {
              pitch: newPitch,
              startBeat: snappedStart
            }
          })
        )
      }
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const handleNoteDoubleClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    dispatch(removeNoteFromMidiClip({ trackId: track.id, clipId: clip.id, noteId }))
  }

  const handleQuantize = () => {
    dispatch(
      quantizeMidiClip({
        trackId: track.id,
        clipId: clip.id,
        grid: quantizeSnap
      })
    )
    dispatch(announce(`Quantized notes to ${quantizeSnap}`))
  }

  return (
    <Dialog open={true} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: '#151622',
          borderBottom: '1px solid #232736',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Piano Roll - {clip.name} ({track.name})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#8b91a7' }}>
              Snap:
            </Typography>
            <FormControl size="small">
              <Select
                value={gridSnap}
                onChange={(e) => setGridSnap(e.target.value as GridSnap)}
                sx={{ height: 26, fontSize: '0.75rem', backgroundColor: '#1d1f2b' }}
              >
                <MenuItem value="1/4">1/4</MenuItem>
                <MenuItem value="1/8">1/8</MenuItem>
                <MenuItem value="1/16">1/16</MenuItem>
                <MenuItem value="1/32">1/32</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoFixHighIcon />}
            onClick={handleQuantize}
            sx={{ fontSize: '0.72rem', py: 0.3 }}
          >
            Quantize
          </Button>

          <IconButton size="small" onClick={handleClose} sx={{ color: '#8b91a7' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#0d0e14', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', flex: 1, maxHeight: 420, overflow: 'auto' }}>
          <Box sx={{ width: 60, minWidth: 60, backgroundColor: '#14151f', borderRight: '1px solid #232736' }}>
            {Array.from({ length: numPitches }).map((_, index) => {
              const pitch = maxPitch - index
              const noteIndex = pitch % 12
              const octave = Math.floor(pitch / 12) - 1
              const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex)

              return (
                <Box
                  key={pitch}
                  onClick={() => handleKeyClick(pitch)}
                  sx={{
                    height: rowHeight,
                    backgroundColor: isBlackKey ? '#1f2230' : '#eceff4',
                    color: isBlackKey ? '#eceff4' : '#10111a',
                    borderBottom: '1px solid #2d3042',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 0.5,
                    fontSize: '0.6rem',
                    fontWeight: noteIndex === 0 ? 800 : 500,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': {
                      backgroundColor: isBlackKey ? '#33374d' : '#ffffff'
                    }
                  }}
                >
                  {noteIndex === 0 ? `C${octave}` : isBlackKey ? NOTE_NAMES[noteIndex] : ''}
                </Box>
              )
            })}
          </Box>

          <Box
            ref={gridRef}
            onClick={handleGridClick}
            sx={{
              position: 'relative',
              width: totalBeats * beatWidth,
              minWidth: totalBeats * beatWidth,
              height: numPitches * rowHeight,
              backgroundColor: '#101118',
              cursor: 'crosshair',
              overflow: 'hidden'
            }}
          >
            {Array.from({ length: numPitches }).map((_, index) => {
              const pitch = maxPitch - index
              const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12)
              return (
                <Box
                  key={pitch}
                  sx={{
                    position: 'absolute',
                    top: index * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                    backgroundColor: isBlackKey ? '#141520' : '#11121b',
                    borderBottom: '1px solid #1a1c28',
                    pointerEvents: 'none'
                  }}
                />
              )
            })}

            {Array.from({ length: totalBeats * 4 }).map((_, beatIdx) => {
              const left = (beatIdx / 4) * beatWidth
              const isBar = beatIdx % 16 === 0
              const isBeat = beatIdx % 4 === 0
              return (
                <Box
                  key={beatIdx}
                  sx={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: isBar ? '#2e3347' : isBeat ? '#212433' : '#171924',
                    pointerEvents: 'none'
                  }}
                />
              )
            })}

            {clip.notes.map((note) => {
              const rowIndex = maxPitch - note.pitch
              const top = rowIndex * rowHeight
              const left = note.startBeat * beatWidth
              const width = Math.max(4, note.durationBeats * beatWidth)

              return (
                <Box
                  key={note.id}
                  onPointerDown={(e) => handleNoteDrag(e, note)}
                  onDoubleClick={(e) => handleNoteDoubleClick(e, note.id)}
                  sx={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top + 1}px`,
                    width: `${width}px`,
                    height: `${rowHeight - 2}px`,
                    backgroundColor: track.color,
                    borderRadius: 0.5,
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
                    cursor: 'grab',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.5,
                    overflow: 'hidden'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.55rem',
                      color: '#ffffff',
                      fontWeight: 700,
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  >
                    {NOTE_NAMES[note.pitch % 12]}
                  </Typography>

                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      cursor: 'ew-resize'
                    }}
                  />
                </Box>
              )
            })}
          </Box>
        </Box>

        <VelocityLane
          trackId={track.id}
          clipId={clip.id}
          notes={clip.notes}
          totalBeats={totalBeats}
          beatWidth={beatWidth}
          trackColor={track.color}
        />
      </DialogContent>

      <DialogActions sx={{ backgroundColor: '#151622', borderTop: '1px solid #232736', px: 2, py: 1 }}>
        <Typography variant="caption" sx={{ color: '#8b91a7', mr: 'auto' }}>
          Click grid to add note | Drag note to move/pitch | Drag right edge to resize | Double click note to delete
        </Typography>
        <Button onClick={handleClose} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
