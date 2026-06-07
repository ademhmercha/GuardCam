import { useCallback, useEffect, useRef, useState } from 'react'
import type { CameraFacing } from '../types'

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isReady: boolean
  error: string | null
  facing: CameraFacing
  switchCamera: () => Promise<void>
  canSwitchCamera: boolean
}

/** Manages getUserMedia lifecycle, exposes a video ref and front/back camera switching. */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<CameraFacing>('environment')
  const [canSwitchCamera, setCanSwitchCamera] = useState(true)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(async (desiredFacing: CameraFacing) => {
    setError(null)
    setIsReady(false)
    stopStream()

    const constraintAttempts: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: desiredFacing } }, audio: false },
      { video: { facingMode: desiredFacing }, audio: false },
      { video: true, audio: false },
    ]

    let lastError: unknown = null
    for (const constraints of constraintAttempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setIsReady(true)
        return
      } catch (err) {
        lastError = err
      }
    }

    setError(lastError instanceof Error ? lastError.message : 'Caméra indisponible')
  }, [stopStream])

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        if (cancelled) return
        const videoInputs = devices.filter((d) => d.kind === 'videoinput')
        setCanSwitchCamera(videoInputs.length > 1 || videoInputs.length === 0)
      })
      .catch(() => {})

    void startStream(facing)

    return () => {
      cancelled = true
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchCamera = useCallback(async () => {
    const next: CameraFacing = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    await startStream(next)
  }, [facing, startStream])

  return { videoRef, isReady, error, facing, switchCamera, canSwitchCamera }
}
