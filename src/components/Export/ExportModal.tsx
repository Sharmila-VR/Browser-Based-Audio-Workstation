import React, { useRef, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import CancelIcon from '@mui/icons-material/Cancel'
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone'
import { useAppDispatch, useAppSelector } from '../../store'
import { setExportModalOpen, announce } from '../../store/uiSlice'
import { renderProjectToWav } from '../../audio/offlineRenderer'
import { audioEngine } from '../../audio/audioEngine'

export const ExportModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.ui.exportModalOpen)
  const tracks = useAppSelector((state) => state.tracks.tracks)
  const bpm = useAppSelector((state) => state.transport.bpm)

  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const cancelSignal = useRef({ isCancelled: false })

  const handleStartExport = async () => {
    setIsExporting(true)
    setProgress(0.05)
    setStatus('Initializing OfflineAudioContext...')
    setDownloadUrl(null)
    cancelSignal.current.isCancelled = false
    dispatch(announce('Offline export started'))

    try {
      const buffers = (audioEngine as any).audioBuffers || new Map()
      const wavBlob = await renderProjectToWav(
        tracks,
        bpm,
        buffers,
        (p) => {
          setProgress(p.progress)
          setStatus(p.status)
        },
        cancelSignal.current
      )

      if (wavBlob) {
        const url = URL.createObjectURL(wavBlob)
        setDownloadUrl(url)
        setStatus('WAV export ready for download!')
        dispatch(announce('Offline export finished successfully'))
      } else {
        setStatus('Export was cancelled.')
      }
    } catch {
      setStatus('Export failed.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCancel = () => {
    cancelSignal.current.isCancelled = true
    setIsExporting(false)
    setStatus('Export cancelled.')
    dispatch(announce('Export cancelled'))
  }

  const handleClose = () => {
    if (isExporting) {
      handleCancel()
    }
    dispatch(setExportModalOpen(false))
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Export Full Mix to WAV
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: '#8b91a7' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#0e0f17' }}>
        <Typography variant="body2" sx={{ color: '#eceff4', mb: 2 }}>
          Renders all audio tracks, synthesizers, worklet DSP effects, and automation curves to an uncompressed 16-bit 44.1 kHz stereo WAV file using OfflineAudioContext.
        </Typography>

        {isExporting && (
          <Box sx={{ my: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress * 100}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: '#1d1f2b',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#00e5ff'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 600 }}>
                {status}
              </Typography>
              <Typography variant="caption" sx={{ color: '#eceff4', fontWeight: 700 }}>
                {Math.round(progress * 100)}%
              </Typography>
            </Box>
          </Box>
        )}

        {downloadUrl && (
          <Box
            sx={{
              p: 2,
              backgroundColor: '#141824',
              borderRadius: 1,
              border: '1px solid #00e676',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              my: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileDownloadDoneIcon sx={{ color: '#00e676' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#eceff4' }}>
                AuraDAW_Mix.wav (Ready)
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              href={downloadUrl}
              download="AuraDAW_Mix.wav"
              size="small"
            >
              Download
            </Button>
          </Box>
        )}

        <Typography variant="caption" sx={{ color: '#686e85', display: 'block', mt: 1 }}>
          Format: WAV (RIFF 16-bit Linear PCM, Stereo 44,100 Hz)
        </Typography>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: '#151622', borderTop: '1px solid #232736', px: 2, py: 1 }}>
        {isExporting ? (
          <Button
            onClick={handleCancel}
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
          >
            Cancel Render
          </Button>
        ) : (
          <Button
            onClick={handleStartExport}
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
          >
            {downloadUrl ? 'Render Again' : 'Start Export'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
