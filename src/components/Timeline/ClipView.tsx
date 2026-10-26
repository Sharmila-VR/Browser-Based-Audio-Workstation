import React, { useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import LoopIcon from '@mui/icons-material/Loop'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import { Clip } from '../../types/daw'
import { useAppDispatch, useAppSelector } from '../../store'
import { updateClip } from '../../store/tracksSlice'
import { setSelectedClipId } from '../../store/timelineSlice'
import { openPianoRoll, announce } from '../../store/uiSlice'
import { snapBeatToGrid } from '../../utils/tempoMath'
import { WaveformCanvas } from './WaveformCanvas'

interface ClipViewProps {
  clip: Clip
  trackColor: string
  height: number
}

export const ClipView: React.FC<ClipViewProps> = ({ clip, trackColor, height }) => {
  const dispatch = useAppDispatch()
  const zoom = useAppSelector((state) => state.timeline.zoom)
  const gridSnap = useAppSelector((state) => state.timeline.gridSnap)
  const selectedClipId = useAppSelector((state) => state.timeline.selectedClipId)

  const [isDragging, setIsDragging] = useState(false)
  const [isTrimmingLeft, setIsTrimmingLeft] = useState(false)
  const [isTrimmingRight, setIsTrimmingRight] = useState(false)
  const dragStartX = useRef(0)
  const initialStartBeat = useRef(clip.startBeat)
  const initialDuration = useRef(clip.durationBeats)

  const isSelected = selectedClipId === clip.id
  const clipWidth = Math.max(20, clip.durationBeats * zoom)
  const clipLeft = clip.startBeat * zoom

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    dispatch(setSelectedClipId(clip.id))
    dispatch(announce(`Selected clip ${clip.name} at bar ${Math.floor(clip.startBeat / 4) + 1}`))

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const offsetX = e.clientX - rect.left

    dragStartX.current = e.clientX
    initialStartBeat.current = clip.startBeat
    initialDuration.current = clip.durationBeats

    if (offsetX < 10) {
      setIsTrimmingLeft(true)
      window.addEventListener('pointermove', handleTrimLeftMove)
      window.addEventListener('pointerup', handleTrimLeftUp)
    } else if (offsetX > clipWidth - 10) {
      setIsTrimmingRight(true)
      window.addEventListener('pointermove', handleTrimRightMove)
      window.addEventListener('pointerup', handleTrimRightUp)
    } else {
      setIsDragging(true)
      window.addEventListener('pointermove', handleDragMove)
      window.addEventListener('pointerup', handleDragUp)
    }
  }

  const handleDragMove = (e: PointerEvent) => {
    const deltaPixels = e.clientX - dragStartX.current
    const deltaBeats = deltaPixels / zoom
    const rawNewStart = Math.max(0, initialStartBeat.current + deltaBeats)
    const snappedStart = snapBeatToGrid(rawNewStart, gridSnap)

    dispatch(
      updateClip({
        trackId: clip.trackId,
        clipId: clip.id,
        changes: { startBeat: snappedStart }
      })
    )
  }

  const handleDragUp = () => {
    setIsDragging(false)
    window.removeEventListener('pointermove', handleDragMove)
    window.removeEventListener('pointerup', handleDragUp)
  }

  const handleTrimLeftMove = (e: PointerEvent) => {
    const deltaPixels = e.clientX - dragStartX.current
    const deltaBeats = deltaPixels / zoom
    const rawNewStart = Math.max(0, initialStartBeat.current + deltaBeats)
    const snappedStart = snapBeatToGrid(rawNewStart, gridSnap)
    const maxStart = initialStartBeat.current + initialDuration.current - 0.25

    const finalStart = Math.min(maxStart, snappedStart)
    const finalDuration = initialDuration.current - (finalStart - initialStartBeat.current)

    dispatch(
      updateClip({
        trackId: clip.trackId,
        clipId: clip.id,
        changes: {
          startBeat: finalStart,
          durationBeats: Math.max(0.25, finalDuration)
        }
      })
    )
  }

  const handleTrimLeftUp = () => {
    setIsTrimmingLeft(false)
    window.removeEventListener('pointermove', handleTrimLeftMove)
    window.removeEventListener('pointerup', handleTrimLeftUp)
  }

  const handleTrimRightMove = (e: PointerEvent) => {
    const deltaPixels = e.clientX - dragStartX.current
    const deltaBeats = deltaPixels / zoom
    const rawNewDuration = Math.max(0.25, initialDuration.current + deltaBeats)
    const snappedDuration = snapBeatToGrid(rawNewDuration, gridSnap)

    dispatch(
      updateClip({
        trackId: clip.trackId,
        clipId: clip.id,
        changes: { durationBeats: Math.max(0.25, snappedDuration) }
      })
    )
  }

  const handleTrimRightUp = () => {
    setIsTrimmingRight(false)
    window.removeEventListener('pointermove', handleTrimRightMove)
    window.removeEventListener('pointerup', handleTrimRightUp)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (clip.type === 'midi') {
      dispatch(openPianoRoll({ trackId: clip.trackId, clipId: clip.id }))
      dispatch(announce(`Opened piano roll for clip ${clip.name}`))
    }
  }

  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(
      updateClip({
        trackId: clip.trackId,
        clipId: clip.id,
        changes: { loop: !clip.loop }
      })
    )
  }

  return (
    <Box
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      role="region"
      aria-label={`${clip.type} clip ${clip.name}, start beat ${clip.startBeat}, duration ${clip.durationBeats} beats`}
      sx={{
        position: 'absolute',
        left: `${clipLeft}px`,
        width: `${clipWidth}px`,
        height: `${height - 6}px`,
        top: 3,
        backgroundColor: '#1b1d28',
        borderRadius: 1,
        border: isSelected ? '2px solid #00e5ff' : '1px solid #2d3042',
        boxShadow: isSelected ? '0 0 10px rgba(0, 229, 255, 0.4)' : 'none',
        overflow: 'hidden',
        cursor: isTrimmingLeft || isTrimmingRight ? 'ew-resize' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          height: 20,
          backgroundColor: trackColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 0.5,
          color: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
          {clip.type === 'midi' ? (
            <MusicNoteIcon sx={{ fontSize: 13 }} />
          ) : (
            <GraphicEqIcon sx={{ fontSize: 13 }} />
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.68rem',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {clip.name}
          </Typography>
        </Box>

        <Box
          onClick={toggleLoop}
          sx={{
            cursor: 'pointer',
            opacity: clip.loop ? 1 : 0.4,
            display: 'flex',
            alignItems: 'center'
          }}
          title="Toggle Clip Loop"
        >
          <LoopIcon sx={{ fontSize: 12 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {clip.type === 'audio' ? (
          <WaveformCanvas
            clip={clip}
            width={clipWidth}
            height={height - 28}
            color={trackColor}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {clip.notes.map((note) => {
              const noteLeft = (note.startBeat / clip.durationBeats) * clipWidth
              const noteWidth = Math.max(2, (note.durationBeats / clip.durationBeats) * clipWidth)
              const noteTop = (1 - (note.pitch - 36) / 48) * (height - 30)
              return (
                <Box
                  key={note.id}
                  sx={{
                    position: 'absolute',
                    left: `${noteLeft}px`,
                    top: `${Math.max(2, Math.min(height - 32, noteTop))}px`,
                    width: `${noteWidth}px`,
                    height: 3,
                    backgroundColor: trackColor,
                    borderRadius: 0.5
                  }}
                />
              )
            })}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'ew-resize',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'ew-resize',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
        }}
      />
    </Box>
  )
}
