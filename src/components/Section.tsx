import type { ReactNode } from 'react'

/**
 * The shared shell every top-level page section wears: the anchor target the
 * nav scroll-spy watches, plus the heading. Layout below the heading varies
 * per section, so that stays with each section's own body.
 */
export function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id}>
      <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">{title}</h2>
      {children}
    </section>
  )
}
