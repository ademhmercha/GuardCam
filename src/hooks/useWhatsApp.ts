import { useCallback, useRef } from 'react'
import { downloadDataUrl, formatTimestampForFilename, stripDataUrlPrefix } from '../utils/imageUtils'
import type { Settings } from '../types'

const ALERT_COOLDOWN_MS = 30_000

interface SendAlertInput {
  imageData: string
  location: string
  diffPercent: number
  timestamp: number
}

interface UseWhatsAppResult {
  /** Sends a WhatsApp alert (manual wa.me link or Whapi.Cloud API), respecting the 30s anti-spam cooldown. */
  sendAlert: (input: SendAlertInput) => Promise<{ sent: boolean; reason?: string }>
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Builds and triggers WhatsApp alerts via the manual wa.me link or the Whapi.Cloud automatic API. */
export function useWhatsApp(settings: Settings): UseWhatsAppResult {
  const lastSentAtRef = useRef(0)

  const sendManual = useCallback((input: SendAlertInput) => {
    downloadDataUrl(input.imageData, `guardcam-${formatTimestampForFilename(new Date(input.timestamp))}.jpg`)

    const text =
      `🚨 Mouvement détecté!\n` +
      `📍 ${input.location}\n` +
      `🕐 ${formatTime(input.timestamp)}\n` +
      `Photo sauvegardée localement`

    const number = settings.whatsappNumber.replace(/[^\d+]/g, '')
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [settings.whatsappNumber])

  const sendAutomatic = useCallback(
    async (input: SendAlertInput) => {
      const caption =
        `🚨 *ALERTE GUARDCAM*\n` +
        `📍 ${input.location}\n` +
        `🕐 ${formatTime(input.timestamp)}\n` +
        `📊 Diff: ${input.diffPercent.toFixed(1)}%`

      await fetch('https://gate.whapi.cloud/messages/image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.whapiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: settings.whatsappNumber.replace(/[^\d+]/g, ''),
          media: stripDataUrlPrefix(input.imageData),
          caption,
        }),
      })
    },
    [settings.whapiKey, settings.whatsappNumber]
  )

  const sendAlert = useCallback(
    async (input: SendAlertInput): Promise<{ sent: boolean; reason?: string }> => {
      if (!settings.whatsappNumber.trim()) {
        return { sent: false, reason: 'no-number' }
      }

      const now = Date.now()
      if (now - lastSentAtRef.current < ALERT_COOLDOWN_MS) {
        return { sent: false, reason: 'cooldown' }
      }
      lastSentAtRef.current = now

      try {
        if (settings.whatsappMethod === 'auto' && settings.whapiKey.trim()) {
          await sendAutomatic(input)
        } else {
          sendManual(input)
        }
        return { sent: true }
      } catch {
        return { sent: false, reason: 'error' }
      }
    },
    [settings.whapiKey, settings.whatsappMethod, settings.whatsappNumber, sendAutomatic, sendManual]
  )

  return { sendAlert }
}
