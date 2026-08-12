import { Download, Mail, Phone } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { GithubIcon, LinkedinIcon } from '@/components/icons/brand-icons'
import { buttonVariants } from '@/components/ui/button'
import { useHasFinePointer } from '@/hooks/useHasFinePointer'
import { cn } from '@/lib/utils'

interface ContactLink {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  external?: boolean
  download?: string
  /** Only makes sense as a link on devices that can actually dial. */
  touchOnly?: boolean
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
    touchOnly: true,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/lirojie/',
    icon: LinkedinIcon,
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/rogerrli',
    icon: GithubIcon,
    external: true,
  },
  {
    label: 'Resume (PDF)',
    href: '/resume.pdf',
    icon: Download,
    download: 'Roger-Li-Resume.pdf',
  },
]

export function ContactSection() {
  const hasFinePointer = useHasFinePointer()

  return (
    <section id="contact">
      <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">Contact</h2>
      <p className="mb-6 max-w-[60ch] text-muted-foreground">
        Best way to reach me is email, happy to talk about roles,
        projects, or anything in between.
      </p>
      <ul className="flex flex-wrap gap-3">
        {CONTACT_LINKS.map((link) => {
          const Icon = link.icon
          const isNonInteractive = link.touchOnly && hasFinePointer

          if (isNonInteractive) {
            return (
              <li key={link.label}>
                <span
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'gap-2 cursor-default hover:bg-transparent',
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {link.label}
                </span>
              </li>
            )
          }

          return (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                {...(link.download ? { download: link.download } : {})}
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
