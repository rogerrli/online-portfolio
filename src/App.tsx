import { Download, Sparkles } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SkillsSection } from '@/components/SkillsSection'
import { ProjectsSection } from '@/components/ProjectsSection'
import { WorkingWithAiSection } from '@/components/WorkingWithAiSection'
import { BeyondWorkSection } from '@/components/BeyondWorkSection'
import { ContactSection } from '@/components/ContactSection'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileNav } from '@/components/MobileNav'
import { RoleTitle } from '@/components/RoleTitle'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useHasFinePointer } from '@/hooks/useHasFinePointer'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#working-with-ai', label: 'Working with AI' },
  { href: '#beyond-work', label: 'Beyond Work' },
  { href: '#contact', label: 'Contact' },
]

const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1))

interface Role {
  title: string
  company?: string
  dates: string
  description: string
  /** Short tech/skill tags shown as pills, e.g. ["React", "TypeScript"]. */
  tags?: string[]
}

const EXPERIENCE: Role[] = [
  {
    title: 'Senior Software Engineer',
    dates: 'May 2023 to Present',
    description: 'Frontend development in React, using Tailwind and Base UI.',
    tags: ['React', 'Tailwind', 'Base UI', 'Claude Code', 'Cursor'],
  },
  {
    title: 'Product Manager',
    company: 'Jumbo',
    dates: 'May 2022 to May 2023',
    description:
      'Shipped multiple iOS features and helped move the product from B2C to B2B2C. Set weekly roadmaps for engineers with a strong focus on protecting user data, and used analytics to steer the product toward our KPI goals.',
    tags: ['iOS', 'Analytics', 'Product Strategy', 'A/B Testing'],
  },
  {
    title: 'Product Manager',
    company: 'VidMob',
    dates: 'Oct 2020 to April 2022',
    description:
      "Planned the roadmap across 3 teams as both product owner and scrum master. Worked directly with clients and dug into data to find the product's next highest-value move. Kept a hand in the two prior roles at the company as needed.",
    tags: ['Roadmapping', 'Scrum'],
  },
  {
    title: 'Solution Engineer',
    company: 'VidMob',
    dates: 'Oct 2019 to Oct 2021',
    description:
      'Built proof-of-concepts so product teams could weigh cost, risk, and value before committing to new features. Overhauled our API docs, including a new public-facing version. Served as the technical lead for partnerships scoping new integrations.',
    tags: ['API Design', 'Postman', 'OAuth1/OAuth2', 'Documentation'],
  },
  {
    title: 'Full Stack Engineer',
    company: 'VidMob',
    dates: 'May 2017 to Sept 2019',
    description:
      'Designed and built new features and systems end to end. Rebuilt the email notification system, shipped about a dozen integrations to cut manual workflows, and eventually led the engineering team.',
    tags: ['React JS', 'Angular JS', 'Groovy/Grails', 'Java', 'MySQL', 'HTML/CSS'],
  },
  {
    title: 'Integration Engineer',
    company: 'Epic Systems',
    dates: 'Feb 2016 to Nov 2016',
    description:
      'Guided clients through new software rollouts, recommending configurations tailored to their needs and hitting fixed launch dates. Juggled this across multiple clients at once.',
    tags: ['Client Implementation', 'Healthcare IT', 'Configuration', 'Project Management'],
  },
  {
    title: 'Bioengineer',
    company: 'Healmet',
    dates: 'Aug 2015 to Jan 2016',
    description:
      'Helped plan a prototype for detecting basic vitals (heart rate, oxygen saturation, EKG) similar to what an Apple Watch does today.',
    tags: ['Signal Processing', 'MATLAB', 'Hardware Prototyping', 'EKG'],
  },
  {
    title: 'Research Assistant',
    company: 'University Hospitals Cleveland Medical Center',
    dates: 'Aug 2013 to May 2015',
    description:
      'Supported a lab studying OCT imaging of coronary arteries, and improved how patient data was tracked and secured.',
    tags: ['Image Processing', 'OCT Imaging'],
  },
]

// Deduplicated, lowercased titles for the cycling hero heading — derived
// from EXPERIENCE so the two stay in sync.
const ROLE_TITLES = Array.from(
  new Set(EXPERIENCE.map((role) => role.title.replace(/^Senior\s+/, '').toLowerCase())),
)

