import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { SetupScreen } from './screens/SetupScreen'
import { SurveillanceScreen } from './screens/SurveillanceScreen'
import { AlertsScreen } from './screens/AlertsScreen'
import { ViewerScreen } from './screens/ViewerScreen'
import { TabBar, type TabKey } from './components/TabBar'
import { useSettings } from './hooks/useSettings'

const ROUTE_FOR_TAB: Record<TabKey, string> = {
  live: '/surveillance',
  alerts: '/alertes',
  config: '/',
}

const TAB_FOR_ROUTE: Record<string, TabKey> = {
  '/': 'config',
  '/surveillance': 'live',
  '/alertes': 'alerts',
}

/** Persistent bottom navigation — always visible so Live / Alertes / Config stay reachable from any screen. */
function AppShell() {
  const { settings, updateSettings } = useSettings()
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = TAB_FOR_ROUTE[location.pathname] ?? 'config'
  const isViewerRoute = location.pathname.startsWith('/regarder')

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Routes>
        <Route path="/" element={<SetupScreen settings={settings} updateSettings={updateSettings} />} />
        <Route path="/surveillance" element={<SurveillanceScreen settings={settings} />} />
        <Route path="/alertes" element={<AlertsScreen />} />
        <Route path="/regarder/:peerId" element={<ViewerScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isViewerRoute && <TabBar active={activeTab} onChange={(tab) => navigate(ROUTE_FOR_TAB[tab])} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
