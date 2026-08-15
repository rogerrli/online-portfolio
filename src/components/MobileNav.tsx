import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Menu } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavLink {
  id: string
  label: string
}

interface MobileNavProps {
  links: NavLink[]
  activeId?: string | null
}

export function MobileNav({ links, activeId }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rail:hidden')}
      >
        <Menu aria-hidden="true" className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="rail:hidden">
          <Popover.Popup className="flex w-44 origin-[var(--transform-origin)] flex-col gap-1 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md outline-none transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <nav aria-label="Primary" className="flex flex-col">
              {links.map((link) => {
                const isActive = link.id === activeId
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-accent-text',
                      isActive && 'text-accent-text',
                    )}
                  >
                    {link.label}
                  </a>
                )
              })}
            </nav>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
