import { fr } from '../data/translations'

export type TabKey = 'live' | 'alerts' | 'config'

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; emoji: string; label: string }[] = [
  { key: 'live', emoji: '📹', label: fr.tabs.live },
  { key: 'alerts', emoji: '📋', label: fr.tabs.alerts },
  { key: 'config', emoji: '⚙️', label: fr.tabs.config },
]

/** Fixed bottom tab bar for the surveillance/alerts/config navigation. */
export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-text-secondary/15 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-300 ${
                isActive ? 'text-matrix' : 'text-text-secondary'
              }`}
            >
              <span className={`text-lg leading-none ${isActive ? 'drop-shadow-[0_0_6px_rgba(0,255,65,0.7)]' : ''}`}>
                {tab.emoji}
              </span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
