import { GridSnap, Note } from '../types/daw'
import { gridSnapToBeats, snapBeatToGrid } from './tempoMath'

export function quantizeNotes(
  notes: Note[],
  grid: GridSnap,
  strength: number = 1.0,
  quantizeDuration: boolean = false
): Note[] {
  if (grid === 'off') return notes
  const step = gridSnapToBeats(grid)
  if (step <= 0) return notes

  const factor = Math.max(0, Math.min(1, strength))

  return notes.map((note) => {
    const targetStart = snapBeatToGrid(note.startBeat, grid)
    const newStart = note.startBeat + (targetStart - note.startBeat) * factor

    let newDuration = note.durationBeats
    if (quantizeDuration) {
      const targetDuration = Math.max(step, snapBeatToGrid(note.durationBeats, grid))
      newDuration = note.durationBeats + (targetDuration - note.durationBeats) * factor
    }

    return {
      ...note,
      startBeat: Number(Math.max(0, newStart).toFixed(4)),
      durationBeats: Number(Math.max(0.0625, newDuration).toFixed(4))
    }
  })
}
