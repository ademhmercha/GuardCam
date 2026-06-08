import { useCallback, useEffect, useRef, useState } from 'react'
import { openDB, type IDBPDatabase } from 'idb'
import { v4 as uuid } from 'uuid'
import type { Alert, AlertType } from '../types'
import type { NightModeKey } from '../data/nightModes'

const DB_NAME = 'guardcam_db'
const STORE_NAME = 'alerts'
const VIDEO_STORE_NAME = 'videos'
const DB_VERSION = 2

interface NewAlertInput {
  location: string
  imageData: string
  diffPercent: number
  nightMode: NightModeKey
  type: AlertType
  durationSeconds: number
}

interface StoredVideo {
  id: string
  blob: Blob
}

interface UseAlertStorageResult {
  alerts: Alert[]
  isLoading: boolean
  addAlert: (input: NewAlertInput) => Promise<Alert>
  /** Stores the recorded clip blob for an alert and flags it as having a video. */
  attachVideo: (id: string, blob: Blob, mimeType: string) => Promise<void>
  /** Patches an alert with the subject classified by the object-detection model (e.g. "Personne"). */
  attachSubject: (id: string, label: string) => Promise<void>
  getVideo: (id: string) => Promise<Blob | null>
  deleteAlert: (id: string) => Promise<void>
  clearAll: () => Promise<void>
}

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      }
      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME, { keyPath: 'id' })
      }
    },
  })
}

/** CRUD wrapper around the "guardcam_db" IndexedDB database — alert records plus their (lazily-loaded) video clips. */
export function useAlertStorage(): UseAlertStorageResult {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dbRef = useRef<Promise<IDBPDatabase> | null>(null)

  const db = useCallback(() => {
    if (!dbRef.current) dbRef.current = getDb()
    return dbRef.current
  }, [])

  const refresh = useCallback(async () => {
    const database = await db()
    const all = (await database.getAll(STORE_NAME)) as Alert[]
    all.sort((a, b) => b.timestamp - a.timestamp)
    setAlerts(all)
  }, [db])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refresh()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const addAlert = useCallback(
    async (input: NewAlertInput): Promise<Alert> => {
      const alert: Alert = {
        id: uuid(),
        timestamp: Date.now(),
        ...input,
      }
      const database = await db()
      await database.put(STORE_NAME, alert)
      setAlerts((prev) => [alert, ...prev])
      return alert
    },
    [db]
  )

  const attachVideo = useCallback(
    async (id: string, blob: Blob, mimeType: string) => {
      const database = await db()
      const existing = (await database.get(STORE_NAME, id)) as Alert | undefined
      if (!existing) return
      const updated: Alert = { ...existing, hasVideo: true, videoMimeType: mimeType }
      const stored: StoredVideo = { id, blob }
      const tx = database.transaction([STORE_NAME, VIDEO_STORE_NAME], 'readwrite')
      await Promise.all([
        tx.objectStore(STORE_NAME).put(updated),
        tx.objectStore(VIDEO_STORE_NAME).put(stored),
        tx.done,
      ])
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)))
    },
    [db]
  )

  const attachSubject = useCallback(
    async (id: string, label: string) => {
      const database = await db()
      const existing = (await database.get(STORE_NAME, id)) as Alert | undefined
      if (!existing) return
      const updated: Alert = { ...existing, subjectLabel: label }
      await database.put(STORE_NAME, updated)
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)))
    },
    [db]
  )

  const getVideo = useCallback(
    async (id: string): Promise<Blob | null> => {
      const database = await db()
      const stored = (await database.get(VIDEO_STORE_NAME, id)) as StoredVideo | undefined
      return stored?.blob ?? null
    },
    [db]
  )

  const deleteAlert = useCallback(
    async (id: string) => {
      const database = await db()
      const tx = database.transaction([STORE_NAME, VIDEO_STORE_NAME], 'readwrite')
      await Promise.all([
        tx.objectStore(STORE_NAME).delete(id),
        tx.objectStore(VIDEO_STORE_NAME).delete(id),
        tx.done,
      ])
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    },
    [db]
  )

  const clearAll = useCallback(async () => {
    const database = await db()
    const tx = database.transaction([STORE_NAME, VIDEO_STORE_NAME], 'readwrite')
    await Promise.all([tx.objectStore(STORE_NAME).clear(), tx.objectStore(VIDEO_STORE_NAME).clear(), tx.done])
    setAlerts([])
  }, [db])

  return { alerts, isLoading, addAlert, attachVideo, attachSubject, getVideo, deleteAlert, clearAll }
}
