import { useEffect, useState } from 'react'

/**
 * True on devices with a precise pointer and hover support (mouse/trackpad),
 * false on touch devices. Starts false so tel: links only activate once we
 * know the device can't actually dial.
 */
export function useHasFinePointer() {
  const [hasFinePointer, setHasFinePointer] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    setHasFinePointer(query.matches)

    const handleChange = (event: MediaQueryListEvent) => setHasFinePointer(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return hasFinePointer
}
