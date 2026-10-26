class ParametricEQProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'lowGain', defaultValue: 0, minValue: -24, maxValue: 24, automationRate: 'a-rate' },
      { name: 'lowFreq', defaultValue: 100, minValue: 20, maxValue: 1000, automationRate: 'k-rate' },
      { name: 'midGain', defaultValue: 0, minValue: -24, maxValue: 24, automationRate: 'a-rate' },
      { name: 'midFreq', defaultValue: 1000, minValue: 200, maxValue: 8000, automationRate: 'k-rate' },
      { name: 'midQ', defaultValue: 1.0, minValue: 0.1, maxValue: 10, automationRate: 'k-rate' },
      { name: 'highGain', defaultValue: 0, minValue: -24, maxValue: 24, automationRate: 'a-rate' },
      { name: 'highFreq', defaultValue: 6000, minValue: 1000, maxValue: 20000, automationRate: 'k-rate' },
      { name: 'bypass', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ]
  }

  constructor() {
    super()
    this.x1 = [0, 0]
    this.x2 = [0, 0]
    this.y1 = [0, 0]
    this.y2 = [0, 0]

    this.mx1 = [0, 0]
    this.mx2 = [0, 0]
    this.my1 = [0, 0]
    this.my2 = [0, 0]

    this.hx1 = [0, 0]
    this.hx2 = [0, 0]
    this.hy1 = [0, 0]
    this.hy2 = [0, 0]
  }

  computeLowShelf(freq, gainDb) {
    const A = Math.pow(10, gainDb / 40)
    const w0 = (2 * Math.PI * freq) / sampleRate
    const cosw0 = Math.cos(w0)
    const sinw0 = Math.sin(w0)
    const alpha = (sinw0 / 2) * Math.SQRT2
    const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha

    const b0 = A * (A + 1 - (A - 1) * cosw0 + twoSqrtAAlpha)
    const b1 = 2 * A * (A - 1 - (A + 1) * cosw0)
    const b2 = A * (A + 1 - (A - 1) * cosw0 - twoSqrtAAlpha)
    const a0 = A + 1 + (A - 1) * cosw0 + twoSqrtAAlpha
    const a1 = -2 * (A - 1 + (A + 1) * cosw0)
    const a2 = A + 1 + (A - 1) * cosw0 - twoSqrtAAlpha

    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0]
  }

  computePeaking(freq, gainDb, Q) {
    const A = Math.pow(10, gainDb / 40)
    const w0 = (2 * Math.PI * freq) / sampleRate
    const cosw0 = Math.cos(w0)
    const alpha = Math.sin(w0) / (2 * Math.max(0.01, Q))

    const b0 = 1 + alpha * A
    const b1 = -2 * cosw0
    const b2 = 1 - alpha * A
    const a0 = 1 + alpha / A
    const a1 = -2 * cosw0
    const a2 = 1 - alpha / A

    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0]
  }

  computeHighShelf(freq, gainDb) {
    const A = Math.pow(10, gainDb / 40)
    const w0 = (2 * Math.PI * freq) / sampleRate
    const cosw0 = Math.cos(w0)
    const sinw0 = Math.sin(w0)
    const alpha = (sinw0 / 2) * Math.SQRT2
    const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha

    const b0 = A * (A + 1 + (A - 1) * cosw0 + twoSqrtAAlpha)
    const b1 = -2 * A * (A - 1 + (A + 1) * cosw0)
    const b2 = A * (A + 1 + (A - 1) * cosw0 - twoSqrtAAlpha)
    const a0 = A + 1 - (A - 1) * cosw0 + twoSqrtAAlpha
    const a1 = 2 * (A - 1 - (A + 1) * cosw0)
    const a2 = A + 1 - (A - 1) * cosw0 - twoSqrtAAlpha

    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || input.length === 0) return true

    const bypass = parameters.bypass[0] > 0.5
    if (bypass) {
      for (let c = 0; c < input.length; c++) {
        output[c].set(input[c])
      }
      return true
    }

    const lowGain = parameters.lowGain[0]
    const lowFreq = parameters.lowFreq[0]
    const midGain = parameters.midGain[0]
    const midFreq = parameters.midFreq[0]
    const midQ = parameters.midQ[0]
    const highGain = parameters.highGain[0]
    const highFreq = parameters.highFreq[0]

    const [lb0, lb1, lb2, la1, la2] = this.computeLowShelf(lowFreq, lowGain)
    const [mb0, mb1, mb2, ma1, ma2] = this.computePeaking(midFreq, midGain, midQ)
    const [hb0, hb1, hb2, ha1, ha2] = this.computeHighShelf(highFreq, highGain)

    for (let c = 0; c < input.length; c++) {
      const inCh = input[c]
      const outCh = output[c]
      let lx1 = this.x1[c] || 0
      let lx2 = this.x2[c] || 0
      let ly1 = this.y1[c] || 0
      let ly2 = this.y2[c] || 0

      let mx1 = this.mx1[c] || 0
      let mx2 = this.mx2[c] || 0
      let my1 = this.my1[c] || 0
      let my2 = this.my2[c] || 0

      let hx1 = this.hx1[c] || 0
      let hx2 = this.hx2[c] || 0
      let hy1 = this.hy1[c] || 0
      let hy2 = this.hy2[c] || 0

      for (let i = 0; i < inCh.length; i++) {
        const x = inCh[i]
        const yL = lb0 * x + lb1 * lx1 + lb2 * lx2 - la1 * ly1 - la2 * ly2
        lx2 = lx1
        lx1 = x
        ly2 = ly1
        ly1 = yL

        const yM = mb0 * yL + mb1 * mx1 + mb2 * mx2 - ma1 * my1 - ma2 * my2
        mx2 = mx1
        mx1 = yL
        my2 = my1
        my1 = yM

        const yH = hb0 * yM + hb1 * hx1 + hb2 * hx2 - ha1 * hy1 - ha2 * hy2
        hx2 = hx1
        hx1 = yM
        hy2 = hy1
        hy1 = yH

        outCh[i] = yH
      }

      this.x1[c] = lx1
      this.x2[c] = lx2
      this.y1[c] = ly1
      this.y2[c] = ly2
      this.mx1[c] = mx1
      this.mx2[c] = mx2
      this.my1[c] = my1
      this.my2[c] = my2
      this.hx1[c] = hx1
      this.hx2[c] = hx2
      this.hy1[c] = hy1
      this.hy2[c] = hy2
    }

    return true
  }
}

class CompressorProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -20, minValue: -60, maxValue: 0, automationRate: 'k-rate' },
      { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20, automationRate: 'k-rate' },
      { name: 'attack', defaultValue: 0.01, minValue: 0.0001, maxValue: 0.2, automationRate: 'k-rate' },
      { name: 'release', defaultValue: 0.1, minValue: 0.01, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'knee', defaultValue: 5, minValue: 0, maxValue: 40, automationRate: 'k-rate' },
      { name: 'makeupGain', defaultValue: 0, minValue: 0, maxValue: 24, automationRate: 'k-rate' },
      { name: 'bypass', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ]
  }

  constructor() {
    super()
    this.detectorEnv = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || input.length === 0) return true

    const bypass = parameters.bypass[0] > 0.5
    if (bypass) {
      for (let c = 0; c < input.length; c++) {
        output[c].set(input[c])
      }
      return true
    }

    const threshold = parameters.threshold[0]
    const ratio = parameters.ratio[0]
    const attack = Math.max(0.0001, parameters.attack[0])
    const release = Math.max(0.001, parameters.release[0])
    const knee = parameters.knee[0]
    const makeupGain = parameters.makeupGain[0]
    const makeupLin = Math.pow(10, makeupGain / 20)

    const attackCoeff = Math.exp(-1 / (attack * sampleRate))
    const releaseCoeff = Math.exp(-1 / (release * sampleRate))

    const frames = input[0].length
    let env = this.detectorEnv

    for (let i = 0; i < frames; i++) {
      let maxVal = 0
      for (let c = 0; c < input.length; c++) {
        const val = Math.abs(input[c][i])
        if (val > maxVal) maxVal = val
      }

      if (maxVal > env) {
        env = attackCoeff * env + (1 - attackCoeff) * maxVal
      } else {
        env = releaseCoeff * env + (1 - releaseCoeff) * maxVal
      }

      const envDb = 20 * Math.log10(Math.max(1e-5, env))
      let gainRedDb = 0

      if (knee > 0 && envDb > threshold - knee / 2 && envDb < threshold + knee / 2) {
        const delta = envDb - threshold + knee / 2
        gainRedDb = ((1 / ratio - 1) * (delta * delta)) / (2 * knee)
      } else if (envDb >= threshold + knee / 2) {
        gainRedDb = (1 / ratio - 1) * (envDb - threshold)
      }

      const gain = Math.pow(10, gainRedDb / 20) * makeupLin

      for (let c = 0; c < input.length; c++) {
        output[c][i] = input[c][i] * gain
      }
    }

    this.detectorEnv = env
    return true
  }
}

class DelayReverbProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'time', defaultValue: 0.3, minValue: 0.01, maxValue: 1.5, automationRate: 'k-rate' },
      { name: 'feedback', defaultValue: 0.35, minValue: 0.0, maxValue: 0.95, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.3, minValue: 0.0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'damp', defaultValue: 3000, minValue: 200, maxValue: 18000, automationRate: 'k-rate' },
      { name: 'bypass', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ]
  }

  constructor() {
    super()
    this.bufferSize = Math.floor(sampleRate * 2.0)
    this.bufferL = new Float32Array(this.bufferSize)
    this.bufferR = new Float32Array(this.bufferSize)
    this.writeIndex = 0
    this.dampL = 0
    this.dampR = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || input.length === 0) return true

    const bypass = parameters.bypass[0] > 0.5
    if (bypass) {
      for (let c = 0; c < input.length; c++) {
        output[c].set(input[c])
      }
      return true
    }

    const time = parameters.time[0]
    const feedback = parameters.feedback[0]
    const mix = parameters.mix[0]
    const dampFreq = parameters.damp[0]

    const dampCoeff = Math.min(0.95, Math.max(0.05, 1 - Math.exp((-2 * Math.PI * dampFreq) / sampleRate)))
    const delaySamples = Math.min(this.bufferSize - 1, Math.max(1, Math.floor(time * sampleRate)))

    const inL = input[0]
    const inR = input[1] || input[0]
    const outL = output[0]
    const outR = output[1] || output[0]
    const frames = inL.length

    for (let i = 0; i < frames; i++) {
      let readIndex = this.writeIndex - delaySamples
      if (readIndex < 0) readIndex += this.bufferSize

      const delayedL = this.bufferL[readIndex]
      const delayedR = this.bufferR[readIndex]

      this.dampL += dampCoeff * (delayedL - this.dampL)
      this.dampR += dampCoeff * (delayedR - this.dampR)

      this.bufferL[this.writeIndex] = inL[i] + this.dampR * feedback
      this.bufferR[this.writeIndex] = inR[i] + this.dampL * feedback

      this.writeIndex++
      if (this.writeIndex >= this.bufferSize) {
        this.writeIndex = 0
      }

      outL[i] = inL[i] * (1 - mix) + this.dampL * mix
      outR[i] = inR[i] * (1 - mix) + this.dampR * mix
    }

    return true
  }
}

registerProcessor('parametric-eq-processor', ParametricEQProcessor)
registerProcessor('compressor-processor', CompressorProcessor)
registerProcessor('delay-reverb-processor', DelayReverbProcessor)
