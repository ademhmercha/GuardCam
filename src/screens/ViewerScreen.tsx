import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Peer, type MediaConnection, PeerErrorType } from 'peerjs'
import { ShieldCheck, Lock, Loader2, WifiOff, TriangleAlert, RadioTower } from 'lucide-react'
import { fr } from '../data/translations'

type Status = 'enter-pin' | 'connecting' | 'live' | 'wrong-pin' | 'offline' | 'error'

interface PinAckMessage {
  type: 'pin-ok' | 'pin-error'
}

function isPinAckMessage(data: unknown): data is PinAckMessage {
  const type = (data as { type?: unknown } | null)?.type
  return type === 'pin-ok' || type === 'pin-error'
}

/** Standalone screen — opened on another device via a shared link to watch a GuardCam camera's live feed remotely (peer-to-peer, PIN-protected). */
export function ViewerScreen() {
  const { peerId } = useParams<{ peerId: string }>()
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<Status>('enter-pin')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<Peer | null>(null)

  useEffect(() => {
    return () => {
      peerRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  const handleConnect = () => {
    if (!peerId || !pin.trim() || status === 'connecting') return
    setStatus('connecting')
    setStream(null)

    peerRef.current?.destroy()
    const peer = new Peer()
    peerRef.current = peer

    const handleCall = (call: MediaConnection) => {
      call.answer()
      call.on('stream', (remoteStream) => {
        setStream(remoteStream)
        setStatus('live')
      })
      call.on('close', () => setStatus('offline'))
      call.on('error', () => setStatus('error'))
    }

    const handlePinAck = (data: unknown) => {
      if (!isPinAckMessage(data)) return
      if (data.type === 'pin-error') {
        setStatus('wrong-pin')
        peer.destroy()
      }
      // On 'pin-ok' we just wait — the host places the media call next (it's
      // the side with tracks to offer, which keeps SDP negotiation simple).
    }

    peer.on('open', () => {
      const conn = peer.connect(peerId)
      conn.on('open', () => conn.send({ type: 'pin', pin }))
      conn.on('data', handlePinAck)
      conn.on('error', () => setStatus('offline'))
    })

    peer.on('call', handleCall)

    peer.on('error', (err) => {
      setStatus(err.type === PeerErrorType.PeerUnavailable ? 'offline' : 'error')
    })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-5 py-10">
      <div className="flex items-center gap-2.5 text-2xl tracking-widest text-accent">
        <ShieldCheck size={26} strokeWidth={1.75} />
        <span>{fr.appName}</span>
      </div>

      {status === 'live' && (
        <div className="w-full space-y-2">
          <p className="flex items-center justify-center gap-1.5 text-xs tracking-widest text-alert">
            <RadioTower size={14} strokeWidth={1.75} />
            <span>{fr.viewer.live}</span>
          </p>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-h-[70vh] w-full rounded-lg glow-border bg-black object-contain"
          />
        </div>
      )}

      {status !== 'live' && (
        <div className="w-full space-y-4 rounded-lg border border-text-secondary/20 bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <Lock size={15} strokeWidth={1.75} />
            <span>{fr.viewer.pinPrompt}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder={fr.viewer.pinPlaceholder}
            maxLength={12}
            className="input-field text-center text-lg tracking-[0.4em]"
          />
          <button
            type="button"
            onClick={handleConnect}
            disabled={!pin.trim() || status === 'connecting'}
            className="glow-border flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent/10 text-sm text-accent transition-colors duration-300 disabled:opacity-50"
          >
            {status === 'connecting' && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
            <span>{status === 'connecting' ? fr.viewer.connecting : fr.viewer.connect}</span>
          </button>

          {status === 'wrong-pin' && (
            <p className="flex items-center gap-1.5 text-xs text-alert">
              <TriangleAlert size={13} strokeWidth={1.75} />
              <span>{fr.viewer.wrongPin}</span>
            </p>
          )}
          {status === 'offline' && (
            <p className="flex items-center gap-1.5 text-xs text-alert">
              <WifiOff size={13} strokeWidth={1.75} />
              <span>{fr.viewer.offline}</span>
            </p>
          )}
          {status === 'error' && (
            <p className="flex items-center gap-1.5 text-xs text-alert">
              <TriangleAlert size={13} strokeWidth={1.75} />
              <span>{fr.viewer.error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
