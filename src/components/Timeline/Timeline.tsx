import React, { useRef } from 'react'
import {
  Box,
  Button,
  FormControl,
  Select,
  MenuItem,
  Typography,
  IconButton,
  ButtonGroup
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import ContentCutIcon from '@mui/icons-material/ContentCut'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  addTrack,
  removeClip,
  splitClipAtBeat
} from '../../store/tracksSlice'
import {
  setZoom,
  setGridSnap
} from '../../store/timelineSlice'
import { announce } from '../../store/uiSlice'
import { GridSnap } from '../../types/daw'
import { Ruler } from './Ruler'
import { TrackLane } from './TrackLane'

export const Timeline: React.FC = () => {
  const dispatch = useAppDispatch()
  const tracks = useAppSelector((state) => state.tracks.tracks)
  const zoom = useAppSelector((state) => state.timeline.zoom)
  const gridSnap = useAppSelector((state) => state.timeline.gridSnap)
  const playheadBeat = useAppSelector((state) => state.transport.playheadBeat)
  const selectedClipId = useAppSelector((state) => state.timeline.selectedClipId)

  const headerWidth = 220
  const totalBeats = 64
  const timelineContentWidth = totalBeats * zoom
  const playheadLeft = headerWidth + playheadBeat * zoom
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleZoomIn = () => {
    dispatch(setZoom(zoom * 1.25))
  }

  const handleZoomOut = () => {
    dispatch(setZoom(zoom / 1.25))
  }

  const handleSplitSelectedClip = () => {
    if (!selectedClipId) return
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId)
      if (clip) {
        dispatch(
          splitClipAtBeat({
            trackId: track.id,
            clipId: clip.id,
            splitBeat: playheadBeat
          })
        )
        dispatch(announce(`Split clip ${clip.name} at beat ${playheadBeat.toFixed(2)}`))
        break
      }
    }
  }

  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId)
      if (clip) {
        dispatch(removeClip({ trackId: track.id, clipId: clip.id }))
        dispatch(announce(`Deleted clip ${clip.name}`))
        break
      }
    }
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0d0e14',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          height: 36,
          backgroundColor: '#151620',
          borderBottom: '1px solid #232736',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => dispatch(addTrack({ name: `Audio ${tracks.length + 1}`, type: 'audio' }))}
            sx={{ fontSize: '0.72rem', py: 0.3 }}
          >
            Audio Track
          </Button>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => dispatch(addTrack({ name: `Synth ${tracks.length + 1}`, type: 'midi' }))}
            sx={{ fontSize: '0.72rem', py: 0.3 }}
          >
            MIDI Track
          </Button>

          <ButtonGroup size="small" variant="outlined" sx={{ ml: 1 }}>
            <Button
              onClick={handleSplitSelectedClip}
              disabled={!selectedClipId}
              startIcon={<ContentCutIcon />}
              sx={{ fontSize: '0.7rem' }}
              title="Split selected clip at playhead (Shortcut: S)"
            >
              Split
            </Button>
            <Button
              onClick={handleDeleteSelectedClip}
              disabled={!selectedClipId}
              startIcon={<DeleteIcon />}
              sx={{ fontSize: '0.7rem' }}
              title="Delete selected clip (Shortcut: Delete)"
            >
              Delete
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#8b91a7', fontSize: '0.7rem' }}>
              Grid:
            </Typography>
            <FormControl size="small">
              <Select
                value={gridSnap}
                onChange={(e) => dispatch(setGridSnap(e.target.value as GridSnap))}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  backgroundColor: '#1b1d28',
                  color: '#eceff4'
                }}
              >
                <MenuItem value="1/1">1/1 (Bar)</MenuItem>
                <MenuItem value="1/2">1/2</MenuItem>
                <MenuItem value="1/4">1/4 (Beat)</MenuItem>
                <MenuItem value="1/8">1/8</MenuItem>
                <MenuItem value="1/16">1/16</MenuItem>
                <MenuItem value="1/32">1/32</MenuItem>
                <MenuItem value="off">Off</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#8b91a7' }}>
              <ZoomOutIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#8b91a7' }}>
              <ZoomInIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <Box sx={{ width: headerWidth + timelineContentWidth, minWidth: '100%' }}>
          <Ruler totalBeats={totalBeats} headerWidth={headerWidth} />

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {tracks.map((track) => (
              <TrackLane
                key={track.id}
                track={track}
                headerWidth={headerWidth}
                totalBeats={totalBeats}
              />
            ))}
          </Box>

          <Box
            sx={{
              position: 'absolute',
              left: `${playheadLeft}px`,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: '#ff3d00',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 0 6px rgba(255, 61, 0, 0.8)'
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                backgroundColor: '#ff3d00',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                position: 'absolute',
                top: 0,
                left: -4
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
