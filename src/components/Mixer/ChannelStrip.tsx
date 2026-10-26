import React from 'react'
import { Box, Typography, Button, Slider, IconButton } from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import { MeterData, Track } from '../../types/daw'
import { useAppDispatch } from '../../store'
import {
  setTrackVolume,
  setTrackPan,
  toggleTrackMute,
  toggleTrackSolo,
  toggleTrackArm
} from '../../store/tracksSlice'
import { openEffectsModal } from '../../store/uiSlice'
import { VUMeter } from './VUMeter'

interface ChannelStripProps {
  track: Track
  meter?: MeterData
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({ track, meter }) => {
  const dispatch = useAppDispatch()

  const peak = meter?.peakL ?? -60
  const rms = meter?.rmsL ?? -60

  const handleVolumeChange = (_: Event, val: number | number[]) => {
    dispatch(setTrackVolume({ trackId: track.id, volume: val as number }))
  }

  const handlePanChange = (_: Event, val: number | number[]) => {
    dispatch(setTrackPan({ trackId: track.id, pan: val as number }))
  }

  const volumeDb = track.volume > 0.0001 ? 20 * Math.log10(track.volume) : -60
  const formattedDb = volumeDb <= -60 ? '-inf' : `${volumeDb > 0 ? '+' : ''}${volumeDb.toFixed(1)} dB`

  return (
    <Box
      sx={{
        width: 100,
        minWidth: 100,
        backgroundColor: '#161824',
        borderRight: '1px solid #232736',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1,
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 4,
          backgroundColor: track.color,
          borderRadius: 1,
          mb: 0.5
        }}
      />

      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: '#eceff4',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          textAlign: 'center',
          mb: 0.5
        }}
      >
        {track.name}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
        <Button
          size="small"
          variant={track.muted ? 'contained' : 'outlined'}
          color="error"
          onClick={() => dispatch(toggleTrackMute(track.id))}
          sx={{ minWidth: 20, height: 18, p: 0, fontSize: '0.6rem', fontWeight: 700 }}
        >
          M
        </Button>
        <Button
          size="small"
          variant={track.soloed ? 'contained' : 'outlined'}
          color="warning"
          onClick={() => dispatch(toggleTrackSolo(track.id))}
          sx={{ minWidth: 20, height: 18, p: 0, fontSize: '0.6rem', fontWeight: 700 }}
        >
          S
        </Button>
        <Button
          size="small"
          variant={track.armed ? 'contained' : 'outlined'}
          color="error"
          onClick={() => dispatch(toggleTrackArm(track.id))}
          sx={{ minWidth: 20, height: 18, p: 0, fontSize: '0.6rem', fontWeight: 700 }}
        >
          R
        </Button>
      </Box>

      <Box sx={{ width: '100%', px: 0.5, mb: 1 }}>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#8b91a7', display: 'block', textAlign: 'center' }}>
          Pan: {track.pan === 0 ? 'C' : track.pan < 0 ? `${Math.round(Math.abs(track.pan) * 100)}L` : `${Math.round(track.pan * 100)}R`}
        </Typography>
        <Slider
          size="small"
          value={track.pan}
          min={-1}
          max={1}
          step={0.05}
          onChange={handlePanChange}
          sx={{ p: 0, height: 3, color: '#00e5ff' }}
        />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
        <Slider
          orientation="vertical"
          value={track.volume}
          min={0}
          max={1.5}
          step={0.01}
          onChange={handleVolumeChange}
          sx={{
            height: 120,
            color: track.color,
            '& .MuiSlider-thumb': {
              width: 14,
              height: 14
            }
          }}
          aria-label={`${track.name} Volume Fader`}
        />
        <VUMeter peak={peak} rms={rms} height={120} width={12} />
      </Box>

      <Typography
        variant="caption"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          color: '#8b91a7',
          mt: 0.5,
          mb: 0.5
        }}
      >
        {formattedDb}
      </Typography>

      <IconButton
        size="small"
        onClick={() => dispatch(openEffectsModal(track.id))}
        sx={{ color: '#8b91a7', mt: 'auto', p: 0.5 }}
        title="Open DSP Rack"
      >
        <TuneIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  )
}
