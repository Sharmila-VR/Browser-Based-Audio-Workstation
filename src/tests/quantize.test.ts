import { describe, it, expect } from 'vitest'
import { quantizeNotes } from '../utils/quantize'
import { Note } from '../types/daw'

describe('quantizeNotes', () => {
  const sampleNotes: Note[] = [
    { id: 'n1', pitch: 60, startBeat: 0.22, durationBeats: 0.9, velocity: 100 },
    { id: 'n2', pitch: 64, startBeat: 1.15, durationBeats: 0.8, velocity: 90 },
    { id: 'n3', pitch: 67, startBeat: 2.89, durationBeats: 1.05, velocity: 110 }
  ]

  it('leaves notes unchanged when snap is off', () => {
    const result = quantizeNotes(sampleNotes, 'off')
    expect(result).toEqual(sampleNotes)
  })

  it('quantizes note starts to 1/4 grid with 100% strength', () => {
    const result = quantizeNotes(sampleNotes, '1/4', 1.0)
    expect(result[0].startBeat).toBe(0)
    expect(result[1].startBeat).toBe(1)
    expect(result[2].startBeat).toBe(3)
  })

  it('quantizes note starts to 1/16 grid with 100% strength', () => {
    const result = quantizeNotes(sampleNotes, '1/16', 1.0)
    expect(result[0].startBeat).toBe(0.25)
    expect(result[1].startBeat).toBe(1.25)
    expect(result[2].startBeat).toBe(3.0)
  })

  it('applies partial quantize strength correctly', () => {
    const result = quantizeNotes(sampleNotes, '1/4', 0.5)
    expect(result[0].startBeat).toBeCloseTo(0.11, 2)
    expect(result[1].startBeat).toBeCloseTo(1.075, 2)
  })

  it('quantizes note duration when requested', () => {
    const result = quantizeNotes(sampleNotes, '1/4', 1.0, true)
    expect(result[0].durationBeats).toBe(1.0)
    expect(result[1].durationBeats).toBe(1.0)
    expect(result[2].durationBeats).toBe(1.0)
  })
})
