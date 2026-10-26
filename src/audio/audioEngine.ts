import { MeterData, Note, SynthSettings, Track, TrackEffects } from '../types/daw'
import { LookaheadScheduler, ScheduledEvent } from './scheduler'
import { SynthEngine } from './synthEngine'
import { dspWorkletCode } from './workletCode'

export interface TrackAudioNodes {
  inputGain: GainNode
  eqNode: AudioNode
  compNode: AudioNode
  delayNode: AudioNode
  volumeGain: GainNode
  pannerNode: StereoPannerNode
  muteGain: GainNode
  analyserNode: AnalyserNode
  synth: SynthEngine
  activeSources: AudioBufferSourceNode[]
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private masterAnalyser: AnalyserNode | null = null
  private tracksAudio = new Map<string, TrackAudioNodes>()
  private audioBuffers = new Map<string, AudioBuffer>()
  private scheduler: LookaheadScheduler | null = null
  private workletReady = false
  private isMutedMaster = false

  public onPlayheadUpdate?: (beat: number) => void
  public onMeterUpdate?: (trackMeters: Record<string, MeterData>, masterMeter: MeterData) => void

  public async init() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    this.ctx = new AudioCtx({ latencyHint: 'interactive' })

    this.masterGain = this.ctx.createGain()
    this.masterAnalyser = this.ctx.createAnalyser()
    this.masterAnalyser.fftSize = 256
    this.masterAnalyser.smoothingTimeConstant = 0.5

    this.masterGain.connect(this.masterAnalyser)
    this.masterAnalyser.connect(this.ctx.destination)

    try {
      const blob = new Blob([dspWorkletCode], { type: 'application/javascript' })
      const workletUrl = URL.createObjectURL(blob)
      await this.ctx.audioWorklet.addModule(workletUrl)
      this.workletReady = true
    } catch {
      this.workletReady = false
    }

