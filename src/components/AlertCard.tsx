import { TriangleAlert, MapPin, CirclePlay, Eye, Download, Trash2, type LucideIcon } from 'lucide-react'
import { NIGHT_MODES } from '../data/nightModes'
import { downloadDataUrl, formatTimestampForFilename } from '../utils/imageUtils'
import { fr } from '../data/translations'
import type { Alert } from '../types'

interface AlertCardProps {
  alert: Alert
  onView: (alert: Alert) => void
  onDelete: (id: string) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Single alert entry in the history list — thumbnail, metadata and view/download/delete actions. */
export function AlertCard({ alert, onView, onDelete }: AlertCardProps) {
  const modeConfig = NIGHT_MODES[alert.nightMode]
  const ModeIcon = modeConfig.icon
  const typeLabel = alert.type === 'motion' ? fr.alerts.typeMotion : fr.alerts.typeManual

  const handleDownload = () => {
    downloadDataUrl(alert.imageData, `guardcam-${formatTimestampForFilename(new Date(alert.timestamp))}.jpg`)
  }

  return (
    <div className="rounded-lg border border-text-secondary/20 bg-card p-3 transition-colors duration-300 hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-2 text-sm text-alert">
            <TriangleAlert size={15} strokeWidth={1.75} />
            <span className="text-text-primary">{formatTime(alert.timestamp)}</span>
            <span className="rounded border border-text-secondary/30 px-1.5 py-0.5 text-[10px] text-text-secondary">
              {typeLabel}
            </span>
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-text-secondary">
            <MapPin size={13} strokeWidth={1.75} />
            <span className="truncate">{alert.location}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            <ModeIcon size={13} strokeWidth={1.75} />
            <span>Mode : {modeConfig.label}</span>
          </p>
          <p className="text-xs text-text-secondary">
            {fr.alerts.diff} : {alert.diffPercent.toFixed(1)} % · {fr.alerts.duration} : {alert.durationSeconds}
            {fr.common.seconds}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onView(alert)}
          className="relative shrink-0 overflow-hidden rounded border border-text-secondary/25"
          aria-label={fr.alerts.view}
        >
          <img src={alert.imageData} alt="" width={80} height={60} className="h-[60px] w-[80px] object-cover" />
          {alert.hasVideo && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-text-primary">
              <CirclePlay size={20} strokeWidth={1.5} />
            </span>
          )}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionButton icon={Eye} label={fr.alerts.view} onClick={() => onView(alert)} />
        <ActionButton icon={Download} label={fr.alerts.download} onClick={handleDownload} />
        <ActionButton icon={Trash2} label={fr.alerts.delete} variant="danger" onClick={() => onDelete(alert.id)} />
      </div>
    </div>
  )
}

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default' }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-1.5 rounded-md border text-sm transition-colors duration-300 ${
        variant === 'danger'
          ? 'border-alert/30 text-alert hover:bg-alert/10'
          : 'border-accent/30 text-accent hover:bg-accent/10'
      }`}
    >
      <Icon size={15} strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  )
}
