import { useCallback, useEffect, useRef, useState } from 'react'
import { openDB, type IDBPDatabase } from 'idb'
import { v4 as uuid } from 'uuid'
import type { Alert, AlertType } from '../types'
import type { NightModeKey } from '../data/nightModes'

const DB_NAME = 'guardcam_db'
const STORE_NAME = 'alerts'
const DB_VERSION = 1

interface NewAlertInput {
  location: string
  imageData: string
  diffPercent: number
  nightMode: NightModeKey
  type: AlertType
  durationSeconds: number
}

interface UseAlertStorageResult {
  alerts: Alert[]
  isLoading: boolean
  addAlert: (input: NewAlertInput) => Promise<Alert>
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
    },
  })
}

/** CRUD wrapper around the "guardcam_db" / "alerts" IndexedDB store. */
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

  const deleteAlert = useCallback(
    async (id: string) => {
      const database = await db()
      await database.delete(STORE_NAME, id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    },
    [db]
  )

  const clearAll = useCallback(async () => {
    const database = await db()
    await database.clear(STORE_NAME)
    setAlerts([])
  }, [db])

  return { alerts, isLoading, addAlert, deleteAlert, clearAll }
}
