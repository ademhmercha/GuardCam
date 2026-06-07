export type NightModeKey = 'normal' | 'dusk' | 'night' | 'military' | 'thermal'

export interface NightModeConfig {
  key: NightModeKey
  filter: string
  label: string
  shortLabel: string
  emoji: string
  /** Average brightness (0-255) below which auto-mode switches to this mode. 0 = manual only. */
  threshold: number
}

export const NIGHT_MODES: Record<NightModeKey, NightModeConfig> = {
  normal: {
    key: 'normal',
    filter: 'none',
    label: 'Jour',
    shortLabel: 'Auto',
    emoji: '☀️',
    threshold: 180,
  },
  dusk: {
    key: 'dusk',
    filter: 'brightness(150%) contrast(120%) saturate(80%)',
    label: 'Crépuscule',
    shortLabel: 'Crépuscule',
    emoji: '🌅',
    threshold: 100,
  },
  night: {
    key: 'night',
    filter: 'brightness(250%) contrast(160%) saturate(0%)',
    label: 'Nuit',
    shortLabel: 'Nuit',
    emoji: '🌙',
    threshold: 40,
  },
  military: {
    key: 'military',
    filter: 'brightness(300%) contrast(180%) saturate(0%) sepia(100%) hue-rotate(60deg)',
    label: 'Militaire',
    shortLabel: 'Militaire',
    emoji: '🟢',
    threshold: 0,
  },
  thermal: {
    key: 'thermal',
    filter: 'brightness(200%) contrast(150%) sepia(100%) hue-rotate(300deg) saturate(400%)',
    label: 'Thermal',
    shortLabel: 'Thermal',
    emoji: '🔴',
    threshold: 0,
  },
}

/** Modes available in the surveillance mode selector, in display order. */
export const MODE_SELECTOR_ORDER: NightModeKey[] = ['normal', 'night', 'military', 'thermal', 'dusk']

/** Modes that the auto-brightness logic is allowed to switch between. */
export const AUTO_MODE_ORDER: NightModeKey[] = ['normal', 'dusk', 'night']

export function getModeBadge(key: NightModeKey): string {
  return `${NIGHT_MODES[key].emoji} ${NIGHT_MODES[key].label}`
}
