import React from 'react'
import { Box } from '@mui/material'

interface VUMeterProps {
  peak: number
  rms: number
  height?: number
  width?: number
  vertical?: boolean
}

export const VUMeter: React.FC<VUMeterProps> = ({
  peak,
  rms,
  height = 120,
  width = 16,
  vertical = true
}) => {
  const normalizeDb = (db: number) => {
    return Math.max(0, Math.min(1, (db + 60) / 66))
  }

  const peakNorm = normalizeDb(peak)
  const rmsNorm = normalizeDb(rms)
  const isClipping = peak >= 0

  if (vertical) {
    return (
      <Box
        sx={{
          width,
          height,
          backgroundColor: '#0a0b0e',
          borderRadius: 0.5,
          border: '1px solid #1e2230',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
        role="progressbar"
        aria-label="Audio level meter"
        aria-valuenow={Math.round(peak)}
        aria-valuemin={-60}
        aria-valuemax={6}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            height: 4,
            backgroundColor: isClipping ? '#ff1744' : '#2e1114',
            borderRadius: 0.5,
            transition: 'background-color 0.1s'
          }}
        />

        <Box
          sx={{
            width: '100%',
            height: `${rmsNorm * 100}%`,
            background: 'linear-gradient(to top, #00e676 0%, #ffea00 75%, #ff3d00 95%)',
            transition: 'height 0.05s ease-out'
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: `${peakNorm * 100}%`,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: '#ffffff',
            boxShadow: '0 0 3px #ffffff',
            pointerEvents: 'none',
            transition: 'bottom 0.05s linear'
          }}
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor: '#0a0b0e',
        borderRadius: 0.5,
        border: '1px solid #1e2230',
        position: 'relative',
        overflow: 'hidden'
      }}
      role="progressbar"
      aria-label="Audio level meter"
      aria-valuenow={Math.round(peak)}
      aria-valuemin={-60}
      aria-valuemax={6}
    >
      <Box
        sx={{
          height: '100%',
          width: `${rmsNorm * 100}%`,
          background: 'linear-gradient(to right, #00e676 0%, #ffea00 75%, #ff3d00 95%)',
          transition: 'width 0.05s ease-out'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: `${peakNorm * 100}%`,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 3px #ffffff'
        }}
      />
    </Box>
  )
}
