import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  Paper,
  Select,
  MenuItem,
  FormControl,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PianoIcon from '@mui/icons-material/Piano'
import { useAppDispatch, useAppSelector } from '../../store'
import { updateSynthSettings } from '../../store/tracksSlice'
import { closeSynthModal } from '../../store/uiSlice'
import { SynthSettings } from '../../types/daw'
import { audioEngine } from '../../audio/audioEngine'

export const SynthModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const trackId = useAppSelector((state) => state.ui.synthModalTrackId)
  const tracks = useAppSelector((state) => state.tracks.tracks)

  const track = tracks.find((t) => t.id === trackId)

  if (!track || !track.synthSettings) return null

  const s = track.synthSettings

  const updateSettings = (newSettings: SynthSettings) => {
    dispatch(updateSynthSettings({ trackId: track.id, settings: newSettings }))
  }

  const handleTestNote = () => {
    audioEngine.playSynthNote(track.id, 60, 100, 0, 0.8, s)
    audioEngine.playSynthNote(track.id, 64, 90, 0, 0.8, s)
    audioEngine.playSynthNote(track.id, 67, 95, 0, 0.8, s)
  }

  const handleClose = () => {
    dispatch(closeSynthModal())
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
          <PianoIcon sx={{ color: '#7c4dff' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Subtractive Synthesizer - {track.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: '#8b91a7' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: '#0e0f17', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#141622', borderColor: '#24283b' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e5ff', mb: 1.5 }}>
            DUAL OSCILLATORS
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Osc 1 Shape
              </Typography>
              <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                <Select
                  value={s.osc1Type}
                  onChange={(e) => updateSettings({ ...s, osc1Type: e.target.value as OscillatorType })}
                  sx={{ height: 32, fontSize: '0.8rem', backgroundColor: '#1d1f2b' }}
                >
                  <MenuItem value="sawtooth">Sawtooth</MenuItem>
                  <MenuItem value="square">Square</MenuItem>
                  <MenuItem value="triangle">Triangle</MenuItem>
                  <MenuItem value="sine">Sine</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Osc 2 Shape
              </Typography>
              <FormControl size="small" fullWidth sx={{ mt: 0.5 }}>
                <Select
                  value={s.osc2Type}
                  onChange={(e) => updateSettings({ ...s, osc2Type: e.target.value as OscillatorType })}
                  sx={{ height: 32, fontSize: '0.8rem', backgroundColor: '#1d1f2b' }}
                >
                  <MenuItem value="sawtooth">Sawtooth</MenuItem>
                  <MenuItem value="square">Square</MenuItem>
                  <MenuItem value="triangle">Triangle</MenuItem>
                  <MenuItem value="sine">Sine</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Osc 2 Detune: {s.osc2Detune} cents
              </Typography>
              <Slider
                size="small"
                value={s.osc2Detune}
                min={-30}
                max={30}
                step={1}
                onChange={(_, val) => updateSettings({ ...s, osc2Detune: val as number })}
                sx={{ color: '#00e5ff', mt: 0.5 }}
              />
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#141622', borderColor: '#24283b' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7c4dff', mb: 1.5 }}>
            AMPLITUDE ENVELOPE (ADSR)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Attack: {Math.round(s.attack * 1000)} ms
              </Typography>
              <Slider
                size="small"
                value={s.attack}
                min={0.005}
                max={1.5}
                step={0.01}
                onChange={(_, val) => updateSettings({ ...s, attack: val as number })}
                sx={{ color: '#7c4dff' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Decay: {Math.round(s.decay * 1000)} ms
              </Typography>
              <Slider
                size="small"
                value={s.decay}
                min={0.01}
                max={2.0}
                step={0.02}
                onChange={(_, val) => updateSettings({ ...s, decay: val as number })}
                sx={{ color: '#7c4dff' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Sustain: {Math.round(s.sustain * 100)}%
              </Typography>
              <Slider
                size="small"
                value={s.sustain}
                min={0}
                max={1.0}
                step={0.02}
                onChange={(_, val) => updateSettings({ ...s, sustain: val as number })}
                sx={{ color: '#7c4dff' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Release: {Math.round(s.release * 1000)} ms
              </Typography>
              <Slider
                size="small"
                value={s.release}
                min={0.02}
                max={2.5}
                step={0.02}
                onChange={(_, val) => updateSettings({ ...s, release: val as number })}
                sx={{ color: '#7c4dff' }}
              />
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#141622', borderColor: '#24283b' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e676', mb: 1.5 }}>
            FILTER & RESONANCE
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Filter Cutoff: {Math.round(s.filterCutoff)} Hz
              </Typography>
              <Slider
                size="small"
                value={s.filterCutoff}
                min={50}
                max={15000}
                step={50}
                onChange={(_, val) => updateSettings({ ...s, filterCutoff: val as number })}
                sx={{ color: '#00e676' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Resonance (Q): {s.filterResonance.toFixed(1)}
              </Typography>
              <Slider
                size="small"
                value={s.filterResonance}
                min={0.1}
                max={12}
                step={0.2}
                onChange={(_, val) => updateSettings({ ...s, filterResonance: val as number })}
                sx={{ color: '#00e676' }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#8b91a7', fontWeight: 600 }}>
                Env Modulation: {Math.round(s.filterEnvAmount)} Hz
              </Typography>
              <Slider
                size="small"
                value={s.filterEnvAmount}
                min={0}
                max={5000}
                step={50}
                onChange={(_, val) => updateSettings({ ...s, filterEnvAmount: val as number })}
                sx={{ color: '#00e676' }}
              />
            </Box>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: '#151622', borderTop: '1px solid #232736', px: 2, py: 1 }}>
        <Button onClick={handleTestNote} variant="outlined" color="secondary" sx={{ mr: 'auto' }}>
          Test Chord Preview
        </Button>
        <Button onClick={handleClose} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
