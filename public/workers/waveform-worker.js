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
