import React, { useEffect, useRef } from 'react'
import { AudioClip } from '../../types/daw'
import { waveformManager } from '../../audio/waveformManager'

interface WaveformCanvasProps {
  clip: AudioClip
  width: number
  height: number
  color?: string
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  clip,
  width,
  height,
  color = '#00e5ff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, width * dpr)
    canvas.height = Math.max(1, height * dpr)
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const peaksObj = waveformManager.getCachedPeaks(clip.audioBufferId)
    if (!peaksObj) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.fillRect(0, height / 2 - 1, width, 2)
      return
    }

    const sampleRate = clip.sampleRate || 44100
    const totalSamples = (clip.durationSeconds || 4) * sampleRate
    const samplesPerPixel = totalSamples / Math.max(1, width)

    const availableRes = [64, 256, 1024, 4096]
    let chosenRes = 64
    for (const r of availableRes) {
      if (samplesPerPixel >= r * 0.75) {
        chosenRes = r
      }
    }

    const peaks = peaksObj[chosenRes] || peaksObj[64]
    if (!peaks) return

    const numPairs = peaks.length / 2
    const centerY = height / 2

    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 1

    ctx.beginPath()
    for (let x = 0; x < width; x++) {
      const peakIndex = Math.floor((x / width) * numPairs)
      if (peakIndex >= numPairs) break

      const minVal = peaks[peakIndex * 2]
      const maxVal = peaks[peakIndex * 2 + 1]

      const yTop = centerY - maxVal * (centerY * 0.9)
      const yBottom = centerY - minVal * (centerY * 0.9)
      const barHeight = Math.max(1.5, yBottom - yTop)

      ctx.fillRect(x, yTop, 1, barHeight)
    }
  }, [clip, width, height, color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        pointerEvents: 'none'
      }}
    />
  )
}
