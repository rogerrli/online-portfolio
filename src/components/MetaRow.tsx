import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The page's three-column "what / where / when" row, dressed like an
 * experience row minus the disclosure. The right padding stands in for the
 * chevron column those rows carry (1rem icon + the trigger's 0.75rem pr-3),
 * without which the date would sit 1.75rem further right than every date
 * above it.
 */
export function MetaRow({
  what,
  where,
  when,
  className,
}: {
  what: ReactNode
  where?: ReactNode
  when: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-0.5 py-4 sm:flex-row sm:items-baseline sm:gap-3 sm:pr-7',
        className,
      )}
    >
      <span className="font-medium">{what}</span>
      {where && <span className="text-sm text-muted-foreground">{where}</span>}
      <span className="font-mono text-sm text-muted-foreground sm:ml-auto">{when}</span>
    </div>
  )
}
