import { describe, it, expect } from 'vitest'
import {
  beatsToSeconds,
  secondsToBeats,
  gridSnapToBeats,
  snapBeatToGrid,
  formatBarsBeats,
  formatTime
} from '../utils/tempoMath'

describe('tempoMath', () => {
  describe('beatsToSeconds', () => {
    it('converts beats to seconds correctly at 120 BPM', () => {
      expect(beatsToSeconds(2, 120)).toBe(1.0)
      expect(beatsToSeconds(4, 120)).toBe(2.0)
      expect(beatsToSeconds(1, 60)).toBe(1.0)
      expect(beatsToSeconds(0, 120)).toBe(0)
    })

    it('handles zero or negative BPM safely', () => {
      expect(beatsToSeconds(4, 0)).toBe(0)
      expect(beatsToSeconds(4, -10)).toBe(0)
    })
  })

  describe('secondsToBeats', () => {
    it('converts seconds to beats correctly at 120 BPM', () => {
      expect(secondsToBeats(1.0, 120)).toBe(2.0)
      expect(secondsToBeats(2.0, 120)).toBe(4.0)
      expect(secondsToBeats(0.5, 60)).toBe(0.5)
      expect(secondsToBeats(0, 120)).toBe(0)
    })

    it('handles non-positive BPM safely', () => {
      expect(secondsToBeats(2.0, 0)).toBe(0)
      expect(secondsToBeats(2.0, -50)).toBe(0)
    })
  })

  describe('gridSnapToBeats', () => {
    it('returns correct beat duration for every grid snap setting', () => {
      expect(gridSnapToBeats('1/1')).toBe(4)
      expect(gridSnapToBeats('1/2')).toBe(2)
      expect(gridSnapToBeats('1/4')).toBe(1)
      expect(gridSnapToBeats('1/8')).toBe(0.5)
      expect(gridSnapToBeats('1/16')).toBe(0.25)
      expect(gridSnapToBeats('1/32')).toBe(0.125)
      expect(gridSnapToBeats('off')).toBe(0)
    })
  })

  describe('snapBeatToGrid', () => {
    it('snaps beat positions to the nearest grid step', () => {
      expect(snapBeatToGrid(1.1, '1/4')).toBe(1)
      expect(snapBeatToGrid(1.6, '1/4')).toBe(2)
      expect(snapBeatToGrid(0.24, '1/16')).toBe(0.25)
      expect(snapBeatToGrid(0.26, '1/16')).toBe(0.25)
      expect(snapBeatToGrid(0.4, '1/2')).toBe(0)
      expect(snapBeatToGrid(1.6, '1/2')).toBe(2)
    })

    it('returns exact beat when snap is off or negative', () => {
      expect(snapBeatToGrid(1.234, 'off')).toBe(1.234)
      expect(snapBeatToGrid(-5, 'off')).toBe(0)
      expect(snapBeatToGrid(-2, '1/4')).toBe(0)
    })
  })

  describe('formatBarsBeats', () => {
    it('formats 4/4 beats into Bar.Beat.16th', () => {
      expect(formatBarsBeats(0, { numerator: 4, denominator: 4 })).toBe('1.1.1')
      expect(formatBarsBeats(1, { numerator: 4, denominator: 4 })).toBe('1.2.1')
      expect(formatBarsBeats(4, { numerator: 4, denominator: 4 })).toBe('2.1.1')
      expect(formatBarsBeats(5.5, { numerator: 4, denominator: 4 })).toBe('2.2.3')
    })

    it('formats 3/4 beats correctly', () => {
      expect(formatBarsBeats(0, { numerator: 3, denominator: 4 })).toBe('1.1.1')
      expect(formatBarsBeats(3, { numerator: 3, denominator: 4 })).toBe('2.1.1')
    })
  })

  describe('formatTime', () => {
    it('formats seconds into mm:ss.ms', () => {
      expect(formatTime(0)).toBe('00:00.00')
      expect(formatTime(65.4)).toBe('01:05.40')
      expect(formatTime(125.08)).toBe('02:05.08')
    })
  })
})
