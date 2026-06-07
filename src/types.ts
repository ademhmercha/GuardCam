import type { NightModeKey } from './data/nightModes'

export type SensitivityLevel = 'low' | 'medium' | 'high'
export type NightVisionPreference = 'auto' | 'night' | 'normal'
export type AlertType = 'motion' | 'manual'
export type CameraFacing = 'user' | 'environment'

export interface Alert {
  id: string
  timestamp: number
  location: string
  imageData: string
  diffPercent: number
  nightMode: NightModeKey
  type: AlertType
  durationSeconds: number
}

export interface Settings {
  notificationEmail: string
  emailApiKey: string
  locationName: string
  sensitivity: SensitivityLevel
  soundEnabled: boolean
  nightVisionMode: NightVisionPreference
}

export const DEFAULT_SETTINGS: Settings = {
  notificationEmail: '',
  emailApiKey: '',
  locationName: 'Entrée principale',
  sensitivity: 'medium',
  soundEnabled: true,
  nightVisionMode: 'auto',
}

/** Pixel-diff threshold (0-255 channel delta) per sensitivity step. */
export const SENSITIVITY_PIXEL_THRESHOLD: Record<SensitivityLevel, number> = {
  low: 10,
  medium: 25,
  high: 45,
}

/** Percentage of changed pixels required to trigger a motion event, per sensitivity step. */
export const SENSITIVITY_TRIGGER_PERCENT: Record<SensitivityLevel, number> = {
  low: 3,
  medium: 1.5,
  high: 0.5,
}

export const SENSITIVITY_STEPS: SensitivityLevel[] = ['low', 'medium', 'high']
