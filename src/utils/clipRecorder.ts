const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4;codecs=h264',
  'video/mp4',
]

const CLIP_FPS = 12

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

export interface RecordedClip {
  blob: Blob
  mimeType: string
}

/**
 * Records a short night-vision-filtered clip from a live <video> element.
 * Each frame is redrawn onto an offscreen canvas with the active CSS filter
 * applied, then captured as a MediaStream so the output matches what the
 * user actually sees (unlike recording the raw, unfiltered camera track).
 */
export function recordFilteredClip(
  video: HTMLVideoElement,
  filter: string,
  durationMs: number
): Promise<RecordedClip | null> {
  const mimeType = pickSupportedMimeType()
  if (!mimeType || video.videoWidth === 0 || video.videoHeight === 0) return Promise.resolve(null)

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  const stream = canvas.captureStream(CLIP_FPS)
  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, { mimeType })
  } catch {
    stream.getTracks().forEach((track) => track.stop())
    return Promise.resolve(null)
  }

  const chunks: Blob[] = []
  let frameHandle = 0

  const stopAll = () => {
    cancelAnimationFrame(frameHandle)
    stream.getTracks().forEach((track) => track.stop())
  }

  const draw = () => {
    ctx.filter = filter === 'none' ? 'none' : filter
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    frameHandle = requestAnimationFrame(draw)
  }

  return new Promise((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      stopAll()
      resolve(chunks.length > 0 ? { blob: new Blob(chunks, { type: mimeType }), mimeType } : null)
    }
    recorder.onerror = () => {
      stopAll()
      resolve(null)
    }
    draw()
    recorder.start()
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, durationMs)
  })
}

export function extensionForMimeType(mimeType: string | undefined): string {
  return mimeType?.includes('mp4') ? 'mp4' : 'webm'
}
