import { useEffect, useRef, useState } from 'react'
import { Peer, type DataConnection, type MediaConnection } from 'peerjs'

const STREAM_WATCH_INTERVAL_MS = 3000

interface PinMessage {
  type: 'pin'
  pin: string
}

function isPinMessage(data: unknown): data is PinMessage {
  return typeof data === 'object' && data !== null && (data as { type?: unknown }).type === 'pin'
}

interface UseRemoteViewingOptions {
  /** This device's stable peer identifier — viewers connect to this address. */
  peerId: string
  /** PIN viewers must provide before the live stream is shared. Remote viewing is disabled while empty. */
  pin: string
  /** Returns the live camera MediaStream to share, or null if not ready. */
  getStream: () => MediaStream | null
  /** Whether the host should be reachable (tied to surveillance being active). */
  enabled: boolean
}

interface UseRemoteViewingResult {
  /** Number of devices currently authenticated and watching the live feed. */
  viewerCount: number
}

/**
 * Hosts this device's live camera feed for remote viewing over WebRTC
 * (peer-to-peer, end-to-end — the video never passes through a server).
 * Incoming viewers must first send the correct PIN over a data channel; only
 * then does this device place the media call (it's the side with tracks to
 * offer, which keeps the SDP offer/answer negotiation straightforward).
 */
export function useRemoteViewing({ peerId, pin, getStream, enabled }: UseRemoteViewingOptions): UseRemoteViewingResult {
  const [viewerCount, setViewerCount] = useState(0)
  const getStreamRef = useRef(getStream)
  getStreamRef.current = getStream

  useEffect(() => {
    if (!enabled || !pin.trim() || !peerId) {
      setViewerCount(0)
      return
    }

    const verified = new Set<string>()
    // Tracks the live MediaConnection per viewer so calls can be re-placed
    // with a fresh stream if the camera stream is swapped (e.g. switching
    // between front/back camera) — otherwise viewers would freeze on the
    // old, now-stopped tracks.
    const calls = new Map<string, MediaConnection>()
    let currentStreamId: string | null = null

    const updateCount = () => setViewerCount(verified.size)
    const forget = (viewerId: string) => {
      verified.delete(viewerId)
      calls.delete(viewerId)
      updateCount()
    }

    const peer = new Peer(peerId)

    const placeCall = (viewerId: string, stream: MediaStream) => {
      calls.get(viewerId)?.close()
      const call = peer.call(viewerId, stream)
      calls.set(viewerId, call)
      call.on('close', () => forget(viewerId))
    }

    const acceptViewer = (conn: DataConnection) => {
      verified.add(conn.peer)
      updateCount()
      conn.send({ type: 'pin-ok' })

      const stream = getStreamRef.current()
      if (stream) placeCall(conn.peer, stream)
    }

    const handleData = (conn: DataConnection, data: unknown) => {
      if (isPinMessage(data) && data.pin === pin) {
        acceptViewer(conn)
      } else {
        conn.send({ type: 'pin-error' })
        conn.close()
      }
    }

    const handleConnection = (conn: DataConnection) => {
      conn.on('data', (data) => handleData(conn, data))
      conn.on('close', () => forget(conn.peer))
    }

    peer.on('connection', handleConnection)
    peer.on('error', (err) => console.error('GuardCam: erreur de visionnage à distance', err))

    // Re-place calls for everyone already watching whenever the underlying
    // camera stream is replaced, so remote viewers stay in sync with the host.
    const streamWatcher = setInterval(() => {
      const stream = getStreamRef.current()
      if (!stream || stream.id === currentStreamId) return
      currentStreamId = stream.id
      if (calls.size === 0) return
      for (const viewerId of verified) placeCall(viewerId, stream)
    }, STREAM_WATCH_INTERVAL_MS)

    return () => {
      clearInterval(streamWatcher)
      for (const call of calls.values()) call.close()
      peer.destroy()
      verified.clear()
      calls.clear()
      setViewerCount(0)
    }
  }, [enabled, peerId, pin])

  return { viewerCount }
}
