import { cn } from '@/lib/utils'

interface NavLink {
  id: string
  label: string
}

interface SectionRailProps {
  links: NavLink[]
  activeId: string | null
}

/**
 * Table-of-contents rail shown in the left column from the `rail` breakpoint
 * up, where the grid in index.css reserves space for it. Below that the
 * header's MobileNav popover carries the same links.
 */
export function SectionRail({ links, activeId }: SectionRailProps) {
  return (
    <nav
      aria-label="Sections"
      className="sticky top-24 hidden self-start pt-12 rail:block"
    >
      <ul className="flex flex-col gap-0.5">
        {links.map((link) => {
          const isActive = activeId === link.id
          return (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md py-1 text-sm text-muted-foreground transition-colors hover:text-accent-text',
                  isActive && 'text-accent-text',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 shrink-0 rounded-full transition-colors',
                    isActive ? 'bg-accent-text' : 'bg-transparent',
                  )}
                />
                {link.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
