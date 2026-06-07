import { useEffect, useRef, useState } from 'react'
import { SENSITIVITY_PIXEL_THRESHOLD, SENSITIVITY_TRIGGER_PERCENT, type SensitivityLevel } from '../types'

const PROCESS_FPS = 15
const PROCESS_INTERVAL_MS = 1000 / PROCESS_FPS
const MOTION_COOLDOWN_MS = 2000

export interface MotionEvent {
  diffPercent: number
  timestamp: number
}

interface UseMotionDetectionOptions {
  /** Returns the latest analysis-resolution ImageData, or null if not ready. */
  getFrame: () => ImageData | null
  sensitivity: SensitivityLevel
  /** Whether detection should run (paused when surveillance paused / tab hidden). */
  active: boolean
  onMotion: (event: MotionEvent) => void
}

interface UseMotionDetectionResult {
  /** True for ~0.5s right after a motion event — drives the red flash animation. */
  isFlashing: boolean
  lastDiffPercent: number
}

/**
 * Compares consecutive low-res frames pixel-by-pixel (RGB delta) and reports
 * a motion event whenever the percentage of "changed" pixels crosses the
 * sensitivity-derived trigger threshold. Runs at a throttled rate to save battery.
 */
export function useMotionDetection({
  getFrame,
  sensitivity,
  active,
  onMotion,
}: UseMotionDetectionOptions): UseMotionDetectionResult {
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null)
  const lastProcessTimeRef = useRef(0)
  const cooldownUntilRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const [isFlashing, setIsFlashing] = useState(false)
  const [lastDiffPercent, setLastDiffPercent] = useState(0)

  const onMotionRef = useRef(onMotion)
  onMotionRef.current = onMotion

  useEffect(() => {
    if (!active) {
      previousFrameRef.current = null
      return
    }

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)

      if (now - lastProcessTimeRef.current < PROCESS_INTERVAL_MS) return
      lastProcessTimeRef.current = now

      const frame = getFrame()
      if (!frame) return

      const current = frame.data
      const previous = previousFrameRef.current

      if (!previous || previous.length !== current.length) {
        previousFrameRef.current = new Uint8ClampedArray(current)
        return
      }

      const pixelThreshold = SENSITIVITY_PIXEL_THRESHOLD[sensitivity]
      const triggerPercent = SENSITIVITY_TRIGGER_PERCENT[sensitivity]
      const totalPixels = current.length / 4

      let diffPixels = 0
      for (let i = 0; i < current.length; i += 4) {
        const rDiff = Math.abs(current[i] - previous[i])
        const gDiff = Math.abs(current[i + 1] - previous[i + 1])
        const bDiff = Math.abs(current[i + 2] - previous[i + 2])
        const pixelDiff = (rDiff + gDiff + bDiff) / 3
        if (pixelDiff > pixelThreshold) diffPixels++
      }

      previous.set(current)

      const diffPercent = (diffPixels / totalPixels) * 100
      setLastDiffPercent(diffPercent)

      if (diffPercent > triggerPercent && now >= cooldownUntilRef.current) {
        cooldownUntilRef.current = now + MOTION_COOLDOWN_MS
        setIsFlashing(true)
        setTimeout(() => setIsFlashing(false), 500)
        onMotionRef.current({ diffPercent, timestamp: Date.now() })
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [active, sensitivity, getFrame])

  return { isFlashing, lastDiffPercent }
}
