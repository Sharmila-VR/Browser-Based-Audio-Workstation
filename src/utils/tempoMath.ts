import { GridSnap, TimeSignature } from '../types/daw'

export function beatsToSeconds(beats: number, bpm: number): number {
  if (bpm <= 0) return 0
  return (beats * 60) / bpm
}

export function secondsToBeats(seconds: number, bpm: number): number {
  if (bpm <= 0) return 0
  return (seconds * bpm) / 60
}

export function gridSnapToBeats(snap: GridSnap): number {
  switch (snap) {
    case '1/1':
      return 4
    case '1/2':
      return 2
    case '1/4':
      return 1
    case '1/8':
      return 0.5
    case '1/16':
      return 0.25
    case '1/32':
      return 0.125
    case 'off':
    default:
      return 0
  }
}

export function snapBeatToGrid(beat: number, snap: GridSnap): number {
  const step = gridSnapToBeats(snap)
  if (step <= 0) return Math.max(0, beat)
  const snapped = Math.round(beat / step) * step
  return Math.max(0, Number(snapped.toFixed(4)))
}

export function formatBarsBeats(beats: number, timeSignature: TimeSignature): string {
  const beatsPerBar = timeSignature.numerator * (4 / timeSignature.denominator)
  const bar = Math.floor(beats / beatsPerBar) + 1
  const remainingBeats = beats % beatsPerBar
  const beatNumber = Math.floor(remainingBeats) + 1
  const sixteenth = Math.floor((remainingBeats - Math.floor(remainingBeats)) * 4) + 1
  return `${bar}.${beatNumber}.${sixteenth}`
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 100) % 100
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(mins)}:${pad(secs)}.${pad(ms)}`
}
