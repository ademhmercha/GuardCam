import { useState } from 'react'
import { v4 as uuid } from 'uuid'

const STORAGE_KEY = 'guardcam_peer_id'

function readOrCreatePeerId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const created = uuid()
  localStorage.setItem(STORAGE_KEY, created)
  return created
}

/**
 * This device's stable WebRTC peer identifier — generated once and persisted
 * to localStorage, so the remote-viewing share link never changes between
 * sessions.
 */
export function usePeerId(): string {
  const [peerId] = useState(readOrCreatePeerId)
  return peerId
}
