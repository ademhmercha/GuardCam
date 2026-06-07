import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CameraFeed, type CameraFeedHandle } from '../components/CameraFeed'
import { SettingsForm } from '../components/SettingsForm'
import { useCamera } from '../hooks/useCamera'
import { useSettings } from '../hooks/useSettings'
import { NIGHT_MODES, AUTO_MODE_ORDER } from '../data/nightModes'
import { averageBrightness } from '../utils/brightnessDetector'
import { fr } from '../data/translations'

const PREVIEW_BADGES = [
  { max: 60, emoji: '🟢', label: 'Très sombre' },
  { max: 150, emoji: '🌙', label: 'Nuit' },
  { max: Infinity, emoji: '☀️', label: 'Jour' },
]

function previewBadge(brightness: number): string {
  const match = PREVIEW_BADGES.find((b) => brightness <= b.max) ?? PREVIEW_BADGES[PREVIEW_BADGES.length - 1]
  return `${match.emoji} ${match.label}`
}

interface SetupScreenProps {
  settings: ReturnType<typeof useSettings>['settings']
  updateSettings: ReturnType<typeof useSettings>['updateSettings']
}

/** Screen 1 — camera preview, configuration form and the big "start surveillance" CTA. */
export function SetupScreen({ settings, updateSettings }: SetupScreenProps) {
  const navigate = useNavigate()
  const { videoRef, isReady, error, switchCamera, canSwitchCamera } = useCamera()
  const feedRef = useRef<CameraFeedHandle | null>(null)
  const [brightness, setBrightness] = useState(128)

  const getFrame = useCallback(() => feedRef.current?.getFrame() ?? null, [])

  useEffect(() => {
    if (!isReady) return
    const sample = () => {
      const frame = getFrame()
      if (frame) setBrightness(averageBrightness(frame, 100))
    }
    sample()
    const interval = setInterval(sample, 2000)
    return () => clearInterval(interval)
  }, [isReady, getFrame])

  const filter =
    settings.nightVisionMode === 'night'
      ? NIGHT_MODES.night.filter
      : settings.nightVisionMode === 'normal'
        ? NIGHT_MODES.normal.filter
        : (() => {
            let mode = AUTO_MODE_ORDER[0]
            for (const key of AUTO_MODE_ORDER) {
              if (NIGHT_MODES[key].threshold > 0 && brightness < NIGHT_MODES[key].threshold) mode = key
            }
            return NIGHT_MODES[mode].filter
          })()

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="px-5 pt-8 pb-4 text-center">
        <h1 className="text-3xl tracking-widest text-matrix drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
          🔒 {fr.appName}
        </h1>
        <p className="mt-1 text-xs text-text-secondary">{fr.tagline}</p>
      </header>

      <section className="px-4">
        <CameraFeed
          ref={feedRef}
          videoRef={videoRef}
          filter={filter}
          modeBadge={previewBadge(brightness)}
          className="rounded-lg glow-border"
        />
        {error && <p className="mt-2 text-center text-xs text-alert">{fr.setup.cameraError}</p>}
        {canSwitchCamera && (
          <button
            type="button"
            onClick={() => void switchCamera()}
            className="mx-auto mt-3 flex min-h-12 items-center gap-2 rounded-md border border-text-secondary/30 px-4 text-sm text-text-secondary transition-colors duration-300 hover:border-matrix/50 hover:text-matrix"
          >
            <span>🔄</span>
            <span>{fr.setup.cameraToggle}</span>
          </button>
        )}
      </section>

      <section className="mt-6 flex-1 px-5 pb-32">
        <SettingsForm settings={settings} onChange={updateSettings} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-matrix/15 bg-bg/95 px-5 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/surveillance')}
          className="glow-border min-h-14 w-full rounded-lg bg-matrix/10 text-base font-bold tracking-wide text-matrix transition-transform duration-300 active:scale-[0.98]"
        >
          {fr.setup.startButton}
        </button>
      </div>
    </div>
  )
}
