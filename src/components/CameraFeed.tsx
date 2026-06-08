import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { sampleVideoFrame } from '../utils/canvasUtils'

export interface CameraFeedHandle {
  /** Returns a low-resolution ImageData snapshot of the current frame, or null if not ready. */
  getFrame: () => ImageData | null
  videoElement: () => HTMLVideoElement | null
}

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** CSS filter string applied to the live video for the active night-vision mode. */
  filter: string
  /** Flash the border red briefly when motion is detected. */
  isFlashing?: boolean
  /** Small badge rendered over the bottom-left of the feed (e.g. the active night-vision mode). */
  modeBadge?: { icon: LucideIcon; label: string }
  className?: string
}

/** Live camera feed (video element) with night-vision CSS filter, scanline overlay and a hidden analysis canvas. */
export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(function CameraFeed(
  { videoRef, filter, isFlashing = false, modeBadge, className = '' },
  ref
) {
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      getFrame: () => {
        const video = videoRef.current
        const canvas = analysisCanvasRef.current
        if (!video || !canvas) return null
        return sampleVideoFrame(video, canvas)
      },
      videoElement: () => videoRef.current,
    }),
    [videoRef]
  )

  return (
    <div
      className={`relative w-full overflow-hidden bg-black aspect-video scanlines transition-shadow duration-300 ${
        isFlashing ? 'flash-motion' : ''
      } ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover transition-[filter] duration-1000 ease-in-out"
        style={{ filter }}
      />
      <canvas ref={analysisCanvasRef} className="hidden" aria-hidden="true" />

      {modeBadge && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md border border-accent/40 bg-black/60 px-3 py-1 text-xs tracking-wide text-accent backdrop-blur-sm">
          <modeBadge.icon size={14} strokeWidth={1.75} />
          <span>{modeBadge.label}</span>
        </div>
      )}
    </div>
  )
})
