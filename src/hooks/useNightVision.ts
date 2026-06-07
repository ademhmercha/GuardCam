import { useCallback, useEffect, useRef, useState } from 'react'
import { AUTO_MODE_ORDER, NIGHT_MODES, type NightModeKey } from '../data/nightModes'
import { averageBrightness } from '../utils/brightnessDetector'
import type { NightVisionPreference } from '../types'

const SAMPLE_INTERVAL_MS = 2000

interface UseNightVisionOptions {
  /** User preference from settings: auto / forced night / forced day. */
  preference: NightVisionPreference
  /** Provides the latest analysis-resolution ImageData, or null if not ready. */
  getFrame: () => ImageData | null
  /** Whether sampling should run (e.g. paused when tab hidden or surveillance paused). */
  active: boolean
}

interface UseNightVisionResult {
  mode: NightModeKey
  brightness: number
  setManualMode: (mode: NightModeKey | null) => void
}

/**
 * Periodically samples brightness and derives the active night-vision mode.
 * Respects a manual override (forced mode selection) or the user's auto/forced preference.
 */
export function useNightVision({ preference, getFrame, active }: UseNightVisionOptions): UseNightVisionResult {
  const [mode, setMode] = useState<NightModeKey>('normal')
  const [brightness, setBrightness] = useState(128)
  const manualModeRef = useRef<NightModeKey | null>(null)
  const [, forceRerender] = useState(0)

  const setManualMode = useCallback((next: NightModeKey | null) => {
    manualModeRef.current = next
    forceRerender((n) => n + 1)
    if (next) setMode(next)
  }, [])

  useEffect(() => {
    if (!active) return

    const sample = () => {
      const frame = getFrame()
      if (!frame) return

      const avg = averageBrightness(frame, 100)
      setBrightness(avg)

      // Manual mode selection always wins.
      if (manualModeRef.current) {
        setMode(manualModeRef.current)
        return
      }

      if (preference === 'night') {
        setMode('night')
        return
      }
      if (preference === 'normal') {
        setMode('normal')
        return
      }

      // Auto: pick the darkest mode whose threshold the brightness has crossed.
      let next: NightModeKey = 'normal'
      for (const key of AUTO_MODE_ORDER) {
        const cfg = NIGHT_MODES[key]
        if (cfg.threshold > 0 && avg < cfg.threshold) next = key
      }
      setMode(next)
    }

    sample()
    const interval = setInterval(sample, SAMPLE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [active, preference, getFrame])

  return { mode, brightness, setManualMode }
}
