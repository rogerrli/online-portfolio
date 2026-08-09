import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Download, Menu } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  download?: string
}

interface MobileNavProps {
  links: NavLink[]
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden')}
      >
        <Menu aria-hidden="true" className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="md:hidden">
          <Popover.Popup className="flex w-44 origin-[var(--transform-origin)] flex-col gap-1 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md outline-none transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <nav aria-label="Primary" className="flex flex-col">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  {...(link.download ? { download: link.download } : {})}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-accent-text"
                >
                  {link.download && (
                    <Download aria-hidden="true" className="size-3.5" />
                  )}
                  {link.label}
                </a>
              ))}
            </nav>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
