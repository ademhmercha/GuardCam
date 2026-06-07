import { fr } from '../data/translations'
import { SENSITIVITY_STEPS, type Settings } from '../types'

interface SettingsFormProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

const SENSITIVITY_LABELS: Record<Settings['sensitivity'], string> = {
  low: fr.setup.sensitivityLow,
  medium: fr.setup.sensitivityMedium,
  high: fr.setup.sensitivityHigh,
}

/** Settings form shared by the setup screen and the in-surveillance config tab. */
export function SettingsForm({ settings, onChange }: SettingsFormProps) {
  const sensitivityIndex = SENSITIVITY_STEPS.indexOf(settings.sensitivity)

  return (
    <div className="space-y-5">
      <Field label={fr.setup.whatsappLabel}>
        <input
          type="tel"
          inputMode="tel"
          value={settings.whatsappNumber}
          onChange={(e) => onChange({ whatsappNumber: e.target.value })}
          placeholder={fr.setup.whatsappPlaceholder}
          className="input-field"
        />
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
          className="w-full accent-matrix"
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

      <Field label={fr.setup.whatsappMethodLabel}>
        <div className="space-y-2">
          <RadioOption
            checked={settings.whatsappMethod === 'manual'}
            label={fr.setup.whatsappMethodManual}
            onSelect={() => onChange({ whatsappMethod: 'manual' })}
          />
          <RadioOption
            checked={settings.whatsappMethod === 'auto'}
            label={fr.setup.whatsappMethodAuto}
            onSelect={() => onChange({ whatsappMethod: 'auto' })}
          />
        </div>
        {settings.whatsappMethod === 'auto' && (
          <input
            type="text"
            value={settings.whapiKey}
            onChange={(e) => onChange({ whapiKey: e.target.value })}
            placeholder={fr.setup.whapiKeyPlaceholder}
            className="input-field mt-2"
          />
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
                ? 'glow-border bg-matrix/10 text-matrix'
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

function RadioOption({ checked, label, onSelect }: { checked: boolean; label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-12 w-full items-center gap-3 rounded-md border px-3 text-left text-sm transition-all duration-300 ${
        checked ? 'glow-border bg-matrix/10 text-matrix' : 'border-text-secondary/25 bg-card text-text-secondary'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? 'border-matrix' : 'border-text-secondary/40'
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-matrix" />}
      </span>
      {label}
    </button>
  )
}
