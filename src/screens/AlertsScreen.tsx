import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCard } from '../components/AlertCard'
import { TabBar } from '../components/TabBar'
import { useAlertStorage } from '../hooks/useAlertStorage'
import { downloadDataUrl, formatTimestampForFilename } from '../utils/imageUtils'
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
  const navigate = useNavigate()
  const { alerts, deleteAlert, clearAll } = useAlertStorage()
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
        <h1 className="text-lg text-matrix">
          📋 {fr.alerts.headerToday} ({todayAlerts.length})
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
                ? 'glow-border bg-matrix/10 text-matrix'
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
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-matrix/30 text-sm text-matrix transition-colors duration-300 hover:bg-matrix/10"
          >
            <span>⬇️</span>
            <span>{fr.alerts.downloadAll}</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-alert/30 text-sm text-alert transition-colors duration-300 hover:bg-alert/10"
          >
            <span>🗑</span>
            <span>{fr.alerts.clearHistory}</span>
          </button>
        </section>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setViewing(null)}
        >
          <img
            src={viewing.imageData}
            alt=""
            className="max-h-[80vh] max-w-full rounded-lg glow-border object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <TabBar
        active="alerts"
        onChange={(tab) => {
          if (tab === 'live') navigate('/surveillance')
          else if (tab === 'config') navigate('/')
        }}
      />
    </div>
  )
}
