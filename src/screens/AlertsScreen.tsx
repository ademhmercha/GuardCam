import { useEffect, useMemo, useState } from 'react'
import { History, Download, Trash2 } from 'lucide-react'
import { AlertCard } from '../components/AlertCard'
import { useAlertStorage } from '../hooks/useAlertStorage'
import { downloadDataUrl, formatTimestampForFilename } from '../utils/imageUtils'
import { extensionForMimeType } from '../utils/clipRecorder'
import { fr } from '../data/translations'
import type { Alert, AlertType } from '../types'

type FilterKey = 'all' | AlertType

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: fr.alerts.filterAll },
  { key: 'motion', label: fr.alerts.filterMotion },
  { key: 'manual', label: fr.alerts.filterManual },
]

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/** Screen 3 — alert history with filters, viewer, per-card actions and bulk operations. */
export function AlertsScreen() {
  const { alerts, deleteAlert, clearAll, getVideo } = useAlertStorage()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [viewing, setViewing] = useState<Alert | null>(null)

  const todayAlerts = useMemo(() => alerts.filter((a) => isToday(a.timestamp)), [alerts])
  const filteredAlerts = useMemo(
    () => (filter === 'all' ? todayAlerts : todayAlerts.filter((a) => a.type === filter)),
    [todayAlerts, filter]
  )

  const handleDelete = (id: string) => {
    if (window.confirm(fr.alerts.confirmDelete)) void deleteAlert(id)
  }

  const handleClearAll = () => {
    if (window.confirm(fr.alerts.confirmClear)) void clearAll()
  }

  const handleDownloadAll = () => {
    filteredAlerts.forEach((alert, index) => {
      setTimeout(() => {
        downloadDataUrl(alert.imageData, `guardcam-${formatTimestampForFilename(new Date(alert.timestamp))}.jpg`)
      }, index * 250)
    })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col pb-28">
      <header className="px-4 pt-6 pb-3">
        <h1 className="flex items-center gap-2 text-lg text-accent">
          <History size={18} strokeWidth={1.75} />
          <span>{fr.alerts.headerToday} ({todayAlerts.length})</span>
        </h1>
      </header>

      <div className="flex gap-2 px-4 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`min-h-12 flex-1 rounded-md border text-sm transition-all duration-300 ${
              filter === f.key
                ? 'glow-border bg-accent/10 text-accent'
                : 'border-text-secondary/25 bg-card text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="flex-1 space-y-3 px-4">
        {filteredAlerts.length === 0 && (
          <p className="py-12 text-center text-sm text-text-secondary">{fr.alerts.empty}</p>
        )}
        {filteredAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onView={setViewing} onDelete={handleDelete} />
        ))}
      </section>

      {todayAlerts.length > 0 && (
        <section className="grid grid-cols-2 gap-3 px-4 py-4">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-accent/30 text-sm text-accent transition-colors duration-300 hover:bg-accent/10"
          >
            <Download size={16} strokeWidth={1.75} />
            <span>{fr.alerts.downloadAll}</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-alert/30 text-sm text-alert transition-colors duration-300 hover:bg-alert/10"
          >
            <Trash2 size={16} strokeWidth={1.75} />
            <span>{fr.alerts.clearHistory}</span>
          </button>
        </section>
      )}

      {viewing && <AlertViewer alert={viewing} getVideo={getVideo} onClose={() => setViewing(null)} />}
    </div>
  )
}

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AlertViewerProps {
  alert: Alert
  getVideo: (id: string) => Promise<Blob | null>
  onClose: () => void
}

/** Fullscreen viewer — plays the recorded clip when available, falling back to the captured photo. */
function AlertViewer({ alert, getVideo, onClose }: AlertViewerProps) {
  const [status, setStatus] = useState<ViewerStatus>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)

  useEffect(() => {
    if (!alert.hasVideo) {
      setStatus('idle')
      setVideoBlob(null)
      setVideoUrl(null)
      return
    }
    let cancelled = false
    setStatus('loading')
    void getVideo(alert.id).then((blob) => {
      if (cancelled) return
      if (!blob) {
        setStatus('error')
        return
      }
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
  }, [alert, getVideo])

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  const handleDownloadVideo = () => {
    if (!videoBlob) return
    const objectUrl = URL.createObjectURL(videoBlob)
    const filename = `guardcam-${formatTimestampForFilename(new Date(alert.timestamp))}.${extensionForMimeType(alert.videoMimeType)}`
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/85 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {status === 'ready' && videoUrl ? (
          <video
            src={videoUrl}
            poster={alert.imageData}
            controls
            autoPlay
            loop
            playsInline
            className="max-h-[75vh] max-w-full rounded-lg glow-border object-contain"
          />
        ) : (
          <img
            src={alert.imageData}
            alt=""
            className="max-h-[75vh] max-w-full rounded-lg glow-border object-contain"
          />
        )}

        {status === 'loading' && <p className="text-xs text-text-secondary">{fr.alerts.videoLoading}</p>}
        {status === 'error' && <p className="text-xs text-alert">{fr.alerts.videoUnavailable}</p>}

        {status === 'ready' && videoBlob && (
          <button
            type="button"
            onClick={handleDownloadVideo}
            className="flex min-h-12 items-center gap-2 rounded-md border border-accent/30 px-4 text-sm text-accent transition-colors duration-300 hover:bg-accent/10"
          >
            <Download size={16} strokeWidth={1.75} />
            <span>{fr.alerts.downloadVideo}</span>
          </button>
        )}
      </div>
    </div>
  )
}
