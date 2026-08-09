import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

const HOLD_MS = 2500
const SLIDE_MS = 350

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function RoleTitle({ titles }: { titles: string[] }) {
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [paused, setPaused] = useState(false)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const [frameHeight, setFrameHeight] = useState(0)

  // One extra frame at the end duplicates the first title, so the loop can
  // slide "forward" into it, then snap back to index 0 (identical text)
  // without a visible jump.
  const frames = [...titles, titles[0]]

  useLayoutEffect(() => {
    const el = sizerRef.current
    if (!el) return
    const update = () => setFrameHeight(el.getBoundingClientRect().height)
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

  useEffect(() => {
    if (transitionEnabled) return
    const id = window.requestAnimationFrame(() => setTransitionEnabled(true))
    return () => window.cancelAnimationFrame(id)
  }, [transitionEnabled])

  if (reducedMotion) {
    return <span>{titles[0]}.</span>
  }

  return (
    <span
      // translate-y compensates for leading-[1.2] below: the extra line-height
      // is split evenly above and below the glyphs, so align-bottom (which
      // anchors this box's bottom edge, not the text's baseline) otherwise
      // leaves the title sitting visibly above the rest of the sentence.
      className="relative inline-block translate-y-[0.15em] overflow-hidden align-bottom"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sizer: in-flow but invisible, holds the current title's text so the
          container's width/height track it (the animated column below is
          absolutely positioned and can't size its own ancestor). `block
          leading-[1.2]` pins its height to a fixed multiple of font-size, so
          it can't drift from the h1's inherited line-height — 1.2 rather
          than 1 (leading-none) because descenders like the "g" in
          "engineer" get clipped by neighboring rows in the stack at exactly
          1x line-height. */}
      <span
        ref={sizerRef}
        aria-hidden="true"
        className="invisible block leading-[1.2] whitespace-nowrap"
      >
        {frames[index]}.
      </span>
      <span className="sr-only">{titles.join(', ')}</span>
      {/* A single column of every title stacked in normal flow, shifted up
          by one frame per step. Only this one element ever transitions —
          deliberately not N independently-transformed layers — since that's
          the simplest version of this "odometer" pattern to render right. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 block',
          transitionEnabled && 'transition-transform duration-[350ms] ease-out',
        )}
        style={{ transform: `translateY(${-index * frameHeight}px)` }}
      >
        {frames.map((title, i) => (
          <span key={i} className="block leading-[1.2] whitespace-nowrap">
            {title}.
          </span>
        ))}
      </span>
    </span>
  )
}
