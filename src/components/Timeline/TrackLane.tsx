import React, { useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Chip,
  Button
} from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import TuneIcon from '@mui/icons-material/Tune'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import DeleteIcon from '@mui/icons-material/Delete'
import PianoIcon from '@mui/icons-material/Piano'
import AddIcon from '@mui/icons-material/Add'
import { Track } from '../../types/daw'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  toggleTrackMute,
  toggleTrackSolo,
  toggleTrackArm,
  setTrackVolume,
  setTrackPan,
  removeTrack,
  addClip,
  toggleAutomationLane
} from '../../store/tracksSlice'
import { openEffectsModal, openSynthModal, announce } from '../../store/uiSlice'
import { ClipView } from './ClipView'
import { AutomationLaneView } from './AutomationLaneView'

interface TrackLaneProps {
  track: Track
  headerWidth: number
  totalBeats: number
}

export const TrackLane: React.FC<TrackLaneProps> = ({ track, headerWidth, totalBeats }) => {
  const dispatch = useAppDispatch()
  const zoom = useAppSelector((state) => state.timeline.zoom)
  const timeSignature = useAppSelector((state) => state.transport.timeSignature)
  const [showAuto, setShowAuto] = useState(false)

  const trackHeight = 72
  const beatsPerBar = timeSignature.numerator * (4 / timeSignature.denominator)
  const totalBars = Math.ceil(totalBeats / beatsPerBar)

  const handleMute = () => {
    dispatch(toggleTrackMute(track.id))
    dispatch(announce(`${track.name} ${track.muted ? 'unmuted' : 'muted'}`))
  }

  const handleSolo = () => {
    dispatch(toggleTrackSolo(track.id))
    dispatch(announce(`${track.name} ${track.soloed ? 'unsoloed' : 'soloed'}`))
  }

  const handleArm = () => {
    dispatch(toggleTrackArm(track.id))
    dispatch(announce(`${track.name} ${track.armed ? 'disarmed' : 'armed for recording'}`))
  }

  const handleCreateEmptyClip = () => {
    if (track.type === 'midi') {
      const newClip = {
        id: 'clip_' + Date.now(),
        trackId: track.id,
        name: 'New MIDI Clip',
        startBeat: 0,
        durationBeats: 8,
        offsetBeats: 0,
        loop: false,
        type: 'midi' as const,
        notes: [
          { id: 'n1', pitch: 60, startBeat: 0, durationBeats: 1, velocity: 100 },
          { id: 'n2', pitch: 64, startBeat: 2, durationBeats: 1, velocity: 100 }
        ]
      }
      dispatch(addClip({ trackId: track.id, clip: newClip }))
    }
  }

  return (
    <Box sx={{ borderBottom: '1px solid #1f2230', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', height: trackHeight, backgroundColor: '#14151f' }}>
        <Box
          sx={{
            width: headerWidth,
            minWidth: headerWidth,
            backgroundColor: '#161824',
            borderRight: '1px solid #232736',
            borderLeft: `4px solid ${track.color}`,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  maxWidth: 100
                }}
              >
                {track.name}
              </Typography>
              <Chip
                label={track.type.toUpperCase()}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  backgroundColor: track.type === 'midi' ? '#7c4dff33' : '#00e5ff33',
                  color: track.type === 'midi' ? '#b388ff' : '#18ffff'
                }}
              />
            </Box>

            <IconButton
              size="small"
              onClick={() => dispatch(removeTrack(track.id))}
              sx={{ color: '#686e85', p: 0.2 }}
              aria-label="Delete track"
            >
              <DeleteIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              variant={track.muted ? 'contained' : 'outlined'}
              color="error"
              onClick={handleMute}
              sx={{
                minWidth: 24,
                height: 20,
                p: 0,
                fontSize: '0.65rem',
                fontWeight: 700
              }}
              aria-label={`Mute ${track.name}`}
            >
              M
            </Button>
            <Button
              size="small"
              variant={track.soloed ? 'contained' : 'outlined'}
              color="warning"
              onClick={handleSolo}
              sx={{
                minWidth: 24,
                height: 20,
                p: 0,
                fontSize: '0.65rem',
                fontWeight: 700
              }}
              aria-label={`Solo ${track.name}`}
            >
              S
            </Button>
            <Button
              size="small"
              variant={track.armed ? 'contained' : 'outlined'}
              color="error"
              onClick={handleArm}
              sx={{
                minWidth: 24,
                height: 20,
                p: 0,
                fontSize: '0.65rem',
                fontWeight: 700,
                animation: track.armed ? 'pulse 1.2s infinite' : 'none'
              }}
              aria-label={`Record arm ${track.name}`}
            >
              R
            </Button>

            <IconButton
              size="small"
              onClick={() => dispatch(openEffectsModal(track.id))}
              sx={{ color: '#9aa0b4', p: 0.3 }}
              title="DSP Effects Rack (EQ, Compressor, Delay)"
              aria-label="Effects Rack"
            >
              <TuneIcon sx={{ fontSize: 15 }} />
            </IconButton>

            {track.type === 'midi' && (
              <IconButton
                size="small"
                onClick={() => dispatch(openSynthModal(track.id))}
                sx={{ color: '#00e5ff', p: 0.3 }}
                title="Synthesizer Settings"
                aria-label="Synth Settings"
              >
                <PianoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}

            <IconButton
              size="small"
              onClick={() => setShowAuto(!showAuto)}
              sx={{ color: showAuto ? '#00e5ff' : '#9aa0b4', p: 0.3 }}
              title="Toggle Automation Lanes"
              aria-label="Toggle Automation"
            >
              <ShowChartIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolumeUpIcon sx={{ fontSize: 13, color: '#686e85' }} />
            <Slider
              size="small"
              value={track.volume}
              min={0}
              max={1.5}
              step={0.01}
              onChange={(_, val) =>
                dispatch(setTrackVolume({ trackId: track.id, volume: val as number }))
              }
              aria-label={`${track.name} Volume`}
              sx={{
                p: 0,
                height: 3,
                color: track.color
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#11121a',
            overflow: 'hidden'
          }}
        >
          {Array.from({ length: totalBars }).map((_, barIndex) => {
            const barLeft = barIndex * beatsPerBar * zoom
            return (
              <Box
                key={barIndex}
                sx={{
                  position: 'absolute',
                  left: `${barLeft}px`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: '#1e212f',
                  pointerEvents: 'none'
                }}
              />
            )
          })}

          {track.clips.map((clip) => (
            <ClipView
              key={clip.id}
              clip={clip}
              trackColor={track.color}
              height={trackHeight}
            />
          ))}

          {track.clips.length === 0 && track.type === 'midi' && (
            <Box
              sx={{
                position: 'absolute',
                left: 16,
                top: 20
              }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateEmptyClip}
                sx={{ fontSize: '0.7rem', color: '#8b91a7', borderColor: '#2d3042' }}
              >
                Add MIDI Clip
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {showAuto && (
        <Box sx={{ display: 'flex' }}>
          <Box
            sx={{
              width: headerWidth,
              minWidth: headerWidth,
              backgroundColor: '#101118',
              borderRight: '1px solid #232736',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
              Automation
            </Typography>
            <Button
              size="small"
              onClick={() =>
                dispatch(toggleAutomationLane({ trackId: track.id, param: 'volume' }))
              }
              sx={{ fontSize: '0.65rem' }}
            >
              Vol
            </Button>
            <Button
              size="small"
              onClick={() =>
                dispatch(toggleAutomationLane({ trackId: track.id, param: 'pan' }))
              }
              sx={{ fontSize: '0.65rem' }}
            >
              Pan
            </Button>
          </Box>

          <Box sx={{ flex: 1, backgroundColor: '#0e0f16' }}>
            {track.automationLanes
              .filter((l) => l.enabled)
              .map((lane) => (
                <AutomationLaneView
                  key={lane.id}
                  trackId={track.id}
                  lane={lane}
                  trackColor={track.color}
                />
              ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
