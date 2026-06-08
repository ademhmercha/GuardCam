import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type Settings } from '../types'

const STORAGE_KEYS: Record<keyof Settings, string> = {
  notificationEmail: 'notification_email',
  emailApiKey: 'email_api_key',
  locationName: 'location_name',
  sensitivity: 'sensitivity',
  soundEnabled: 'sound_enabled',
  nightVisionMode: 'night_mode',
  recordClips: 'record_clips',
  objectDetection: 'object_detection',
}

function readSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  const read = (key: string, fallback: string) => localStorage.getItem(key) ?? fallback

  return {
    notificationEmail: read(STORAGE_KEYS.notificationEmail, DEFAULT_SETTINGS.notificationEmail),
    emailApiKey: read(STORAGE_KEYS.emailApiKey, DEFAULT_SETTINGS.emailApiKey),
    locationName: read(STORAGE_KEYS.locationName, DEFAULT_SETTINGS.locationName),
    sensitivity: read(STORAGE_KEYS.sensitivity, DEFAULT_SETTINGS.sensitivity) as Settings['sensitivity'],
    soundEnabled: read(STORAGE_KEYS.soundEnabled, String(DEFAULT_SETTINGS.soundEnabled)) === 'true',
    nightVisionMode: read(STORAGE_KEYS.nightVisionMode, DEFAULT_SETTINGS.nightVisionMode) as Settings['nightVisionMode'],
    recordClips: read(STORAGE_KEYS.recordClips, String(DEFAULT_SETTINGS.recordClips)) === 'true',
    objectDetection: read(STORAGE_KEYS.objectDetection, String(DEFAULT_SETTINGS.objectDetection)) === 'true',
  }
}

interface UseSettingsResult {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
}

/** Persists app settings to localStorage (notification_email, location_name, sensitivity, ...). */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(readSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notificationEmail, settings.notificationEmail)
    localStorage.setItem(STORAGE_KEYS.emailApiKey, settings.emailApiKey)
    localStorage.setItem(STORAGE_KEYS.locationName, settings.locationName)
    localStorage.setItem(STORAGE_KEYS.sensitivity, settings.sensitivity)
    localStorage.setItem(STORAGE_KEYS.soundEnabled, String(settings.soundEnabled))
    localStorage.setItem(STORAGE_KEYS.nightVisionMode, settings.nightVisionMode)
    localStorage.setItem(STORAGE_KEYS.recordClips, String(settings.recordClips))
    localStorage.setItem(STORAGE_KEYS.objectDetection, String(settings.objectDetection))
  }, [settings])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  return { settings, updateSettings }
}
