# GuardCam

**Surveillance intelligente** — a privacy-first, installable PWA that turns any phone or laptop into a smart motion-detecting security camera. Everything runs on-device: detection, AI subject classification, video clips and storage all happen locally — nothing is uploaded except an optional email notification you configure yourself.

## Features

- **Motion detection** — real-time pixel-diff analysis of the camera feed with three sensitivity levels (Faible / Moyen / Élevé), throttled to ~15 fps to save battery.
- **AI subject classification** — an on-device TensorFlow.js + COCO-SSD model identifies *what* triggered the alert ("Personne", "Chat", "Voiture", …) and tags each alert with it. Lazy-loaded only when enabled, so it never bloats the initial app download.
- **Night-vision modes** — Auto, Crépuscule, Nuit, Militaire and Thermal filters, with brightness-based auto-switching.
- **Photo + video alerts** — every motion event captures a filtered JPEG instantly and (optionally) records a short ~4s filtered video clip via `MediaRecorder` + canvas streaming.
- **Email notifications** — sends a real email (with the captured photo attached) via [Web3Forms](https://web3forms.com), no backend required, with a 30s anti-spam cooldown.
- **Local history** — alerts and video clips are stored in IndexedDB, browsable, filterable, downloadable and deletable from the Alertes screen.
- **Installable PWA** — works offline, installable to your home screen via `vite-plugin-pwa`.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (theme tokens via `@theme`, in [src/index.css](src/index.css))
- [react-router-dom](https://reactrouter.com/) for navigation
- [idb](https://github.com/jakearchibald/idb) — IndexedDB wrapper for alert/video storage
- [TensorFlow.js](https://www.tensorflow.org/js) + [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) — on-device object detection
- [lucide-react](https://lucide.dev/) — icon set
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — service worker / manifest generation

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in a browser that supports `getUserMedia` (camera access requires HTTPS or `localhost`).

### Available scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR            |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally          |
| `npm run lint`    | Run ESLint over the project                   |

## How it works

### 1. Setup screen (`/`)
Configure your camera, location name, sensitivity, night-vision preference, email notifications, video clips and AI detection — then start surveillance.

### 2. Surveillance screen (`/surveillance`)
The active monitoring loop. On every motion event, GuardCam in parallel:
1. Captures a filtered JPEG and stores it as an alert
2. Records a short filtered video clip (if enabled)
3. Runs on-device object classification to label the subject (if enabled)
4. Sends an email notification with the photo attached (if configured)
5. Plays an audible alert

### 3. Alertes screen (`/alertes`)
Browse, filter, view, download and clear the local alert history — including full video playback for clips.

## Project structure

```
src/
  components/    Shared UI building blocks (CameraFeed, AlertCard, TabBar, ...)
  data/          Static config: night-vision modes, detection labels, translations
  hooks/         Core logic: camera access, motion detection, object detection,
                 alert storage (IndexedDB), email/audio alerts, settings, ...
  screens/       The three top-level screens (Setup, Surveillance, Alertes)
  utils/         Frame capture, clip recording, brightness analysis helpers
```

## Configuring email alerts

Email notifications are sent client-side via Web3Forms — no backend needed:

1. Create a free access key at [web3forms.com](https://web3forms.com), linked to your destination email address.
2. Paste the key and your email into the Setup screen's "Clé API (Web3Forms)" field.

## Privacy

GuardCam is designed to keep your data on your device:

- Motion detection, AI classification, filtering and recording all run **locally in the browser**.
- Alerts and video clips are stored in **IndexedDB** on your device — never uploaded.
- The only network call is the optional email notification, which you explicitly configure with your own API key and address.

## Deployment

The project is preconfigured for [Vercel](https://vercel.com) (`vercel.json`) — a static Vite build with SPA rewrites and a `Permissions-Policy` header granting camera/microphone access. Any static host that serves over HTTPS will work.

```bash
npm run build
# deploy the generated dist/ folder
```
