import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LookaheadScheduler, ScheduledEvent } from '../audio/scheduler'
import { Track } from '../types/daw'

describe('LookaheadScheduler', () => {
  let currentTime = 0
  let scheduledEvents: ScheduledEvent[]
  let advancedBeats: number[]

  const tracks: Track[] = [
    {
      id: 't1',
      name: 'Audio 1',
      type: 'audio',
      color: '#00e5ff',
      volume: 1.0,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      clips: [
        {
          id: 'clip_aud_1',
          trackId: 't1',
          type: 'audio',
          name: 'Audio Beat',
          startBeat: 1.0,
          durationBeats: 4.0,
          offsetBeats: 0,
          loop: false,
          audioBufferId: 'buf1',
          sampleRate: 44100,
          durationSeconds: 2.0
        }
      ],
      automationLanes: [
        {
          id: 'lane_vol',
          param: 'volume',
          enabled: true,
          points: [{ id: 'p1', beat: 2.0, value: 0.5 }]
        }
      ],
      effects: {} as any
    },
    {
      id: 't2',
      name: 'MIDI 1',
      type: 'midi',
      color: '#7c4dff',
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      clips: [
        {
          id: 'clip_midi_1',
          trackId: 't2',
          type: 'midi',
          name: 'Chords',
          startBeat: 0.0,
          durationBeats: 4.0,
          offsetBeats: 0,
          loop: false,
          notes: [
            { id: 'n1', pitch: 60, startBeat: 0.5, durationBeats: 1.0, velocity: 100 }
          ]
        }
      ],
      automationLanes: [],
      effects: {} as any
    }
  ]

  beforeEach(() => {
    currentTime = 0
    scheduledEvents = []
    advancedBeats = []
  })

  it('schedules events within lookahead window accurately', () => {
    const scheduler = new LookaheadScheduler({
      getContextTime: () => currentTime,
      getBpm: () => 120,
      getTracks: () => tracks,
      getLoopConfig: () => ({ enabled: false, startBeat: 0, endBeat: 16 }),
      onScheduleEvent: (event) => scheduledEvents.push(event),
      onPlayheadAdvance: (beat) => advancedBeats.push(beat)
    })

    scheduler.scheduleWindow(0.0, 3.0)

    const audioEvents = scheduledEvents.filter((e) => e.type === 'audio')
    const midiEvents = scheduledEvents.filter((e) => e.type === 'midi')
    const autoEvents = scheduledEvents.filter((e) => e.type === 'automation')

    expect(audioEvents).toHaveLength(1)
    expect(audioEvents[0].beat).toBe(1.0)
    expect(audioEvents[0].trackId).toBe('t1')

    expect(midiEvents).toHaveLength(1)
    expect(midiEvents[0].beat).toBe(0.5)
    expect(midiEvents[0].data.note.pitch).toBe(60)

    expect(autoEvents).toHaveLength(1)
    expect(autoEvents[0].beat).toBe(2.0)
    expect(autoEvents[0].data.value).toBe(0.5)
  })

  it('ignores muted tracks during scheduling', () => {
    const mutedTracks: Track[] = JSON.parse(JSON.stringify(tracks))
    mutedTracks[0].muted = true

    const scheduler = new LookaheadScheduler({
      getContextTime: () => currentTime,
      getBpm: () => 120,
      getTracks: () => mutedTracks,
      getLoopConfig: () => ({ enabled: false, startBeat: 0, endBeat: 16 }),
      onScheduleEvent: (event) => scheduledEvents.push(event),
      onPlayheadAdvance: () => {}
    })

    scheduler.scheduleWindow(0.0, 3.0)
    const audioEvents = scheduledEvents.filter((e) => e.type === 'audio')
    expect(audioEvents).toHaveLength(0)
  })

  it('handles start and stop lifecycle', () => {
    const scheduler = new LookaheadScheduler({
      getContextTime: () => currentTime,
      getBpm: () => 120,
      getTracks: () => tracks,
      getLoopConfig: () => ({ enabled: false, startBeat: 0, endBeat: 16 }),
      onScheduleEvent: (event) => scheduledEvents.push(event),
      onPlayheadAdvance: () => {}
    })

    scheduler.start(0)
    expect(scheduler.getIsRunning()).toBe(true)

    scheduler.stop()
    expect(scheduler.getIsRunning()).toBe(false)
  })
})
