import { useEffect, useState } from 'react'

/**
 * True once the page has scrolled past `enter` pixels, and back to false only
 * below `exit`. Used to compact the sticky header. The gap between the two
 * thresholds is the point: a single threshold flips on any pixel of wobble
 * across it — trackpad twitch, momentum easing, smooth-scroll overshoot — and
 * the header flickers as the reader leaves the top of the page.
 */
export function useIsScrolled(enter = 64, exit = 16) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const update = () =>
      setIsScrolled((wasScrolled) =>
        window.scrollY > (wasScrolled ? exit : enter),
      )

    // Run once on mount: the browser restores scroll position on reload and
    // follows #hash links before this ever gets a scroll event.
    update()

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [enter, exit])

  return isScrolled
}
