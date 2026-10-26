export interface MultiResPeaks {
  [resolution: number]: Float32Array
}

const workerCode = `
self.onmessage = function (e) {
  const { id, channelData, resolutions } = e.data
  const result = {}
  for (let r = 0; r < resolutions.length; r++) {
    const blockSize = resolutions[r]
    const numBlocks = Math.ceil(channelData.length / blockSize)
    const minMaxPairs = new Float32Array(numBlocks * 2)
    for (let b = 0; b < numBlocks; b++) {
      const start = b * blockSize
      const end = Math.min(channelData.length, start + blockSize)
      let min = 1.0
      let max = -1.0
      for (let i = start; i < end; i++) {
        const val = channelData[i]
        if (val < min) min = val
        if (val > max) max = val
      }
      minMaxPairs[b * 2] = min === 1.0 ? 0 : min
      minMaxPairs[b * 2 + 1] = max === -1.0 ? 0 : max
    }
    result[blockSize] = minMaxPairs
  }
  self.postMessage({ id, result })
}
`

class WaveformManager {
  private worker: Worker | null = null
  private pendingRequests = new Map<string, (peaks: MultiResPeaks) => void>()
  private cache = new Map<string, MultiResPeaks>()

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      this.worker = new Worker(URL.createObjectURL(blob))
      this.worker.onmessage = (e) => {
        const { id, result } = e.data
        const resolve = this.pendingRequests.get(id)
        if (resolve) {
          this.cache.set(id, result)
          resolve(result)
          this.pendingRequests.delete(id)
        }
      }
    } catch {
      this.worker = null
    }
  }

  public getCachedPeaks(id: string): MultiResPeaks | undefined {
    return this.cache.get(id)
  }

  public generatePeaks(
    id: string,
    channelData: Float32Array,
    resolutions = [64, 256, 1024, 4096]
  ): Promise<MultiResPeaks> {
    if (this.cache.has(id)) {
      return Promise.resolve(this.cache.get(id)!)
    }

    if (!this.worker) {
      const result: MultiResPeaks = {}
      for (const blockSize of resolutions) {
        const numBlocks = Math.ceil(channelData.length / blockSize)
        const minMaxPairs = new Float32Array(numBlocks * 2)
        for (let b = 0; b < numBlocks; b++) {
          const start = b * blockSize
          const end = Math.min(channelData.length, start + blockSize)
          let min = 1.0
          let max = -1.0
          for (let i = start; i < end; i++) {
            const val = channelData[i]
            if (val < min) min = val
            if (val > max) max = val
          }
          minMaxPairs[b * 2] = min === 1.0 ? 0 : min
          minMaxPairs[b * 2 + 1] = max === -1.0 ? 0 : max
        }
        result[blockSize] = minMaxPairs
      }
      this.cache.set(id, result)
      return Promise.resolve(result)
    }

    return new Promise((resolve) => {
      this.pendingRequests.set(id, resolve)
      this.worker!.postMessage({ id, channelData, resolutions })
    })
  }
}

export const waveformManager = new WaveformManager()
