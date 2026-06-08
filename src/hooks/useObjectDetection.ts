import { useCallback, useEffect, useRef, useState } from 'react'
import type { ObjectDetection } from '@tensorflow-models/coco-ssd'
import { translateDetectionLabel } from '../data/detectionLabels'

/** Minimum confidence score (0-1) for a prediction to be reported as the alert subject. */
const MIN_CONFIDENCE = 0.5

interface UseObjectDetectionResult {
  /** True once the COCO-SSD model has finished loading and is ready to classify frames. */
  isReady: boolean
  /** Runs the on-device model on a video frame and returns the highest-confidence subject label (e.g. "Personne"), or null if nothing was recognized. */
  detectSubject: (video: HTMLVideoElement) => Promise<string | null>
}

/**
 * Lazily loads the COCO-SSD object-detection model (TensorFlow.js) — via
 * dynamic import so the ~1 MB library only ships to devices that actually use
 * this feature — and exposes a function to classify what triggered a motion
 * event: "Personne", "Chat", "Voiture", etc. Runs entirely on-device; nothing
 * is uploaded anywhere.
 */
export function useObjectDetection(enabled: boolean): UseObjectDetectionResult {
  const modelRef = useRef<ObjectDetection | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!enabled || modelRef.current) return
    let cancelled = false
    void Promise.all([import('@tensorflow/tfjs'), import('@tensorflow-models/coco-ssd')])
      .then(([, cocoSsd]) => cocoSsd.load({ base: 'lite_mobilenet_v2' }))
      .then((model) => {
        if (cancelled) return
        modelRef.current = model
        setIsReady(true)
      })
      .catch((err: unknown) => {
        console.error('GuardCam: échec du chargement du modèle de détection', err)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  const detectSubject = useCallback(async (video: HTMLVideoElement): Promise<string | null> => {
    const model = modelRef.current
    if (!model) return null
    try {
      const predictions = await model.detect(video, 5)
      const best = predictions.filter((p) => p.score >= MIN_CONFIDENCE).sort((a, b) => b.score - a.score)[0]
      return best ? translateDetectionLabel(best.class) : null
    } catch (err) {
      console.error('GuardCam: erreur lors de la détection d’objet', err)
      return null
    }
  }, [])

  return { isReady, detectSubject }
}
