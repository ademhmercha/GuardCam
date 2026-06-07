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

function buildFormData(settings: Settings, input: SendAlertInput, photoBlob: Blob | null): FormData {
  const email = settings.notificationEmail.trim()

  const formData = new FormData()
  formData.append('access_key', settings.emailApiKey.trim())
  // Web3Forms' default form template expects "name" / "email" / "message" —
  // sending all three (plus from_name as a friendlier alias) avoids 400s.
  formData.append('name', 'GuardCam')
  formData.append('from_name', 'GuardCam')
  formData.append('email', email)
  formData.append('replyto', email)
  formData.append('subject', `🚨 ALERTE GUARDCAM — ${input.location}`)
  formData.append(
    'message',
    `🚨 Mouvement détecté !\n` +
      `📍 Emplacement : ${input.location}\n` +
      `🕐 Heure : ${formatDateTime(input.timestamp)}\n` +
      `📊 Différence détectée : ${input.diffPercent.toFixed(1)}%\n\n` +
      (photoBlob
        ? `Photo capturée automatiquement en pièce jointe.`
        : `Photo non jointe à cet email — consultez l'historique des alertes dans l'application pour la voir.`)
  )
  if (photoBlob) {
    formData.append('attachment', photoBlob, `guardcam-${formatTimestampForFilename(new Date(input.timestamp))}.jpg`)
  }
  return formData
}

async function postToWeb3Forms(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(WEB3FORMS_ENDPOINT, { method: 'POST', body: formData })
  const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null
  return { ok: response.ok && !!result?.success, message: result?.message }
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
      if (!settings.emailApiKey.trim() || !settings.notificationEmail.trim()) {
        return { sent: false, reason: 'no-config' }
      }

      const now = Date.now()
      if (now - lastSentAtRef.current < ALERT_COOLDOWN_MS) {
        return { sent: false, reason: 'cooldown' }
      }
      lastSentAtRef.current = now

      try {
        const photoBlob = await (await fetch(input.imageData)).blob().catch(() => null)

        let { ok, message } = await postToWeb3Forms(buildFormData(settings, input, photoBlob))

        // Some Web3Forms plans reject file attachments — retry once without the
        // photo so the text alert still reaches the inbox.
        if (!ok && photoBlob) {
          console.warn('GuardCam: envoi avec pièce jointe refusé, nouvelle tentative sans photo —', message)
          ;({ ok, message } = await postToWeb3Forms(buildFormData(settings, input, null)))
        }

        if (!ok) {
          // Surface the server's actual reason in devtools — Web3Forms returns a
          // descriptive `message` (e.g. bad access key, unverified email, rate limit, ...).
          console.error('GuardCam: échec envoi email Web3Forms —', message ?? '(pas de détail)')
          return { sent: false, reason: 'error' }
        }
        return { sent: true }
      } catch (err) {
        console.error('GuardCam: erreur réseau lors de l’envoi email', err)
        return { sent: false, reason: 'error' }
      }
    },
    [settings.emailApiKey, settings.notificationEmail]
  )

  return { sendAlert }
}