function App() {
  const activeId = useActiveSection(SECTION_IDS)
  const hasFinePointer = useHasFinePointer()

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background py-6">
        <span className="font-semibold">Roger Li</span>
        <div className="flex items-center gap-6">
          <nav aria-label="Primary" className="hidden gap-6 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = activeId === link.href.slice(1)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'text-muted-foreground hover:text-accent-text',
                    isActive && 'text-accent-text',
                  )}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>
          <span aria-hidden="true" className="hidden h-4 w-px bg-border md:block" />
          <a
            href="/resume.pdf"
            download="Roger-Li-Resume.pdf"
            className="group relative inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground shadow-sm transition-shadow hover:shadow-[0_0_18px_-4px_var(--accent)]"
          >
            {/* Shimmer: a soft light bar that sweeps across the pill every few
                seconds. Clipped by its own rounded, overflow-hidden layer so
                the sparkles below can still sit outside the pill's edge. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            >
              <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/35 blur-[3px] motion-safe:animate-[resume-shimmer_4.5s_ease-in-out_infinite]" />
            </span>
            <Sparkles
              aria-hidden="true"
              className="absolute -top-1 -left-1 size-3 text-accent opacity-0 transition-opacity group-hover:opacity-100 motion-safe:group-hover:animate-[resume-twinkle_1.4s_ease-in-out_infinite]"
            />
            <Sparkles
              aria-hidden="true"
              className="absolute -right-1 -bottom-1 size-2.5 text-accent opacity-0 transition-opacity group-hover:opacity-100 motion-safe:group-hover:animate-[resume-twinkle_1.4s_ease-in-out_0.7s_infinite]"
            />
            <Download aria-hidden="true" className="size-3.5" />
            Resume
          </a>
          <ThemeToggle />
          <MobileNav links={NAV_LINKS} activeHref={`#${activeId ?? ''}`} />
        </div>
      </header>

      <main className="flex flex-col gap-16 py-12">
        <section id="about">
          <h1 className="mb-4 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
            Hi, I&rsquo;m Roger:
            <br />
            <RoleTitle titles={ROLE_TITLES} />
          </h1>
          <p className="mb-8 max-w-[60ch] text-muted-foreground">
            My path here has been a little winding: bioengineering
            research, then software, then product, now back to software,
            and that mix is what makes me useful: I can go deep on
            code and still talk fluently with the people who aren&rsquo;t
            writing it.
          </p>
          <dl className="flex flex-wrap gap-8">
            <div>
              <dt className="mb-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Location
              </dt>
              <dd>
                Brooklyn, New York
                <span className="block text-sm text-muted-foreground">open to remote</span>
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Email
              </dt>
              <dd>
                <a href="mailto:li.rojie@gmail.com" className="underline underline-offset-3 hover:text-accent-text">
                  li.rojie@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Phone
              </dt>
              <dd>
                {hasFinePointer ? (
                  '734-233-1177'
                ) : (
                  <a href="tel:+17342331177" className="underline underline-offset-3 hover:text-accent-text">
                    734-233-1177
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                Education
              </dt>
              <dd>
                B.S. Biomedical Engineering, Case Western Reserve University
                &middot; Certified Scrum Manager &middot; Certified Scrum
                Product Owner
              </dd>
            </div>
          </dl>
        </section>

        <section id="experience">
          <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">Experience</h2>
          <Accordion className="border-t border-border">
            {EXPERIENCE.map((role, i) => (
              <AccordionItem key={`${role.title}-${i}`} value={`${role.title}-${i}`}>
                <AccordionTrigger className="items-center py-4 text-base font-medium hover:text-accent-text">
                  <span className="flex flex-1 flex-col items-start gap-0.5 pr-3 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="group-hover/accordion-trigger:underline">{role.title}</span>
                    {role.company && (
                      <span className="text-sm font-normal text-muted-foreground no-underline">
                        {role.company}
                      </span>
                    )}
                    <span className="font-mono text-sm font-normal text-muted-foreground no-underline sm:ml-auto">
                      {role.dates}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p>{role.description}</p>
                  {role.tags && role.tags.length > 0 && (
                    <ul aria-label="Technologies used" className="mt-3 flex flex-wrap gap-1.5">
                      {role.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <SkillsSection />
        <ProjectsSection />
        <WorkingWithAiSection />
        <BeyondWorkSection />
        <ContactSection />
      </main>

      <footer className="border-t border-border py-6 text-xs text-muted-foreground">
        <p>
          Built to be legible to AI agents, too:{' '}
          <a
            href="/llms.txt"
            className="underline underline-offset-3 hover:text-accent-text"
          >
            llms.txt
          </a>
          {' '}&middot;{' '}
          <a
            href="/resume.json"
            className="underline underline-offset-3 hover:text-accent-text"
          >
            resume.json
          </a>
        </p>
      </footer>
    </>
  )
}

export default App
