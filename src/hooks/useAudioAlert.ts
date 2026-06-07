import { useCallback, useRef } from 'react'

interface UseAudioAlertResult {
  playBeep: () => void
}

/** Plays a short 880Hz triangle-wave beep via the Web Audio API (respects silent-mode-safe playback). */
export function useAudioAlert(enabled: boolean): UseAudioAlertResult {
  const contextRef = useRef<AudioContext | null>(null)

  const playBeep = useCallback(() => {
    if (!enabled) return

    try {
      let ctx = contextRef.current
      if (!ctx) {
        const AudioContextCtor =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioContextCtor) return
        ctx = new AudioContextCtor()
        contextRef.current = ctx
      }

      if (ctx.state === 'suspended') void ctx.resume()

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch {
      // Audio is best-effort; ignore failures (e.g. autoplay restrictions).
    }
  }, [enabled])

  return { playBeep }
}
