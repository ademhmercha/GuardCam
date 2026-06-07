import { useCallback, useRef } from 'react'
import { formatTimestampForFilename } from '../utils/imageUtils'
import type { Settings } from '../types'

const ALERT_COOLDOWN_MS = 30_000
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

interface SendAlertInput {
  imageData: string
  location: string
  diffPercent: number
  timestamp: number
}

interface UseEmailAlertResult {
  /** Sends an email alert (with the captured photo attached) automatically via Web3Forms, respecting the 30s anti-spam cooldown. */
  sendAlert: (input: SendAlertInput) => Promise<{ sent: boolean; reason?: string }>
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

/**
 * Sends real email alerts straight from the browser (no backend) via the
 * Web3Forms API — the captured frame is attached as a JPEG. Configure the
 * destination by creating a free access key at https://web3forms.com that
 * points to the email address entered in settings.
 */
export function useEmailAlert(settings: Settings): UseEmailAlertResult {
  const lastSentAtRef = useRef(0)

  const sendAlert = useCallback(
    async (input: SendAlertInput): Promise<{ sent: boolean; reason?: string }> => {
      if (!settings.emailApiKey.trim()) {
        return { sent: false, reason: 'no-api-key' }
      }

      const now = Date.now()
      if (now - lastSentAtRef.current < ALERT_COOLDOWN_MS) {
        return { sent: false, reason: 'cooldown' }
      }
      lastSentAtRef.current = now

      try {
        const photoBlob = await (await fetch(input.imageData)).blob()

        const formData = new FormData()
        formData.append('access_key', settings.emailApiKey)
        formData.append('subject', `🚨 ALERTE GUARDCAM — ${input.location}`)
        formData.append('from_name', 'GuardCam')
        if (settings.notificationEmail.trim()) {
          formData.append('email', settings.notificationEmail.trim())
        }
        formData.append(
          'message',
          `🚨 Mouvement détecté !\n` +
            `📍 Emplacement : ${input.location}\n` +
            `🕐 Heure : ${formatDateTime(input.timestamp)}\n` +
            `📊 Différence détectée : ${input.diffPercent.toFixed(1)}%\n\n` +
            `Photo capturée automatiquement en pièce jointe.`
        )
        formData.append(
          'attachment',
          photoBlob,
          `guardcam-${formatTimestampForFilename(new Date(input.timestamp))}.jpg`
        )

        const response = await fetch(WEB3FORMS_ENDPOINT, { method: 'POST', body: formData })
        const result = (await response.json()) as { success?: boolean }

        if (!response.ok || !result.success) {
          return { sent: false, reason: 'error' }
        }
        return { sent: true }
      } catch {
        return { sent: false, reason: 'error' }
      }
    },
    [settings.emailApiKey, settings.notificationEmail]
  )

  return { sendAlert }
}
