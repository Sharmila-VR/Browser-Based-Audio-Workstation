import React from 'react'
import { Box, Typography, Slider, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { MeterData } from '../../types/daw'
import { useAppDispatch, useAppSelector } from '../../store'
import { toggleMixer } from '../../store/uiSlice'
import { setMasterVolume } from '../../store/transportSlice'
import { ChannelStrip } from './ChannelStrip'
import { VUMeter } from './VUMeter'

interface MixerPanelProps {
  trackMeters: Record<string, MeterData>
  masterMeter: MeterData
}

export const MixerPanel: React.FC<MixerPanelProps> = ({ trackMeters, masterMeter }) => {
  const dispatch = useAppDispatch()
  const tracks = useAppSelector((state) => state.tracks.tracks)
  const masterVolume = useAppSelector((state) => state.transport.masterVolume)

  const handleMasterVolChange = (_: Event, val: number | number[]) => {
    dispatch(setMasterVolume(val as number))
  }

  const masterDb = masterVolume > 0.0001 ? 20 * Math.log10(masterVolume) : -60
  const formattedMasterDb =
    masterDb <= -60 ? '-inf' : `${masterDb > 0 ? '+' : ''}${masterDb.toFixed(1)} dB`

  return (
    <Box
      sx={{
        height: 240,
        backgroundColor: '#12131b',
        borderTop: '2px solid #232736',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          height: 28,
          backgroundColor: '#151622',
          borderBottom: '1px solid #232736',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#eceff4', letterSpacing: 0.5 }}>
          MIXER CONSOLE
        </Typography>
        <IconButton size="small" onClick={() => dispatch(toggleMixer())} sx={{ color: '#8b91a7', p: 0.2 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflowX: 'auto', overflowY: 'hidden' }}>
        {tracks.map((track) => (
          <ChannelStrip
            key={track.id}
            track={track}
            meter={trackMeters[track.id]}
          />
        ))}

        <Box
          sx={{
            width: 120,
            minWidth: 120,
            backgroundColor: '#181a28',
            borderLeft: '2px solid #282c3f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 1,
            boxSizing: 'border-box',
            ml: 'auto'
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, color: '#ff3d00', fontSize: '0.75rem', mb: 1 }}
          >
            MASTER
          </Typography>

          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
            <Slider
              orientation="vertical"
              value={masterVolume}
              min={0}
              max={1.5}
              step={0.01}
              onChange={handleMasterVolChange}
              sx={{
                height: 120,
                color: '#ff3d00',
                '& .MuiSlider-thumb': {
                  width: 15,
                  height: 15
                }
              }}
              aria-label="Master Volume"
            />
            <VUMeter peak={masterMeter.peakL} rms={masterMeter.rmsL} height={120} width={14} />
          </Box>

          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: '#ff3d00',
              fontWeight: 700,
              mt: 0.5
            }}
          >
            {formattedMasterDb}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
