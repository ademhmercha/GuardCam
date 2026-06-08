import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  BatteryWarning,
  Eye,
  Timer,
  MapPin,
  Gauge,
  Play,
  Pause,
  Square,
  RadioTower,
  type LucideIcon,
} from 'lucide-react'
import { CameraFeed, type CameraFeedHandle } from '../components/CameraFeed'
import { NightVisionFilter } from '../components/NightVisionFilter'
import { useCamera } from '../hooks/useCamera'
import { useNightVision } from '../hooks/useNightVision'
import { useMotionDetection, type MotionEvent } from '../hooks/useMotionDetection'
import { useAlertStorage } from '../hooks/useAlertStorage'
import { useObjectDetection } from '../hooks/useObjectDetection'
import { useEmailAlert } from '../hooks/useEmailAlert'
import { useAudioAlert } from '../hooks/useAudioAlert'
import { useSettings } from '../hooks/useSettings'
import { usePageVisibility } from '../hooks/usePageVisibility'
import { useBatteryLevel } from '../hooks/useBatteryLevel'
import { usePeerId } from '../hooks/usePeerId'
import { useRemoteViewing } from '../hooks/useRemoteViewing'
import { NIGHT_MODES, getModeBadge, type NightModeKey } from '../data/nightModes'
import { captureFrameAsJpeg } from '../utils/imageUtils'
import { recordFilteredClip } from '../utils/clipRecorder'
import { fr } from '../data/translations'

interface SurveillanceScreenProps {
  settings: ReturnType<typeof useSettings>['settings']
}

