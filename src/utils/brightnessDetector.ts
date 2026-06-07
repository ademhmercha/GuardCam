import { randomPixelIndices } from './canvasUtils'

/**
 * Samples `sampleCount` random pixels from the image data and returns the
 * average brightness (0-255) using the standard luma formula.
 */
export function averageBrightness(imageData: ImageData, sampleCount = 100): number {
  const { data, width, height } = imageData
  const pixelCount = width * height
  const indices = randomPixelIndices(pixelCount, sampleCount)

  let total = 0
  for (const pixelIndex of indices) {
    const i = pixelIndex * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    total += 0.299 * r + 0.587 * g + 0.114 * b
  }

  return total / indices.length
}
