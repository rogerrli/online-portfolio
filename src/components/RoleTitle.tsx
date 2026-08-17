import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

const HOLD_MS = 2500
const SLIDE_MS = 350

export function RoleTitle({ titles }: { titles: string[] }) {
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [paused, setPaused] = useState(false)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLSpanElement>(null)
  const [frameHeight, setFrameHeight] = useState(0)

  // One extra frame at the end duplicates the first title, so the loop can
  // slide "forward" into it, then snap back to index 0 (identical text)
  // without a visible jump.
  const frames = [...titles, titles[0]]

  // Every frame is sized to the *tallest* title rather than to its own text,
  // so the block reserves room for the longest one up front and its height
  // never changes as the cycle advances. Without this the heading grows a
  // line whenever a title long enough to wrap comes around, shoving the rest
  // of the page down and back up.
  useLayoutEffect(() => {
    const el = sizerRef.current
    if (!el) return
    const update = () =>
      setFrameHeight(
        Math.max(
          ...[...el.children].map((c) => c.getBoundingClientRect().height),
        ),
      )
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reducedMotion || paused) return
    const id = window.setInterval(() => setIndex((i) => i + 1), HOLD_MS)
    return () => window.clearInterval(id)
  }, [reducedMotion, paused])

  useEffect(() => {
    if (index !== frames.length - 1) return
    const id = window.setTimeout(() => {
      setTransitionEnabled(false)
      setIndex(0)
    }, SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [index, frames.length])

  // Restore the transition only once the snapped-back transform has been
  // flushed to style. Reading layout forces the browser to adopt
  // `translateY(0)` as the current computed style while transitions are still
  // off, so putting the transition back can't animate the jump. A
  // `requestAnimationFrame` is *not* enough here: it runs before the snapped
  // frame is painted, so the transition comes back in the same frame the
  // transform changed and the browser animates the whole way back — the title
  // stack visibly rewinds through every previous title instead of looping.
  useLayoutEffect(() => {
    if (transitionEnabled) return
    trackRef.current?.getBoundingClientRect()
    setTransitionEnabled(true)
  }, [transitionEnabled])

  if (reducedMotion) {
    return <span className="block">{titles[0]}.</span>
  }

  return (
    // `block` so the title always starts its own line and spans the full
    // heading width — that width is what the titles wrap against.
    <span
      className="relative block overflow-hidden"
      style={{ height: frameHeight || undefined }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sizer: out of flow (the container's height is set explicitly above)
          and invisible, holding every title at the container's own width so
          each one's wrapped height can be measured. `leading-[1.2]` pins line
          height to a fixed multiple of font-size so it can't drift from the
          h1's inherited line-height — 1.2 rather than 1 (leading-none)
          because descenders like the "g" in "engineer" get clipped by
          neighboring rows in the stack at exactly 1x line-height. */}
      <span
        ref={sizerRef}
        aria-hidden="true"
        className="invisible absolute inset-x-0 top-0 block"
      >
        {titles.map((title, i) => (
          <span key={i} className="block leading-[1.2]">
            {title}.
          </span>
        ))}
      </span>
      <span className="sr-only">{titles.join(', ')}</span>
      {/* A single column of every title stacked in normal flow, shifted up
          by one frame per step. Only this one element ever transitions —
          deliberately not N independently-transformed layers — since that's
          the simplest version of this "odometer" pattern to render right. */}
      <span
        ref={trackRef}
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 block',
          transitionEnabled && 'transition-transform ease-out',
        )}
        style={{
          transform: `translateY(${-index * frameHeight}px)`,
          transitionDuration: `${SLIDE_MS}ms`,
        }}
      >
        {frames.map((title, i) => (
          <span
            key={i}
            className="block leading-[1.2]"
            style={{ height: frameHeight || undefined }}
          >
            {title}.
          </span>
        ))}
      </span>
    </span>
  )
}
