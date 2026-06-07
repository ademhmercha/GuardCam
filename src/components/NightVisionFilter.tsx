import { MODE_SELECTOR_ORDER, NIGHT_MODES, type NightModeKey } from '../data/nightModes'

interface NightVisionFilterProps {
  activeMode: NightModeKey
  /** Whether the active mode came from a manual override (vs. auto-detection). */
  isManualOverride: boolean
  onSelect: (mode: NightModeKey | null) => void
}

/** Horizontal-scroll mode selector — tap a mode to force it, tap the active one again to return to Auto. */
export function NightVisionFilter({ activeMode, isManualOverride, onSelect }: NightVisionFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
      <ModeButton
        emoji="☀️"
        label="Auto"
        isActive={!isManualOverride}
        onClick={() => onSelect(null)}
      />
      {MODE_SELECTOR_ORDER.filter((key) => key !== 'normal').map((key) => (
        <ModeButton
          key={key}
          emoji={NIGHT_MODES[key].emoji}
          label={NIGHT_MODES[key].shortLabel}
          isActive={isManualOverride && activeMode === key}
          onClick={() => onSelect(key)}
        />
      ))}
      <ModeButton
        emoji="📷"
        label="Normal"
        isActive={isManualOverride && activeMode === 'normal'}
        onClick={() => onSelect('normal')}
      />
    </div>
  )
}

interface ModeButtonProps {
  emoji: string
  label: string
  isActive: boolean
  onClick: () => void
}

function ModeButton({ emoji, label, isActive, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all duration-300 min-h-12 ${
        isActive
          ? 'glow-border bg-matrix/10 text-matrix'
          : 'border-text-secondary/25 bg-card text-text-secondary hover:border-text-secondary/50'
      }`}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
