import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { fr } from '../data/translations'
import { SENSITIVITY_STEPS, type Settings } from '../types'

interface SettingsFormProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  /** This device's stable peer identifier — used to build the remote-viewing share link. */
  peerId: string
}

const SENSITIVITY_LABELS: Record<Settings['sensitivity'], string> = {
  low: fr.setup.sensitivityLow,
  medium: fr.setup.sensitivityMedium,
  high: fr.setup.sensitivityHigh,
}

/** Settings form shared by the setup screen and the in-surveillance config tab. */
export function SettingsForm({ settings, onChange, peerId }: SettingsFormProps) {
  const sensitivityIndex = SENSITIVITY_STEPS.indexOf(settings.sensitivity)
  const [copied, setCopied] = useState(false)
  const shareLink = `${window.location.origin}/regarder/${peerId}`

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">
      <Field label={fr.setup.emailLabel}>
        <input
          type="email"
          inputMode="email"
          value={settings.notificationEmail}
          onChange={(e) => onChange({ notificationEmail: e.target.value })}
          placeholder={fr.setup.emailPlaceholder}
          className="input-field"
        />
      </Field>

      <Field label={fr.setup.emailApiKeyLabel}>
        <input
          type="text"
          value={settings.emailApiKey}
          onChange={(e) => onChange({ emailApiKey: e.target.value })}
          placeholder={fr.setup.emailApiKeyPlaceholder}
          className="input-field"
        />
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">{fr.setup.emailApiKeyHelp}</p>
      </Field>

      <Field label={fr.setup.locationLabel}>
        <input
          type="text"
          value={settings.locationName}
          onChange={(e) => onChange({ locationName: e.target.value })}
          placeholder={fr.setup.locationPlaceholder}
          className="input-field"
        />
      </Field>

      <Field label={`${fr.setup.sensitivityLabel} — ${SENSITIVITY_LABELS[settings.sensitivity]}`}>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={sensitivityIndex}
          onChange={(e) => onChange({ sensitivity: SENSITIVITY_STEPS[Number(e.target.value)] })}
          className="w-full accent-accent"
        />
        <div className="mt-1 flex justify-between text-xs text-text-secondary">
          <span>{fr.setup.sensitivityLow}</span>
          <span>{fr.setup.sensitivityMedium}</span>
          <span>{fr.setup.sensitivityHigh}</span>
        </div>
      </Field>

      <Field label={fr.setup.soundLabel}>
        <ToggleGroup
          options={[
            { value: true, label: fr.setup.soundOn },
            { value: false, label: fr.setup.soundOff },
          ]}
          value={settings.soundEnabled}
          onChange={(v) => onChange({ soundEnabled: v })}
        />
      </Field>

      <Field label={fr.setup.nightVisionLabel}>
        <ToggleGroup
          options={[
            { value: 'auto', label: fr.setup.nightVisionAuto },
            { value: 'night', label: fr.setup.nightVisionForceNight },
            { value: 'normal', label: fr.setup.nightVisionForceDay },
          ]}
          value={settings.nightVisionMode}
          onChange={(v) => onChange({ nightVisionMode: v })}
        />
      </Field>

      <Field label={fr.setup.recordClipsLabel}>
        <ToggleGroup
          options={[
            { value: true, label: fr.setup.recordClipsOn },
            { value: false, label: fr.setup.recordClipsOff },
          ]}
          value={settings.recordClips}
          onChange={(v) => onChange({ recordClips: v })}
        />
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">{fr.setup.recordClipsHelp}</p>
      </Field>

      <Field label={fr.setup.objectDetectionLabel}>
        <ToggleGroup
          options={[
            { value: true, label: fr.setup.objectDetectionOn },
            { value: false, label: fr.setup.objectDetectionOff },
          ]}
          value={settings.objectDetection}
          onChange={(v) => onChange({ objectDetection: v })}
        />
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">{fr.setup.objectDetectionHelp}</p>
      </Field>

      <Field label={fr.setup.remoteViewingLabel}>
        <input
          type="text"
          inputMode="numeric"
          value={settings.viewingPin}
          onChange={(e) => onChange({ viewingPin: e.target.value.replace(/\D/g, '').slice(0, 12) })}
          placeholder={fr.setup.remoteViewingPinPlaceholder}
          className="input-field tracking-[0.3em]"
        />
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">{fr.setup.remoteViewingPinHelp}</p>

        {settings.viewingPin.trim().length > 0 && (
          <div className="mt-3">
            <span className="mb-2 block text-xs uppercase tracking-wider text-text-secondary">
              {fr.setup.remoteViewingLinkLabel}
            </span>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={shareLink} className="input-field truncate text-xs" />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-md border border-text-secondary/30 bg-card px-3 text-xs text-text-secondary transition-colors duration-300 hover:border-accent/50 hover:text-accent"
              >
                {copied ? <Check size={14} strokeWidth={1.75} /> : <Copy size={14} strokeWidth={1.75} />}
                <span>{copied ? fr.setup.remoteViewingCopied : fr.setup.remoteViewingCopy}</span>
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{fr.setup.remoteViewingHelp}</p>
          </div>
        )}
      </Field>

    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-wider text-text-secondary">{label}</span>
      {children}
    </label>
  )
}

interface ToggleGroupProps<T> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function ToggleGroup<T extends string | boolean>({ options, value, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-h-12 rounded-md border px-2 text-sm transition-all duration-300 ${
              isActive
                ? 'glow-border bg-accent/10 text-accent'
                : 'border-text-secondary/25 bg-card text-text-secondary hover:border-text-secondary/50'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