    this.startMeterLoop()
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AudioCtx({ latencyHint: 'interactive' })
    }
    return this.ctx
  }

  public async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  public storeAudioBuffer(id: string, buffer: AudioBuffer) {
    this.audioBuffers.set(id, buffer)
  }

  public getAudioBuffer(id: string): AudioBuffer | undefined {
    return this.audioBuffers.get(id)
  }

  public syncTracks(tracks: Track[]) {
    if (!this.ctx) return
    const currentTrackIds = new Set(tracks.map((t) => t.id))

    for (const [id, nodes] of this.tracksAudio.entries()) {
      if (!currentTrackIds.has(id)) {
        this.destroyTrackNodes(id, nodes)
        this.tracksAudio.delete(id)
      }
    }

    const hasAnySolo = tracks.some((t) => t.soloed)

    for (const track of tracks) {
      let nodes = this.tracksAudio.get(track.id)
      if (!nodes) {
        nodes = this.createTrackNodes(track)
        this.tracksAudio.set(track.id, nodes)
      }

      this.updateTrackNodes(track, nodes, hasAnySolo)
    }
  }

  private createTrackNodes(track: Track): TrackAudioNodes {
    const ctx = this.ctx!
    const inputGain = ctx.createGain()
    const volumeGain = ctx.createGain()
    const pannerNode = ctx.createStereoPanner()
    const muteGain = ctx.createGain()
    const analyserNode = ctx.createAnalyser()
    analyserNode.fftSize = 256
    analyserNode.smoothingTimeConstant = 0.5

    let eqNode: AudioNode
    let compNode: AudioNode
    let delayNode: AudioNode

    if (this.workletReady) {
      try {
        eqNode = new AudioWorkletNode(ctx, 'parametric-eq-processor')
        compNode = new AudioWorkletNode(ctx, 'compressor-processor')
        delayNode = new AudioWorkletNode(ctx, 'delay-reverb-processor')
      } catch {
        eqNode = this.createFallbackEQ(ctx)
        compNode = ctx.createDynamicsCompressor()
        delayNode = this.createFallbackDelay(ctx)
      }
    } else {
      eqNode = this.createFallbackEQ(ctx)
      compNode = ctx.createDynamicsCompressor()
      delayNode = this.createFallbackDelay(ctx)
    }

    inputGain.connect(eqNode)
    eqNode.connect(compNode)
    compNode.connect(delayNode)
    delayNode.connect(volumeGain)
    volumeGain.connect(pannerNode)
    pannerNode.connect(muteGain)
    muteGain.connect(analyserNode)
    analyserNode.connect(this.masterGain!)

    const synth = new SynthEngine(ctx, inputGain)

    return {
      inputGain,
      eqNode,
      compNode,
      delayNode,
      volumeGain,
      pannerNode,
      muteGain,
      analyserNode,
      synth,
      activeSources: []
    }
  }

  private createFallbackEQ(ctx: AudioContext): AudioNode {
    const low = ctx.createBiquadFilter()
    low.type = 'lowshelf'
    const mid = ctx.createBiquadFilter()
    mid.type = 'peaking'
    const high = ctx.createBiquadFilter()
    high.type = 'highshelf'
    low.connect(mid)
    mid.connect(high)
    ;(low as any)._chainHigh = high
    return low
  }

  private createFallbackDelay(ctx: AudioContext): AudioNode {
    const input = ctx.createGain()
    const delay = ctx.createDelay(2.0)
    delay.delayTime.value = 0.3
    const feedback = ctx.createGain()
    feedback.gain.value = 0.3
    const output = ctx.createGain()

    input.connect(output)
    input.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(output)

    ;(input as any)._output = output
    return input
  }

  private updateTrackNodes(track: Track, nodes: TrackAudioNodes, hasAnySolo: boolean) {
    const ctx = this.ctx!
    const now = ctx.currentTime

    nodes.volumeGain.gain.setTargetAtTime(Math.max(0, track.volume), now, 0.01)
    nodes.pannerNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, track.pan)), now, 0.01)

    const isAudible = !track.muted && (!hasAnySolo || track.soloed)
    nodes.muteGain.gain.setTargetAtTime(isAudible ? 1.0 : 0.0, now, 0.01)

    this.applyEffects(track.effects, nodes)
  }

  private applyEffects(fx: TrackEffects, nodes: TrackAudioNodes) {
    if (this.workletReady && nodes.eqNode instanceof AudioWorkletNode) {
      const eqParams = (nodes.eqNode as AudioWorkletNode).parameters
      eqParams.get('bypass')?.setValueAtTime(fx.eq.enabled ? 0 : 1, 0)
      eqParams.get('lowGain')?.setValueAtTime(fx.eq.lowGain, 0)
      eqParams.get('lowFreq')?.setValueAtTime(fx.eq.lowFreq, 0)
      eqParams.get('midGain')?.setValueAtTime(fx.eq.midGain, 0)
      eqParams.get('midFreq')?.setValueAtTime(fx.eq.midFreq, 0)
      eqParams.get('midQ')?.setValueAtTime(fx.eq.midQ, 0)
      eqParams.get('highGain')?.setValueAtTime(fx.eq.highGain, 0)
      eqParams.get('highFreq')?.setValueAtTime(fx.eq.highFreq, 0)

      const compParams = (nodes.compNode as AudioWorkletNode).parameters
      compParams.get('bypass')?.setValueAtTime(fx.compressor.enabled ? 0 : 1, 0)
      compParams.get('threshold')?.setValueAtTime(fx.compressor.threshold, 0)
      compParams.get('ratio')?.setValueAtTime(fx.compressor.ratio, 0)
      compParams.get('attack')?.setValueAtTime(fx.compressor.attack, 0)
      compParams.get('release')?.setValueAtTime(fx.compressor.release, 0)
      compParams.get('knee')?.setValueAtTime(fx.compressor.knee, 0)
      compParams.get('makeupGain')?.setValueAtTime(fx.compressor.makeupGain, 0)

      const delayParams = (nodes.delayNode as AudioWorkletNode).parameters
      delayParams.get('bypass')?.setValueAtTime(fx.delay.enabled ? 0 : 1, 0)
      delayParams.get('time')?.setValueAtTime(fx.delay.time, 0)
      delayParams.get('feedback')?.setValueAtTime(fx.delay.feedback, 0)
      delayParams.get('mix')?.setValueAtTime(fx.delay.mix, 0)
      delayParams.get('damp')?.setValueAtTime(fx.delay.dampFreq, 0)
    }
  }

  public setMasterVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return
    this.masterGain.gain.setTargetAtTime(Math.max(0, volume), this.ctx.currentTime, 0.01)
  }

  public playClipAudio(trackId: string, bufferId: string, time: number, offsetBeats: number = 0) {
    const nodes = this.tracksAudio.get(trackId)
    const buffer = this.audioBuffers.get(bufferId)
    if (!nodes || !buffer || !this.ctx) return

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(nodes.inputGain)

    source.start(Math.max(this.ctx.currentTime, time), Math.max(0, offsetBeats))
    nodes.activeSources.push(source)

    source.onended = () => {
      try {
        source.disconnect()
      } catch {
        // Disconnect
      }
      nodes.activeSources = nodes.activeSources.filter((s) => s !== source)
    }
  }

  public playSynthNote(
    trackId: string,
    pitch: number,
    velocity: number,
    time: number,
    durationSec: number,
    settings?: SynthSettings
  ) {
    const nodes = this.tracksAudio.get(trackId)
    if (!nodes || !this.ctx) return
    nodes.synth.noteOn(pitch, velocity, Math.max(this.ctx.currentTime, time), settings, durationSec)
  }

  public triggerLiveNoteOn(trackId: string, pitch: number, velocity: number, settings?: SynthSettings) {
    const nodes = this.tracksAudio.get(trackId)
    if (!nodes || !this.ctx) return
    nodes.synth.noteOn(pitch, velocity, this.ctx.currentTime, settings)
  }

  public triggerLiveNoteOff(trackId: string, pitch: number, settings?: SynthSettings) {
    const nodes = this.tracksAudio.get(trackId)
    if (!nodes || !this.ctx) return
    nodes.synth.noteOff(pitch, this.ctx.currentTime, settings)
  }

  public setAutomationValue(trackId: string, param: string, value: number, time: number) {
    const nodes = this.tracksAudio.get(trackId)
    if (!nodes || !this.ctx) return

    const atTime = Math.max(this.ctx.currentTime, time)
    if (param === 'volume') {
      nodes.volumeGain.gain.setValueAtTime(value, atTime)
    } else if (param === 'pan') {
      nodes.pannerNode.pan.setValueAtTime(value, atTime)
    } else if (this.workletReady) {
      if (nodes.eqNode instanceof AudioWorkletNode && param.startsWith('eq')) {
        const p = (nodes.eqNode as AudioWorkletNode).parameters.get(param)
        p?.setValueAtTime(value, atTime)
      } else if (nodes.compNode instanceof AudioWorkletNode && param.startsWith('comp')) {
        const p = (nodes.compNode as AudioWorkletNode).parameters.get(param.replace('comp', '').toLowerCase())
        p?.setValueAtTime(value, atTime)
      } else if (nodes.delayNode instanceof AudioWorkletNode && param.startsWith('delay')) {
        const p = (nodes.delayNode as AudioWorkletNode).parameters.get(param.replace('delay', '').toLowerCase())
        p?.setValueAtTime(value, atTime)
      }
    }
  }

  public startPlayback(
    startBeat: number,
    bpm: number,
    getTracks: () => Track[],
    getLoop: () => { enabled: boolean; startBeat: number; endBeat: number }
  ) {
    this.resume()
    if (!this.scheduler) {
      this.scheduler = new LookaheadScheduler({
        getContextTime: () => (this.ctx ? this.ctx.currentTime : 0),
        getBpm: () => bpm,
        getTracks,
        getLoopConfig: getLoop,
        onScheduleEvent: (event: ScheduledEvent) => {
          this.handleScheduledEvent(event)
        },
        onPlayheadAdvance: (currentBeat: number) => {
          this.onPlayheadUpdate?.(currentBeat)
        }
      })
    }
    this.scheduler.start(startBeat)
  }

  public stopPlayback() {
    if (this.scheduler) {
      this.scheduler.stop()
    }
    this.tracksAudio.forEach((nodes) => {
      nodes.activeSources.forEach((source) => {
        try {
          source.stop()
          source.disconnect()
        } catch {
          // Stopped
        }
      })
      nodes.activeSources = []
      nodes.synth.releaseAll()
    })
  }

  private handleScheduledEvent(event: ScheduledEvent) {
    if (event.type === 'audio') {
      this.playClipAudio(event.trackId, event.data.audioBufferId, event.audioTime, event.data.offsetBeats)
    } else if (event.type === 'midi') {
      const { note, durationSec, synthSettings } = event.data
      this.playSynthNote(
        event.trackId,
        note.pitch,
        note.velocity,
        event.audioTime,
        durationSec,
        synthSettings
      )
    } else if (event.type === 'automation') {
      this.setAutomationValue(event.trackId, event.data.param, event.data.value, event.audioTime)
    }
  }

  private startMeterLoop() {
    const buffer = new Float32Array(256)

    const calcMeter = (analyser: AnalyserNode): MeterData => {
      analyser.getFloatTimeDomainData(buffer)
      let sumSq = 0
      let peak = 0
      for (let i = 0; i < buffer.length; i++) {
        const val = Math.abs(buffer[i])
        if (val > peak) peak = val
        sumSq += val * val
      }
      const rms = Math.sqrt(sumSq / buffer.length)
      const toDb = (linear: number) => (linear > 1e-4 ? 20 * Math.log10(linear) : -60)
      const peakDb = Math.max(-60, Math.min(6, toDb(peak)))
      const rmsDb = Math.max(-60, Math.min(6, toDb(rms)))
      return { peakL: peakDb, peakR: peakDb, rmsL: rmsDb, rmsR: rmsDb }
    }

    const tickMeters = () => {
      if (this.onMeterUpdate && this.ctx && this.masterAnalyser) {
        const trackMeters: Record<string, MeterData> = {}
        this.tracksAudio.forEach((nodes, trackId) => {
          trackMeters[trackId] = calcMeter(nodes.analyserNode)
        })
        const masterMeter = calcMeter(this.masterAnalyser)
        this.onMeterUpdate(trackMeters, masterMeter)
      }
      requestAnimationFrame(tickMeters)
    }

    requestAnimationFrame(tickMeters)
  }

  private destroyTrackNodes(id: string, nodes: TrackAudioNodes) {
    try {
      nodes.activeSources.forEach((s) => s.stop())
      nodes.synth.releaseAll()
      nodes.inputGain.disconnect()
      nodes.eqNode.disconnect()
      nodes.compNode.disconnect()
      nodes.delayNode.disconnect()
      nodes.volumeGain.disconnect()
      nodes.pannerNode.disconnect()
      nodes.muteGain.disconnect()
      nodes.analyserNode.disconnect()
    } catch {
      // Clean disconnect
    }
  }
}

export const audioEngine = new AudioEngine()
