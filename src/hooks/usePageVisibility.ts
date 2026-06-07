import { useEffect, useState } from 'react'

/** Tracks document.visibilityState — used to pause heavy processing when the tab is hidden. */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return isVisible
}
