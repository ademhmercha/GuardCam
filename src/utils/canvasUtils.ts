/** Low-resolution canvas used for motion-detection & brightness analysis (perf-friendly). */
export const ANALYSIS_WIDTH = 320
export const ANALYSIS_HEIGHT = 240

/**
 * Draws the current video frame onto the given canvas at analysis resolution
 * and returns the resulting ImageData (RGBA).
 */
export function sampleVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  width = ANALYSIS_WIDTH,
  height = ANALYSIS_HEIGHT
): ImageData | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || video.readyState < video.HAVE_CURRENT_DATA) return null

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  ctx.drawImage(video, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/** Picks `count` pseudo-random pixel indices (0..pixelCount-1) from an ImageData buffer. */
export function randomPixelIndices(pixelCount: number, count: number): number[] {
  const indices: number[] = []
  for (let i = 0; i < count; i++) {
    indices.push(Math.floor(Math.random() * pixelCount))
  }
  return indices
}
