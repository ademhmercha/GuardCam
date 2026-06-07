import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type Settings } from '../types'

const STORAGE_KEYS: Record<keyof Settings, string> = {
  whatsappNumber: 'whatsapp_number',
  locationName: 'location_name',
  sensitivity: 'sensitivity',
  soundEnabled: 'sound_enabled',
  nightVisionMode: 'night_mode',
  whatsappMethod: 'whatsapp_method',
  whapiKey: 'whapi_key',
}

function readSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  const read = (key: string, fallback: string) => localStorage.getItem(key) ?? fallback

  return {
    whatsappNumber: read(STORAGE_KEYS.whatsappNumber, DEFAULT_SETTINGS.whatsappNumber),
    locationName: read(STORAGE_KEYS.locationName, DEFAULT_SETTINGS.locationName),
    sensitivity: read(STORAGE_KEYS.sensitivity, DEFAULT_SETTINGS.sensitivity) as Settings['sensitivity'],
    soundEnabled: read(STORAGE_KEYS.soundEnabled, String(DEFAULT_SETTINGS.soundEnabled)) === 'true',
    nightVisionMode: read(STORAGE_KEYS.nightVisionMode, DEFAULT_SETTINGS.nightVisionMode) as Settings['nightVisionMode'],
    whatsappMethod: read(STORAGE_KEYS.whatsappMethod, DEFAULT_SETTINGS.whatsappMethod) as Settings['whatsappMethod'],
    whapiKey: read(STORAGE_KEYS.whapiKey, DEFAULT_SETTINGS.whapiKey),
  }
}

interface UseSettingsResult {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
}

/** Persists app settings to localStorage, keyed exactly as specified (whatsapp_number, location_name, ...). */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(readSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.whatsappNumber, settings.whatsappNumber)
    localStorage.setItem(STORAGE_KEYS.locationName, settings.locationName)
    localStorage.setItem(STORAGE_KEYS.sensitivity, settings.sensitivity)
    localStorage.setItem(STORAGE_KEYS.soundEnabled, String(settings.soundEnabled))
    localStorage.setItem(STORAGE_KEYS.nightVisionMode, settings.nightVisionMode)
    localStorage.setItem(STORAGE_KEYS.whatsappMethod, settings.whatsappMethod)
    localStorage.setItem(STORAGE_KEYS.whapiKey, settings.whapiKey)
  }, [settings])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  return { settings, updateSettings }
}
