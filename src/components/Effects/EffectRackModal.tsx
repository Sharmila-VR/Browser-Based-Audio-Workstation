import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Paper,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import TuneIcon from '@mui/icons-material/Tune'
import { useAppDispatch, useAppSelector } from '../../store'
import { updateTrackEffects } from '../../store/tracksSlice'
import { closeEffectsModal } from '../../store/uiSlice'
import { TrackEffects } from '../../types/daw'

export const EffectRackModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const trackId = useAppSelector((state) => state.ui.effectsModalTrackId)
  const tracks = useAppSelector((state) => state.tracks.tracks)

  const track = tracks.find((t) => t.id === trackId)

  if (!track) return null

  const fx = track.effects

  const updateFx = (newFx: TrackEffects) => {
    dispatch(updateTrackEffects({ trackId: track.id, effects: newFx }))
  }

  const handleClose = () => {
    dispatch(closeEffectsModal())
  }

  return (
    <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: '#151622',
          borderBottom: '1px solid #232736',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ color: '#00e5ff' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            DSP Effects Rack - {track.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: '#8b91a7' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: '#0e0f17', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#141622',
            borderColor: '#24283b',
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e5ff' }}>
              3-BAND PARAMETRIC EQ (AudioWorklet)
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={fx.eq.enabled}
                  onChange={(e) =>
                    updateFx({
                      ...fx,
                      eq: { ...fx.eq, enabled: e.target.checked }
                    })
                  }
                  color="primary"
                  size="small"
                />
              }
              label={fx.eq.enabled ? 'ON' : 'BYPASS'}
              sx={{ m: 0 }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Low Shelf ({fx.eq.lowFreq} Hz)
              </Typography>
              <Slider
                size="small"
                value={fx.eq.lowGain}
                min={-18}
                max={18}
                step={0.5}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    eq: { ...fx.eq, lowGain: val as number }
                  })
                }
                valueLabelDisplay="auto"
                sx={{ color: '#00e5ff' }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#b0b6cf' }}>
                Gain: {fx.eq.lowGain > 0 ? '+' : ''}{fx.eq.lowGain} dB
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Mid Peak ({fx.eq.midFreq} Hz)
              </Typography>
              <Slider
                size="small"
                value={fx.eq.midGain}
                min={-18}
                max={18}
                step={0.5}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    eq: { ...fx.eq, midGain: val as number }
                  })
                }
                valueLabelDisplay="auto"
                sx={{ color: '#00e5ff' }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#b0b6cf' }}>
                Gain: {fx.eq.midGain > 0 ? '+' : ''}{fx.eq.midGain} dB (Q: {fx.eq.midQ})
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                High Shelf ({fx.eq.highFreq} Hz)
              </Typography>
              <Slider
                size="small"
                value={fx.eq.highGain}
                min={-18}
                max={18}
                step={0.5}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    eq: { ...fx.eq, highGain: val as number }
                  })
                }
                valueLabelDisplay="auto"
                sx={{ color: '#00e5ff' }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#b0b6cf' }}>
                Gain: {fx.eq.highGain > 0 ? '+' : ''}{fx.eq.highGain} dB
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#141622',
            borderColor: '#24283b',
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7c4dff' }}>
              DYNAMICS COMPRESSOR (AudioWorklet)
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={fx.compressor.enabled}
                  onChange={(e) =>
                    updateFx({
                      ...fx,
                      compressor: { ...fx.compressor, enabled: e.target.checked }
                    })
                  }
                  color="secondary"
                  size="small"
                />
              }
              label={fx.compressor.enabled ? 'ON' : 'BYPASS'}
              sx={{ m: 0 }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Threshold: {fx.compressor.threshold} dB
              </Typography>
              <Slider
                size="small"
                value={fx.compressor.threshold}
                min={-50}
                max={0}
                step={1}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    compressor: { ...fx.compressor, threshold: val as number }
                  })
                }
                sx={{ color: '#7c4dff' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Ratio: {fx.compressor.ratio}:1
              </Typography>
              <Slider
                size="small"
                value={fx.compressor.ratio}
                min={1}
                max={16}
                step={0.5}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    compressor: { ...fx.compressor, ratio: val as number }
                  })
                }
                sx={{ color: '#7c4dff' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Attack: {Math.round(fx.compressor.attack * 1000)} ms | Release: {Math.round(fx.compressor.release * 1000)} ms
              </Typography>
              <Slider
                size="small"
                value={fx.compressor.attack}
                min={0.001}
                max={0.1}
                step={0.001}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    compressor: { ...fx.compressor, attack: val as number }
                  })
                }
                sx={{ color: '#7c4dff' }}
              />
            </Box>
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#141622',
            borderColor: '#24283b',
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e676' }}>
              STEREO DELAY & REVERB (AudioWorklet)
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={fx.delay.enabled}
                  onChange={(e) =>
                    updateFx({
                      ...fx,
                      delay: { ...fx.delay, enabled: e.target.checked }
                    })
                  }
                  color="success"
                  size="small"
                />
              }
              label={fx.delay.enabled ? 'ON' : 'BYPASS'}
              sx={{ m: 0 }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Delay Time: {Math.round(fx.delay.time * 1000)} ms
              </Typography>
              <Slider
                size="small"
                value={fx.delay.time}
                min={0.05}
                max={1.0}
                step={0.01}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    delay: { ...fx.delay, time: val as number }
                  })
                }
                sx={{ color: '#00e676' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Feedback: {Math.round(fx.delay.feedback * 100)}%
              </Typography>
              <Slider
                size="small"
                value={fx.delay.feedback}
                min={0}
                max={0.9}
                step={0.02}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    delay: { ...fx.delay, feedback: val as number }
                  })
                }
                sx={{ color: '#00e676' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Mix: {Math.round(fx.delay.mix * 100)}%
              </Typography>
              <Slider
                size="small"
                value={fx.delay.mix}
                min={0}
                max={1.0}
                step={0.02}
                onChange={(_, val) =>
                  updateFx({
                    ...fx,
                    delay: { ...fx.delay, mix: val as number }
                  })
                }
                sx={{ color: '#00e676' }}
              />
            </Box>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: '#151622', borderTop: '1px solid #232736', px: 2, py: 1 }}>
        <Button onClick={handleClose} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
