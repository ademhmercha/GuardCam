/** Captures the current frame of a video element as a base64 JPEG data URL. */
export function captureFrameAsJpeg(
  video: HTMLVideoElement,
  filter: string,
  quality = 0.8
): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.width === 0 || canvas.height === 0) return null

  ctx.filter = filter === 'none' ? 'none' : filter
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/jpeg', quality)
}

/** Triggers a browser download of a base64 JPEG data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatTimestampForFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}
