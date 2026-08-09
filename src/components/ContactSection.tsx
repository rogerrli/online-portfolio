import { ExternalLink, Mail, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ContactLink {
  label: string
  href: string
  icon: LucideIcon
  external?: boolean
}

const CONTACT_LINKS: ContactLink[] = [
  {
    label: 'li.rojie@gmail.com',
    href: 'mailto:li.rojie@gmail.com',
    icon: Mail,
  },
  {
    label: '734-233-1177',
    href: 'tel:+17342331177',
    icon: Phone,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/lirojie/',
    icon: ExternalLink,
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/rogerrli',
    icon: ExternalLink,
    external: true,
  },
]

export function ContactSection() {
  return (
    <section id="contact">
      <h2 className="mb-2 text-2xl font-medium tracking-tight">Contact</h2>
      <p className="mb-6 max-w-[60ch] text-muted-foreground">
        Best way to reach me is email, happy to talk about roles,
        projects, or anything in between.
      </p>
      <ul className="flex flex-wrap gap-3">
        {CONTACT_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'gap-2 hover:border-accent hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {link.label}
                {link.external && (
                  <span className="sr-only"> (opens in new tab)</span>
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
