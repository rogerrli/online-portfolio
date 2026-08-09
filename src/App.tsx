import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SkillsSection } from '@/components/SkillsSection'
import { ProjectsSection } from '@/components/ProjectsSection'
import { ContactSection } from '@/components/ContactSection'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileNav } from '@/components/MobileNav'
import { useActiveSection } from '@/hooks/useActiveSection'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
]

const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1))

interface Role {
  title: string
  company?: string
  dates: string
  description: string
}

const EXPERIENCE: Role[] = [
  {
    title: 'Senior Software Engineer',
    dates: 'May 2023 to Present',
    description:
      "Frontend development in React, using Tailwind and Base UI. Separately, I've been building with Claude Code and Cursor, including parallelizing work across git worktrees, as part of my day-to-day workflow.",
  },
  {
    title: 'Product Manager',
    company: 'Jumbo',
    dates: 'May 2022 to May 2023',
    description:
      'Shipped multiple iOS features and helped move the product from B2C to B2B2C. Set weekly roadmaps for engineers with a strong focus on protecting user data, and used analytics to steer the product toward our KPI goals.',
  },
  {
    title: 'Product Manager',
    company: 'VidMob',
    dates: 'Oct 2020 to Present',
    description:
      "Planned the roadmap across 3 teams as both product owner and scrum master. Worked directly with clients and dug into data to find the product's next highest-value move. Kept a hand in the two prior roles at the company as needed.",
  },
  {
    title: 'Solution Engineer',
    company: 'VidMob',
    dates: 'Oct 2019 to Oct 2021',
    description:
      'Built proof-of-concepts so product teams could weigh cost, risk, and value before committing to new features. Overhauled our API docs, including a new public-facing version. Served as the technical lead for partnerships scoping new integrations.',
  },
  {
    title: 'Full Stack Engineer',
    company: 'VidMob',
    dates: 'May 2017 to Sept 2019',
    description:
      'Designed and built new features and systems end to end. Rebuilt the email notification system, shipped about a dozen integrations to cut manual workflows, and eventually led the engineering team.',
  },
  {
    title: 'Integration Engineer',
    company: 'Epic Systems',
    dates: 'Feb 2016 to Nov 2016',
    description:
      'Guided clients through new software rollouts, recommending configurations tailored to their needs and hitting fixed launch dates. Juggled this across multiple clients at once.',
  },
  {
    title: 'Bioengineer',
    company: 'Healmet',
    dates: 'Aug 2015 to Jan 2016',
    description:
      'Helped plan a prototype for detecting basic vitals (heart rate, oxygen saturation, EKG) similar to what an Apple Watch does today.',
  },
  {
    title: 'Research Assistant',
    company: 'University Hospitals Cleveland Medical Center',
    dates: 'Aug 2013 to May 2015',
    description:
      'Supported a lab studying OCT imaging of coronary arteries, and improved how patient data was tracked and secured.',
  },
]

function App() {
  const activeId = useActiveSection(SECTION_IDS)

  return (
    <>
      <header className="flex items-center justify-between border-b border-border py-6">
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
          <ThemeToggle />
          <MobileNav links={NAV_LINKS} activeHref={`#${activeId ?? ''}`} />
        </div>
      </header>

      <main className="flex flex-col gap-16 py-12">
        <section id="about">
          <h1 className="mb-4 text-4xl font-medium tracking-tight text-balance sm:text-5xl">
            Hi, I&rsquo;m Roger, a software engineer.
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
              <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
                Location
              </dt>
              <dd>Brooklyn, New York &middot; open to remote</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
                Email
              </dt>
              <dd>
                <a href="mailto:li.rojie@gmail.com" className="underline underline-offset-3 hover:text-accent-text">
                  li.rojie@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
                Phone
              </dt>
              <dd>
                <a href="tel:+17342331177" className="underline underline-offset-3 hover:text-accent-text">
                  734-233-1177
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section id="experience">
          <h2 className="mb-2 text-2xl font-medium tracking-tight">Experience</h2>
          <Accordion className="border-t border-border">
            {EXPERIENCE.map((role, i) => (
              <AccordionItem key={`${role.title}-${i}`} value={`${role.title}-${i}`}>
                <AccordionTrigger className="py-4 text-base font-medium hover:text-accent-text">
                  <span className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                    <span>{role.title}</span>
                    {role.company && (
                      <span className="text-sm font-normal text-muted-foreground no-underline">
                        {role.company}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2 text-sm text-muted-foreground">{role.dates}</p>
                  <p>{role.description}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </>
  )
}

export default App
