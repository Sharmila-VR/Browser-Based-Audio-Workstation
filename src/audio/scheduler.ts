import { Clip, Note, Track } from '../types/daw'
import { beatsToSeconds } from '../utils/tempoMath'

export interface ScheduledEvent {
  id: string
  type: 'audio' | 'midi' | 'automation'
  trackId: string
  audioTime: number
  beat: number
  data: any
}

export interface SchedulerConfig {
  lookaheadMs: number
  scheduleAheadSeconds: number
}

export class LookaheadScheduler {
  public lookaheadMs = 25
  public scheduleAheadSeconds = 0.1
  private timerId: any = null
  private nextScheduleBeat = 0
  private audioContextStartTime = 0
  private isRunning = false
  private getContextTime: () => number
  private getBpm: () => number
  private getTracks: () => Track[]
  private getLoopConfig: () => { enabled: boolean; startBeat: number; endBeat: number }
  private onScheduleEvent: (event: ScheduledEvent) => void
  private onPlayheadAdvance: (currentBeat: number) => void

  constructor(options: {
    getContextTime: () => number
    getBpm: () => number
    getTracks: () => Track[]
    getLoopConfig: () => { enabled: boolean; startBeat: number; endBeat: number }
    onScheduleEvent: (event: ScheduledEvent) => void
    onPlayheadAdvance: (currentBeat: number) => void
  }) {
    this.getContextTime = options.getContextTime
    this.getBpm = options.getBpm
    this.getTracks = options.getTracks
    this.getLoopConfig = options.getLoopConfig
    this.onScheduleEvent = options.onScheduleEvent
    this.onPlayheadAdvance = options.onPlayheadAdvance
  }

  public start(startBeat: number = 0) {
    this.stop()
    this.isRunning = true
    this.nextScheduleBeat = startBeat
    this.audioContextStartTime = this.getContextTime()

    this.timerId = setInterval(() => {
      this.tick()
    }, this.lookaheadMs)

    this.tick()
  }

  public stop() {
    this.isRunning = false
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }

  public tick() {
    if (!this.isRunning) return

    const now = this.getContextTime()
    const bpm = this.getBpm()
    const elapsedSec = Math.max(0, now - this.audioContextStartTime)
    const currentAudioBeat = (elapsedSec * bpm) / 60

    this.onPlayheadAdvance(this.nextScheduleBeat)

    const windowEndSec = now + this.scheduleAheadSeconds
    const windowEndBeat = this.nextScheduleBeat + ((this.scheduleAheadSeconds) * bpm) / 60

    this.scheduleWindow(this.nextScheduleBeat, windowEndBeat)
    this.nextScheduleBeat = windowEndBeat

    const loop = this.getLoopConfig()
    if (loop.enabled && loop.endBeat > loop.startBeat && this.nextScheduleBeat >= loop.endBeat) {
      const overshoot = this.nextScheduleBeat - loop.endBeat
      this.nextScheduleBeat = loop.startBeat + overshoot
      this.audioContextStartTime = now - (beatsToSeconds(this.nextScheduleBeat, bpm))
    }
  }

  public scheduleWindow(startBeat: number, endBeat: number) {
    const tracks = this.getTracks()
    const bpm = this.getBpm()
    const now = this.getContextTime()

    for (const track of tracks) {
      if (track.muted) continue

      for (const clip of track.clips) {
        const clipStart = clip.startBeat
        const clipEnd = clip.startBeat + clip.durationBeats

        if (clipEnd <= startBeat || clipStart >= endBeat) {
          continue
        }

        if (clip.type === 'audio') {
          if (clipStart >= startBeat && clipStart < endBeat) {
            const delayBeats = clipStart - startBeat
            const scheduleAudioTime = now + beatsToSeconds(delayBeats, bpm)
            this.onScheduleEvent({
              id: `${clip.id}_${clipStart}`,
              type: 'audio',
              trackId: track.id,
              audioTime: scheduleAudioTime,
              beat: clipStart,
              data: clip
            })
          }
        } else if (clip.type === 'midi') {
          for (const note of clip.notes) {
            const noteAbsoluteBeat = clipStart + note.startBeat
            if (noteAbsoluteBeat >= startBeat && noteAbsoluteBeat < endBeat) {
              const delayBeats = noteAbsoluteBeat - startBeat
              const scheduleAudioTime = now + beatsToSeconds(delayBeats, bpm)
              const durationSec = beatsToSeconds(note.durationBeats, bpm)
              this.onScheduleEvent({
                id: `${clip.id}_note_${note.id}`,
                type: 'midi',
                trackId: track.id,
                audioTime: scheduleAudioTime,
                beat: noteAbsoluteBeat,
                data: {
                  note,
                  durationSec,
                  synthSettings: track.synthSettings
                }
              })
            }
          }
        }
      }

      for (const lane of track.automationLanes) {
        if (!lane.enabled) continue
        for (const point of lane.points) {
          if (point.beat >= startBeat && point.beat < endBeat) {
            const delayBeats = point.beat - startBeat
            const scheduleAudioTime = now + beatsToSeconds(delayBeats, bpm)
            this.onScheduleEvent({
              id: `${lane.id}_point_${point.id}`,
              type: 'automation',
              trackId: track.id,
              audioTime: scheduleAudioTime,
              beat: point.beat,
              data: {
                param: lane.param,
                value: point.value
              }
            })
          }
        }
      }
    }
  }
}
