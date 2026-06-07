import { useEffect, useState } from 'react'

interface BatteryManagerLike {
  level: number
  addEventListener: (type: 'levelchange', listener: () => void) => void
  removeEventListener: (type: 'levelchange', listener: () => void) => void
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>
}

/** Returns the current battery level (0-1), or null when the Battery Status API is unavailable. */
export function useBatteryLevel(): number | null {
  const [level, setLevel] = useState<number | null>(null)

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery
    if (!nav.getBattery) return

    let battery: BatteryManagerLike | null = null
    const update = () => battery && setLevel(battery.level)

    nav.getBattery().then((b) => {
      battery = b
      update()
      b.addEventListener('levelchange', update)
    })

    return () => {
      battery?.removeEventListener('levelchange', update)
    }
  }, [])

  return level
}
