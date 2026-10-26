export function generateKickSample(ctx: BaseAudioContext): AudioBuffer {
  const duration = 0.4
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    const pitch = 150 * Math.exp(-t * 28) + 45
    const phase = 2 * Math.PI * pitch * t
    const click = t < 0.005 ? (1 - t / 0.005) * (Math.random() * 2 - 1) * 0.3 : 0
    const env = Math.exp(-t * 9)
    const sample = (Math.sin(phase) + click) * env
    left[i] = sample
    right[i] = sample
  }

  return buffer
}

export function generateSnareSample(ctx: BaseAudioContext): AudioBuffer {
  const duration = 0.35
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    const tonePitch = 180 * Math.exp(-t * 20) + 120
    const tone = Math.sin(2 * Math.PI * tonePitch * t) * Math.exp(-t * 15) * 0.4
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.6
    const sample = (tone + noise) * 0.8
    left[i] = sample
    right[i] = sample
  }

  return buffer
}

export function generateHiHatLoop(ctx: BaseAudioContext, bpm: number): AudioBuffer {
  const secondsPerBeat = 60 / bpm
  const duration = secondsPerBeat * 4
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  const sixteenthSec = secondsPerBeat / 4
  const totalSixteenths = 16

  for (let s = 0; s < totalSixteenths; s++) {
    const hitTime = s * sixteenthSec
    const hitIndex = Math.floor(hitTime * sampleRate)
    const isAccent = s % 4 === 2
    const hitVol = isAccent ? 0.35 : s % 2 === 0 ? 0.22 : 0.14
    const hitLen = Math.floor(sampleRate * (isAccent ? 0.08 : 0.04))

    for (let i = 0; i < hitLen && hitIndex + i < length; i++) {
      const t = i / sampleRate
      const env = Math.exp(-t * (isAccent ? 50 : 90))
      const noise = (Math.random() * 2 - 1) * env * hitVol
      left[hitIndex + i] += noise
      right[hitIndex + i] += noise * 0.95
    }
  }

  return buffer
}

export function generateDrumBeatLoop(ctx: BaseAudioContext, bpm: number): AudioBuffer {
  const secondsPerBeat = 60 / bpm
  const duration = secondsPerBeat * 4
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  const kick = generateKickSample(ctx).getChannelData(0)
  const snare = generateSnareSample(ctx).getChannelData(0)
  const hihat = generateHiHatLoop(ctx, bpm)
  const hhL = hihat.getChannelData(0)
  const hhR = hihat.getChannelData(1)

  const mixIn = (source: Float32Array, startSec: number, gain = 1.0) => {
    const startIdx = Math.floor(startSec * sampleRate)
    for (let i = 0; i < source.length && startIdx + i < length; i++) {
      left[startIdx + i] += source[i] * gain
      right[startIdx + i] += source[i] * gain
    }
  }

  mixIn(kick, 0.0, 0.9)
  mixIn(snare, secondsPerBeat, 0.8)
  mixIn(kick, secondsPerBeat * 2.0, 0.9)
  mixIn(kick, secondsPerBeat * 2.75, 0.75)
  mixIn(snare, secondsPerBeat * 3.0, 0.8)

  for (let i = 0; i < length; i++) {
    left[i] = Math.max(-1, Math.min(1, left[i] + hhL[i]))
    right[i] = Math.max(-1, Math.min(1, right[i] + hhR[i]))
  }

  return buffer
}

export function generateSynthBassLoop(ctx: BaseAudioContext, bpm: number): AudioBuffer {
  const secondsPerBeat = 60 / bpm
  const duration = secondsPerBeat * 4
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  const notes = [
    { beat: 0, pitch: 36, dur: 0.75 },
    { beat: 1, pitch: 36, dur: 0.5 },
    { beat: 1.75, pitch: 39, dur: 0.75 },
    { beat: 2.5, pitch: 41, dur: 0.5 },
    { beat: 3.25, pitch: 43, dur: 0.6 }
  ]

  notes.forEach((n) => {
    const startIdx = Math.floor(n.beat * secondsPerBeat * sampleRate)
    const hitLen = Math.floor(n.dur * secondsPerBeat * sampleRate)
    const freq = 440 * Math.pow(2, (n.pitch - 69) / 12)

    for (let i = 0; i < hitLen && startIdx + i < length; i++) {
      const t = i / sampleRate
      const env = Math.exp(-t * 3.5)
      const sub = Math.sin(2 * Math.PI * freq * t) * 0.5
      const saw = ((freq * t) % 1 - 0.5) * 0.3
      const sample = (sub + saw) * env * 0.7
      left[startIdx + i] += sample
      right[startIdx + i] += sample
    }
  })

  for (let i = 0; i < length; i++) {
    left[i] = Math.max(-1, Math.min(1, left[i]))
    right[i] = Math.max(-1, Math.min(1, right[i]))
  }

  return buffer
}
