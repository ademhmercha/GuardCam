import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SetupScreen } from './screens/SetupScreen'
import { SurveillanceScreen } from './screens/SurveillanceScreen'
import { AlertsScreen } from './screens/AlertsScreen'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const { settings, updateSettings } = useSettings()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text-primary">
        <Routes>
          <Route path="/" element={<SetupScreen settings={settings} updateSettings={updateSettings} />} />
          <Route path="/surveillance" element={<SurveillanceScreen settings={settings} />} />
          <Route path="/alertes" element={<AlertsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
