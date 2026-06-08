import { Video, History, Settings, type LucideIcon } from 'lucide-react'
import { fr } from '../data/translations'

export type TabKey = 'live' | 'alerts' | 'config'

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; icon: LucideIcon; label: string }[] = [
  { key: 'live', icon: Video, label: fr.tabs.live },
  { key: 'alerts', icon: History, label: fr.tabs.alerts },
  { key: 'config', icon: Settings, label: fr.tabs.config },
]

/** Fixed bottom tab bar for the surveillance/alerts/config navigation. */
export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-text-secondary/15 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map(({ key, icon: Icon, label }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors duration-300 ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2 : 1.6} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
