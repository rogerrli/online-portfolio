import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

const HOLD_MS = 2500
const SLIDE_MS = 350
const SWAP_MS = 550

/**
 * A title that reads twice off the same words: "engineer who speaks product",
 * then the two nouns trade places into "product manager who speaks engineer".
 *
 * Both readings share one frame of the cycle, so the swap plays in place
 * instead of sliding a new line up — the point is that the words rearrange,
 * not that a different title arrived. `tailSuffix` is the word the tail noun
 * picks up once it leads ("product" into "product manager"); it fades in
 * while the nouns are in flight.
 */
export type SwapTitle = {
  head: string
  between: string
  tail: string
  tailSuffix?: string
}

export type Title = string | SwapTitle

/** Every reading of a title, in the order the cycle holds on them. */
function readings(title: Title): string[] {
  if (typeof title === 'string') return [title]
  const { head, between, tail, tailSuffix } = title
  return [
    `${head} ${between} ${tail}`,
    `${tail}${tailSuffix ? ` ${tailSuffix}` : ''} ${between} ${head}`,
  ]
}

/**
 * The two readings of a `SwapTitle`, animated as a reorder rather than a
 * crossfade: each word is its own keyed span, so advancing the reading moves
 * the same DOM nodes into new slots and the effect below walks them there
 * from wherever they just were. Keying by word and not by slot is what makes
 * the nouns visibly cross — slots barely move, words do.
 */
function SwapLine({ title, phase }: { title: SwapTitle; phase: number }) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const words = useRef(new Map<string, HTMLSpanElement>())
  // Where each word sat at the previous render. Captured after every commit
  // and not only on a phase change, so a reflow during the hold — a window
  // resize, the first pass once the frame height is known — can't leave the
  // swap travelling from a stale position.
  const origins = useRef(new Map<string, { x: number; y: number }>())
  const lastPhase = useRef(phase)

  useLayoutEffect(() => {
    const from = origins.current
    const to = new Map(
      [...words.current].map(([key, el]) => [
        key,
        // Layout offsets rather than client rects: immune both to page scroll
        // and to the transforms this effect leaves behind on the words.
        { x: el.offsetLeft, y: el.offsetTop },
      ]),
    )
    origins.current = to

    // Only the forward step animates. The reset back to the first reading
    // happens while the frame is parked off-screen for the next loop.
    const forward = phase > lastPhase.current
    lastPhase.current = phase
    if (!forward) return

    for (const [key, el] of words.current) {
      const start = from.get(key)
      const end = to.get(key)
      if (!start || !end) continue
      el.style.transition = 'none'
      el.style.transform = `translate(${start.x - end.x}px, ${start.y - end.y}px)`
    }
    // Reading layout forces the browser to adopt the inverted positions as
    // the current computed style while transitions are still off, so the
    // transition restored below animates from there rather than being
    // collapsed into the same style flush and never running at all.
    rootRef.current?.getBoundingClientRect()
    for (const el of words.current.values()) {
      el.style.transition = `transform ${SWAP_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`
      el.style.transform = ''
    }
  })

  const register = (key: string) => (el: HTMLSpanElement | null) => {
    if (el) words.current.set(key, el)
    else words.current.delete(key)
  }

  const text: Record<string, string | undefined> = {
    head: title.head,
    between: title.between,
    tail: title.tail,
    suffix: title.tailSuffix,
  }
  const order =
    phase === 0
      ? ['head', 'between', 'tail']
      : ['tail', ...(title.tailSuffix ? ['suffix'] : []), 'between', 'head']

  return (
    <span ref={rootRef}>
      {order.map((key, i) => (
        <Fragment key={key}>
          {i > 0 && ' '}
          {/* inline-block so the transform applies at all, and so each word
              stays one unbreakable unit. */}
          <span
            ref={register(key)}
            className={cn(
              'inline-block',
              key === 'suffix' &&
                'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-550',
            )}
          >
            {text[key]}
          </span>
        </Fragment>
      ))}
      {/* Keyed and measured like the words, so it travels to the line's new
          end instead of jumping there. */}
      <span ref={register('stop')} className="inline-block">
        .
      </span>
    </span>
  )
}

export function RoleTitle({ titles }: { titles: Title[] }) {
  const reducedMotion = usePrefersReducedMotion()
  const [stepIndex, setStepIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const [paused, setPaused] = useState(false)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLSpanElement>(null)
  const [frameHeight, setFrameHeight] = useState(0)

  // One extra frame at the end duplicates the first title, so the loop can
  // slide "forward" into it, then snap back to index 0 (identical text)
  // without a visible jump.
  const frames = [...titles, titles[0]]

  // The cycle advances through *readings*, not frames: a swap title holds
  // twice on the one frame. Each step names the frame to show and which of
  // its readings. The clone frame only needs its first reading — the snap
  // back to the top happens as soon as the slide into it finishes.
  const steps = [
    ...titles.flatMap((title, frame) =>
      readings(title).map((_, phase) => ({ frame, phase })),
    ),
    { frame: titles.length, phase: 0 },
  ]
  const step = steps[stepIndex]

  // Frames already passed hold their last reading as they slide away; frames
  // not yet reached show their first.
  const phaseOf = (frame: number) =>
    step.frame > frame
      ? readings(frames[frame]).length - 1
      : step.frame === frame
        ? step.phase
        : 0

  const allReadings = titles.flatMap(readings)

  // Every frame is sized to the *tallest* reading rather than to its own text,
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
    const id = window.setInterval(() => setStepIndex((i) => i + 1), HOLD_MS)
    return () => window.clearInterval(id)
  }, [reducedMotion, paused])

  useEffect(() => {
    if (stepIndex !== steps.length - 1) return
    const id = window.setTimeout(() => {
      setTransitionEnabled(false)
      setStepIndex(0)
    }, SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [stepIndex, steps.length])

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
    return <span className="block">{allReadings[0]}.</span>
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
          and invisible, holding every reading at the container's own width so
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
        {allReadings.map((reading, i) => (
          <span key={i} className="block leading-[1.2]">
            {reading}.
          </span>
        ))}
      </span>
      <span className="sr-only">{allReadings.join(', ')}</span>
      {/* A single column of every title stacked in normal flow, shifted up
          by one frame per step. Only this one element ever transitions —
          deliberately not N independently-transformed layers — since that's
          the simplest version of this "odometer" pattern to render right.

          The paused state is `transition-none`, not merely the absence of
          `transition-transform`: the duration below is an unconditional inline
          style, so without an explicit `transition-property: none` the
          disabled state falls back to the initial `all` and the snap-back
          animates regardless. */}
      <span
        ref={trackRef}
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 block',
          transitionEnabled ? 'transition-transform ease-out' : 'transition-none',
        )}
        style={{
          transform: `translateY(${-step.frame * frameHeight}px)`,
          transitionDuration: `${SLIDE_MS}ms`,
        }}
      >
        {frames.map((title, i) => (
          <span
            key={i}
            className="block leading-[1.2]"
            style={{ height: frameHeight || undefined }}
          >
            {typeof title === 'string' ? (
              `${title}.`
            ) : (
              <SwapLine title={title} phase={phaseOf(i)} />
            )}
          </span>
        ))}
      </span>
    </span>
  )
}
