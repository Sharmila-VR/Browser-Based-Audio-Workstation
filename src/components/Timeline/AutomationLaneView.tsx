import React, { useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { AutomationLane, AutomationPoint } from '../../types/daw'
import { useAppDispatch, useAppSelector } from '../../store'
import { addOrUpdateAutomationPoint, removeAutomationPoint } from '../../store/tracksSlice'
import { snapBeatToGrid } from '../../utils/tempoMath'

interface AutomationLaneViewProps {
  trackId: string
  lane: AutomationLane
  height?: number
  trackColor: string
}

export const AutomationLaneView: React.FC<AutomationLaneViewProps> = ({
  trackId,
  lane,
  height = 50,
  trackColor
}) => {
  const dispatch = useAppDispatch()
  const zoom = useAppSelector((state) => state.timeline.zoom)
  const gridSnap = useAppSelector((state) => state.timeline.gridSnap)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const points = [...lane.points].sort((a, b) => a.beat - b.beat)

  const handleLaneClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const rawBeat = Math.max(0, clickX / zoom)
    const beat = snapBeatToGrid(rawBeat, gridSnap)
    const val = Math.max(0, Math.min(1, 1 - clickY / height))

    const newPoint: AutomationPoint = {
      id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      beat,
      value: Number(val.toFixed(3))
    }

    dispatch(
      addOrUpdateAutomationPoint({
        trackId,
        laneId: lane.id,
        point: newPoint
      })
    )
  }

  const handlePointDrag = (e: React.PointerEvent, point: AutomationPoint) => {
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const currentX = moveEvent.clientX - rect.left
      const currentY = moveEvent.clientY - rect.top

      const rawBeat = Math.max(0, currentX / zoom)
      const beat = snapBeatToGrid(rawBeat, gridSnap)
      const val = Math.max(0, Math.min(1, 1 - currentY / height))

      dispatch(
        addOrUpdateAutomationPoint({
          trackId,
          laneId: lane.id,
          point: {
            ...point,
            beat,
            value: Number(val.toFixed(3))
          }
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

  const handlePointDoubleClick = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation()
    dispatch(
      removeAutomationPoint({
        trackId,
        laneId: lane.id,
        pointId
      })
    )
  }

  let pathD = ''
  if (points.length > 0) {
    points.forEach((p, index) => {
      const x = p.beat * zoom
      const y = (1 - p.value) * height
      if (index === 0) {
        pathD += `M 0 ${y} L ${x} ${y} `
      } else {
        pathD += `L ${x} ${y} `
      }
    })
    const lastP = points[points.length - 1]
    pathD += `L 3000 ${(1 - lastP.value) * height}`
  }

  return (
    <Box
      ref={containerRef}
      onClick={handleLaneClick}
      sx={{
        height,
        backgroundColor: '#12131b',
        borderBottom: '1px solid #1c1e29',
        position: 'relative',
        cursor: 'crosshair',
        overflow: 'visible'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 8,
          top: 4,
          zIndex: 2,
          pointerEvents: 'none'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#8b91a7',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          {lane.param} Automation
        </Typography>
      </Box>

      <svg
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none'
        }}
      >
        <path d={pathD} stroke={trackColor} strokeWidth={2} fill="none" opacity={0.8} />
      </svg>

      {points.map((p) => {
        const x = p.beat * zoom
        const y = (1 - p.value) * height
        return (
          <Box
            key={p.id}
            onPointerDown={(e) => handlePointDrag(e, p)}
            onDoubleClick={(e) => handlePointDoubleClick(e, p.id)}
            sx={{
              position: 'absolute',
              left: `${x - 5}px`,
              top: `${y - 5}px`,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: `2px solid ${trackColor}`,
              boxShadow: '0 0 5px rgba(0, 0, 0, 0.8)',
              cursor: 'grab',
              zIndex: 3,
              '&:hover': {
                transform: 'scale(1.3)'
              }
            }}
            title={`${lane.param}: ${p.value} at beat ${p.beat}`}
          />
        )
      })}
    </Box>
  )
}
