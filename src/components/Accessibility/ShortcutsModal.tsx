import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../store'
import { setShortcutsModalOpen } from '../../store/uiSlice'

export const ShortcutsModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.ui.shortcutsModalOpen)

  const handleClose = () => {
    dispatch(setShortcutsModalOpen(false))
  }

  const shortcuts = [
    { key: 'Space', desc: 'Play / Stop playback' },
    { key: 'R', desc: 'Toggle recording on armed track' },
    { key: 'Enter / Home', desc: 'Rewind playhead to start' },
    { key: 'S', desc: 'Split selected clip at playhead' },
    { key: 'Delete / Backspace', desc: 'Delete selected clip' },
    { key: 'Ctrl + Z', desc: 'Undo last operation' },
    { key: 'Ctrl + Y / Ctrl + Shift + Z', desc: 'Redo last operation' },
    { key: 'Left / Right Arrow', desc: 'Nudge playhead by 1 beat' },
    { key: 'A - L (Keyboard)', desc: 'Musical typing (play synth notes)' },
    { key: 'Z / X', desc: 'Shift musical typing octave down / up' }
  ]

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Keyboard Shortcuts & Accessibility</DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shortcuts.map((s) => (
                <TableRow key={s.key}>
                  <TableCell>
                    <Chip label={s.key} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>{s.desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )
}
