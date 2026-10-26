import React from 'react'
import { Box } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../store'
import { setPlayheadBeat, setLoopPoints } from '../../store/transportSlice'
import { snapBeatToGrid } from '../../utils/tempoMath'

interface RulerProps {
  totalBeats: number
  headerWidth: number
}

export const Ruler: React.FC<RulerProps> = ({ totalBeats, headerWidth }) => {
  const dispatch = useAppDispatch()
  const zoom = useAppSelector((state) => state.timeline.zoom)
  const gridSnap = useAppSelector((state) => state.timeline.gridSnap)
  const loopEnabled = useAppSelector((state) => state.transport.loopEnabled)
  const loopStart = useAppSelector((state) => state.transport.loopStartBeat)
  const loopEnd = useAppSelector((state) => state.transport.loopEndBeat)
  const timeSignature = useAppSelector((state) => state.transport.timeSignature)

  const beatsPerBar = timeSignature.numerator * (4 / timeSignature.denominator)
  const totalBars = Math.ceil(totalBeats / beatsPerBar)

  const handleRulerClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - rect.left - headerWidth
    if (clickX < 0) return

    const rawBeat = clickX / zoom
    const snapped = snapBeatToGrid(rawBeat, gridSnap)
    dispatch(setPlayheadBeat(snapped))
  }

  const loopLeft = loopStart * zoom
  const loopWidth = (loopEnd - loopStart) * zoom

  return (
    <Box
      onClick={handleRulerClick}
      sx={{
        height: 28,
        backgroundColor: '#161722',
        borderBottom: '1px solid #232736',
        display: 'flex',
        position: 'relative',
        userSelect: 'none',
        cursor: 'pointer'
      }}
    >
      <Box
        sx={{
          width: headerWidth,
          minWidth: headerWidth,
          borderRight: '1px solid #232736',
          backgroundColor: '#13141d',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          fontSize: '0.7rem',
          color: '#8b91a7',
          fontWeight: 700
        }}
      >
        BARS
      </Box>

      <Box sx={{ position: 'relative', flex: 1, height: '100%', overflow: 'hidden' }}>
        {loopEnabled && (
          <Box
            sx={{
              position: 'absolute',
              left: `${loopLeft}px`,
              width: `${loopWidth}px`,
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              borderLeft: '2px solid #00e5ff',
              borderRight: '2px solid #00e5ff',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        {Array.from({ length: totalBars }).map((_, barIndex) => {
          const barBeat = barIndex * beatsPerBar
          const barLeft = barBeat * zoom

          return (
            <React.Fragment key={barIndex}>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${barLeft}px`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: '#353a4f'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: `${barLeft + 4}px`,
                  top: 4,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#b0b6cf'
                }}
              >
                {barIndex + 1}
              </Box>

              {Array.from({ length: beatsPerBar - 1 }).map((_, beatIdx) => {
                const subLeft = (barBeat + beatIdx + 1) * zoom
                return (
                  <Box
                    key={beatIdx}
                    sx={{
                      position: 'absolute',
                      left: `${subLeft}px`,
                      bottom: 0,
                      height: 8,
                      width: 1,
                      backgroundColor: '#26293a'
                    }}
                  />
                )
              })}
            </React.Fragment>
          )
        })}
      </Box>
    </Box>
  )
}
