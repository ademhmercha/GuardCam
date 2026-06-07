export const fr = {
  appName: 'GuardCam',
  tagline: 'Surveillance Intelligente',

  setup: {
    cameraToggle: 'Changer de caméra',
    emailLabel: 'Email de notification',
    emailPlaceholder: 'votre@email.com',
    emailApiKeyLabel: 'Clé API (Web3Forms)',
    emailApiKeyPlaceholder: 'Votre clé d’accès…',
    emailApiKeyHelp:
      'Créez une clé gratuite sur web3forms.com reliée à votre adresse — les captures seront envoyées automatiquement par email, en pièce jointe.',
    locationLabel: "Nom de l'emplacement",
    locationPlaceholder: 'Entrée principale',
    sensitivityLabel: 'Sensibilité',
    sensitivityLow: 'Faible',
    sensitivityMedium: 'Moyen',
    sensitivityHigh: 'Élevé',
    soundLabel: "Alerte sonore",
    soundOn: 'ON',
    soundOff: 'OFF',
    nightVisionLabel: 'Mode vision nocturne',
    nightVisionAuto: 'Auto',
    nightVisionForceNight: 'Forcé Nuit',
    nightVisionForceDay: 'Forcé Jour',
    recordClipsLabel: 'Clips vidéo',
    recordClipsOn: 'ON',
    recordClipsOff: 'OFF',
    recordClipsHelp:
      'Enregistre un court clip vidéo filtré (~4 s) à chaque détection, en plus de la photo. Utilise plus de stockage local sur l’appareil.',
    startButton: '🚀 DÉMARRER LA SURVEILLANCE',
    cameraError: 'Caméra indisponible — vérifiez les permissions.',
  },

  surveillance: {
    statusActive: 'EN SURVEILLANCE',
    alertsCount: 'alertes',
    statActive: 'Surveillance active',
    statLocation: 'Emplacement',
    statBrightness: 'Luminosité',
    pause: 'PAUSE',
    resume: 'REPRENDRE',
    capture: 'CAPTURE',
    stop: 'STOP',
    motionDetected: 'Mouvement détecté !',
    batteryLow: 'Batterie faible',
  },

  tabs: {
    live: 'Live',
    alerts: 'Alertes',
    config: 'Config',
  },

  alerts: {
    headerToday: "Alertes — Aujourd'hui",
    filterAll: 'Tout',
    filterMotion: 'Mouvement',
    filterManual: 'Manuel',
    diff: 'Diff',
    duration: 'Durée',
    view: 'Voir',
    download: 'DL',
    delete: 'Sup',
    downloadAll: 'Télécharger tout',
    clearHistory: "Vider l'historique",
    empty: 'Aucune alerte pour le moment.',
    confirmClear: "Vider tout l'historique des alertes ?",
    confirmDelete: 'Supprimer cette alerte ?',
    typeMotion: 'Mouvement',
    typeManual: 'Manuel',
    videoLoading: 'Chargement du clip…',
    videoUnavailable: 'Clip vidéo indisponible.',
    downloadVideo: 'Télécharger le clip',
  },

  common: {
    seconds: 's',
  },
} as const

export type Translations = typeof fr
