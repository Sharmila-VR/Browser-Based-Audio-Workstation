import React from 'react'
import { Box, Typography } from '@mui/material'
import { Note } from '../../types/daw'
import { useAppDispatch } from '../../store'
import { updateNoteInMidiClip } from '../../store/tracksSlice'

interface VelocityLaneProps {
  trackId: string
  clipId: string
  notes: Note[]
  totalBeats: number
  beatWidth: number
  height?: number
  trackColor: string
}

export const VelocityLane: React.FC<VelocityLaneProps> = ({
  trackId,
  clipId,
  notes,
  beatWidth,
  height = 50,
  trackColor
}) => {
  const dispatch = useAppDispatch()

  const handlePointerDown = (e: React.PointerEvent, note: Note) => {
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = target.parentElement?.getBoundingClientRect()
      if (!rect) return
      const relativeY = moveEvent.clientY - rect.top
      const val = Math.max(1, Math.min(127, Math.round((1 - relativeY / height) * 127)))

      dispatch(
        updateNoteInMidiClip({
          trackId,
          clipId,
          noteId: note.id,
          changes: { velocity: val }
        })
      )
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return (
    <Box
      sx={{
        height,
        backgroundColor: '#10111a',
        borderTop: '1px solid #232736',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 8,
          top: 4,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      >
        <Typography variant="caption" sx={{ color: '#686e85', fontSize: '0.65rem', fontWeight: 700 }}>
          VELOCITY
        </Typography>
      </Box>

      {notes.map((note) => {
        const left = note.startBeat * beatWidth + 2
        const barHeight = (note.velocity / 127) * (height - 12)

        return (
          <Box
            key={note.id}
            onPointerDown={(e) => handlePointerDown(e, note)}
            sx={{
              position: 'absolute',
              left: `${left}px`,
              bottom: 0,
              width: 6,
              height: `${barHeight}px`,
              backgroundColor: trackColor,
              borderRadius: '2px 2px 0 0',
              cursor: 'ns-resize',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
              '&:hover': {
                filter: 'brightness(1.3)'
              }
            }}
            title={`Note ${note.pitch} Velocity: ${note.velocity}`}
          />
        )
      })}
    </Box>
  )
}
