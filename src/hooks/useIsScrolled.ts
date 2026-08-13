import { useEffect, useState } from 'react'

/**
 * True once the page has scrolled past `threshold` pixels. Used to compact the
 * sticky header, so the threshold wants to be small enough that the change
 * happens as soon as the reader starts moving, but not so small that a
 * trackpad twitch at the top of the page flickers it.
 */
export function useIsScrolled(threshold = 24) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > threshold)

    // Run once on mount: the browser restores scroll position on reload and
    // follows #hash links before this ever gets a scroll event.
    update()

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return isScrolled
}