const CLIP_DURATION_MS = 4000

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Screen 2 — live surveillance: camera feed, mode selector, stats, controls and tab navigation. */
export function SurveillanceScreen({ settings }: SurveillanceScreenProps) {
  const navigate = useNavigate()
  const { videoRef, isReady } = useCamera()
  const feedRef = useRef<CameraFeedHandle | null>(null)
  const { addAlert, attachVideo, attachSubject } = useAlertStorage()
  const { detectSubject } = useObjectDetection(settings.objectDetection)
  const { sendAlert } = useEmailAlert(settings)
  const { playBeep } = useAudioAlert(settings.soundEnabled)
  const isVisible = usePageVisibility()
  const batteryLevel = useBatteryLevel()
  const peerId = usePeerId()

  const [isPaused, setIsPaused] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionAlertCount, setSessionAlertCount] = useState(0)
  const [manualOverride, setManualOverride] = useState<NightModeKey | null>(null)
  // Tracks the start of the current motion "burst": a new burst begins when the
  // gap since the last detection exceeds BURST_GAP_MS.
  const burstStartRef = useRef<number | null>(null)
  const lastMotionAtRef = useRef<number>(0)
  const isRecordingClipRef = useRef(false)
  const BURST_GAP_MS = 5000

  const isActive = isReady && !isPaused && isVisible

  const getFrame = useCallback(() => feedRef.current?.getFrame() ?? null, [])
  const getCameraStream = useCallback(
    () => (feedRef.current?.videoElement()?.srcObject as MediaStream | null) ?? null,
    []
  )
  const { viewerCount } = useRemoteViewing({
    peerId,
    pin: settings.viewingPin,
    getStream: getCameraStream,
    enabled: isReady,
  })

  const { mode, brightness, setManualMode } = useNightVision({
    preference: settings.nightVisionMode,
    getFrame,
    active: isActive,
  })

  const handleMotion = useCallback(
    (event: MotionEvent) => {
      if (burstStartRef.current === null || event.timestamp - lastMotionAtRef.current > BURST_GAP_MS) {
        burstStartRef.current = event.timestamp
      }
      lastMotionAtRef.current = event.timestamp
      const durationSeconds = Math.max(1, Math.round((event.timestamp - burstStartRef.current) / 1000))

      playBeep()

      const video = feedRef.current?.videoElement()
      if (!video) return
      const filter = NIGHT_MODES[mode].filter
      const jpeg = captureFrameAsJpeg(video, filter, 0.8)
      if (!jpeg) return

      const alertPromise = addAlert({
        location: settings.locationName,
        imageData: jpeg,
        diffPercent: event.diffPercent,
        nightMode: mode,
        type: 'motion',
        durationSeconds,
      }).then((alert) => {
        setSessionAlertCount((n) => n + 1)
        return alert
      })

      // Record a short filtered clip alongside the photo — skip if one is
      // already in flight so overlapping bursts don't pile up recordings.
      if (settings.recordClips && !isRecordingClipRef.current) {
        isRecordingClipRef.current = true
        const clipPromise = recordFilteredClip(video, filter, CLIP_DURATION_MS)
        void Promise.all([alertPromise, clipPromise]).then(([alert, clip]) => {
          isRecordingClipRef.current = false
          if (clip) void attachVideo(alert.id, clip.blob, clip.mimeType)
        })
      }

      // Classify what triggered the motion ("Personne", "Chat", "Voiture", ...)
      // on-device, then patch the alert once the model has produced a result.
      if (settings.objectDetection) {
        const subjectPromise = detectSubject(video)
        void Promise.all([alertPromise, subjectPromise]).then(([alert, label]) => {
          if (label) void attachSubject(alert.id, label)
        })
      }

      void sendAlert({
        imageData: jpeg,
        location: settings.locationName,
        diffPercent: event.diffPercent,
        timestamp: event.timestamp,
      })
    },
    [
      addAlert,
      attachVideo,
      attachSubject,
      detectSubject,
      mode,
      playBeep,
      sendAlert,
      settings.locationName,
      settings.recordClips,
      settings.objectDetection,
    ]
  )

  const { isFlashing } = useMotionDetection({
    getFrame,
    sensitivity: settings.sensitivity,
    active: isActive,
    onMotion: handleMotion,
  })

  // Surveillance timer
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [isPaused])

  const handleSelectMode = useCallback(
    (next: NightModeKey | null) => {
      setManualOverride(next)
      setManualMode(next)
    },
    [setManualMode]
  )

  const handleCapture = useCallback(() => {
    const video = feedRef.current?.videoElement()
    if (!video) return
    const jpeg = captureFrameAsJpeg(video, NIGHT_MODES[mode].filter, 0.85)
    if (!jpeg) return
    void addAlert({
      location: settings.locationName,
      imageData: jpeg,
      diffPercent: 0,
      nightMode: mode,
      type: 'manual',
      durationSeconds: 0,
    }).then(() => setSessionAlertCount((n) => n + 1))
    playBeep()
  }, [addAlert, mode, playBeep, settings.locationName])

  const handleStop = useCallback(() => {
    navigate('/')
  }, [navigate])

  const brightnessPercent = Math.round((brightness / 255) * 100)

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col pb-40">
      {/* Top status bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-accent/15 bg-bg/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="radar-pulse" />
            <span className="relative h-3 w-3 rounded-full bg-alert pulse-dot" />
          </span>
          <span className="text-sm font-bold tracking-wider text-alert">{fr.surveillance.statusActive}</span>
        </div>
        <div className="font-mono text-lg tracking-widest text-accent">{formatElapsed(elapsedSeconds)}</div>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          {viewerCount > 0 && (
            <span className="flex items-center gap-1.5 text-accent" title={fr.setup.remoteViewingViewers}>
              <RadioTower size={15} strokeWidth={1.75} />
              <span>{viewerCount}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Camera size={15} strokeWidth={1.75} />
            <span className="text-text-primary">{sessionAlertCount}</span>
          </span>
        </div>
      </div>

      {batteryLevel !== null && batteryLevel < 0.2 && (
        <div className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-center text-xs text-alert">
          <BatteryWarning size={14} strokeWidth={1.75} />
          <span>{fr.surveillance.batteryLow} — {Math.round(batteryLevel * 100)}%</span>
        </div>
      )}

      {/* Camera feed */}
      <section className="px-4 pt-4">
        <CameraFeed
          ref={feedRef}
          videoRef={videoRef}
          filter={NIGHT_MODES[mode].filter}
          isFlashing={isFlashing}
          modeBadge={getModeBadge(mode)}
          className="rounded-lg glow-border"
        />
      </section>

      {/* Mode selector */}
      <NightVisionFilter activeMode={mode} isManualOverride={manualOverride !== null} onSelect={handleSelectMode} />

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
        <StatTile icon={Eye} label={fr.surveillance.statActive} value={isPaused ? '—' : 'ON'} />
        <StatTile icon={Timer} label="Temps" value={formatElapsed(elapsedSeconds)} />
        <StatTile icon={MapPin} label={fr.surveillance.statLocation} value={settings.locationName} />
        <StatTile icon={Gauge} label={fr.surveillance.statBrightness} value={`${brightnessPercent}%`} />
      </section>

      {/* Action buttons */}
      <section className="grid grid-cols-3 gap-3 px-4 pb-4">
        <ActionButton
          icon={isPaused ? Play : Pause}
          label={isPaused ? fr.surveillance.resume : fr.surveillance.pause}
          onClick={() => setIsPaused((p) => !p)}
        />
        <ActionButton icon={Camera} label={fr.surveillance.capture} onClick={handleCapture} accent />
        <ActionButton icon={Square} label={fr.surveillance.stop} onClick={handleStop} danger />
      </section>
    </div>
  )
}

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: string
}

function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-text-secondary/20 bg-card px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Icon size={13} strokeWidth={1.75} />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 truncate text-sm text-text-primary">{value}</p>
    </div>
  )
}

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  accent?: boolean
  danger?: boolean
}

function ActionButton({ icon: Icon, label, onClick, accent, danger }: ActionButtonProps) {
  const styles = danger
    ? 'border-alert/40 bg-alert/10 text-alert'
    : accent
      ? 'glow-border bg-accent/10 text-accent'
      : 'border-text-secondary/30 bg-card text-text-secondary'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border text-xs transition-transform duration-300 active:scale-[0.96] ${styles}`}
    >
      <Icon size={19} strokeWidth={1.75} />
      <span className="tracking-wide">{label}</span>
    </button>
  )
}
