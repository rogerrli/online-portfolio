import type { ReactNode } from 'react'

/**
 * Link that opens in a new tab. Bundles the `rel` hardening and the
 * screen-reader suffix so neither can be forgotten at a call site.
 */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  )
}
