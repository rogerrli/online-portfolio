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
import { MetaRow } from '@/components/MetaRow'
import { Section } from '@/components/Section'
import { SectionRail } from '@/components/SectionRail'
import { TagList } from '@/components/TagList'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useIsScrolled } from '@/hooks/useIsScrolled'
import { cn, LINK_CLASS } from '@/lib/utils'

const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'working-with-ai', label: 'Working with AI' },
  { id: 'beyond-work', label: 'Beyond Work' },
  { id: 'contact', label: 'Contact' },
]

const SECTION_IDS = NAV_LINKS.map((link) => link.id)

interface Role {
  title: string
  dates: string
  /** The role's accomplishments, matching the bullets on the resume. */
  highlights: string[]
  /** Short tech/skill tags shown as pills, e.g. ["React", "TypeScript"]. */
  tags?: string[]
}

interface Employer {
  company: string
  roles: Role[]
  /**
   * The whole stretch at an employer, shown on the group heading. Required
   * whenever `roles` holds more than one, which is what makes a group.
   */
  span?: string
}

const EXPERIENCE: Employer[] = [
  {
    company: 'Oscar',
    roles: [
      {
        title: 'Senior Software Engineer',
        dates: 'May 2023 – Oct 2026',
        highlights: [
          'Built data analysis and reporting interfaces used by hundreds of people at large government clients, enabling more complex analysis by chaining one query’s output into the next and drawing regions on a map to explore the data inside them',
          'Owned features from the React/TypeScript frontend through the API layer: wrote Elasticsearch queries directly and added API-layer transformations over ClickHouse data so that logic stayed out of the frontend',
          'Helped build and enforce the team’s design system (Tailwind, Base UI), and built app-wide dark mode by reworking the color system into semantic tokens compatible with shadcn conventions',
          'Used Claude Code to build UI features and end-to-end test coverage, and helped introduce new skills and workflows that let the team keep up with a much larger throughput of code',
        ],
        tags: [
          'React',
          'TypeScript',
          'Tailwind',
          'Base UI',
          'Jotai',
          'Accessibility',
          'Data Viz',
          'Reporting',
          'Claude Code',
          'Cursor',
          'Playwright',
          'Jest',
        ],
      },
    ],
  },
  {
    company: 'Jumbo',
    roles: [
      {
        title: 'Product Manager',
        dates: 'May 2022 – May 2023',
        highlights: [
          'Led the shift from a consumer iOS app with thousands of users to a B2B2C model serving business partners, prioritizing the protection of existing users’ data throughout',
          'Set weekly roadmaps for a 5-person engineering team and used analytics to steer feature decisions toward KPI goals across about a dozen iOS releases',
        ],
        tags: ['iOS', 'Analytics', 'Product Strategy', 'A/B Testing'],
      },
    ],
  },
  {
    company: 'VidMob',
    span: 'May 2017 – Apr 2022',
    roles: [
      {
        title: 'Product Manager',
        dates: 'Sep 2020 – Apr 2022',
        highlights: [
          'Planned the roadmap across 3 teams as both product owner and scrum master',
          'Worked directly with clients, using their feedback and usage data to prioritize the backlog',
        ],
        tags: ['Roadmapping', 'Scrum'],
      },
      {
        title: 'Solutions Engineer',
        dates: 'Oct 2019 – Oct 2021',
        highlights: [
          'Built proofs of concept so product teams could see what a feature would cost before committing to it',
          'Overhauled the API documentation and launched a public-facing version, giving partners and prospects a self-serve reference',
          'Technical lead for partnerships, scoping new integrations',
        ],
        tags: ['API Design', 'Postman', 'OAuth1/OAuth2', 'Documentation'],
      },
      {
        title: 'Full Stack Engineer → Engineering Lead',
        dates: 'May 2017 – Sep 2019',
        highlights: [
          'Led a team of 5 engineers',
          'Built about a dozen integrations with ad platforms and business tools (Facebook, Google, Salesforce, and others) using OAuth1/OAuth2, replacing manual handoffs with automated syncs',
          'Rebuilt the email notification system and designed and built other features end to end in Groovy/Grails',
        ],
        tags: ['React JS', 'Angular JS', 'Groovy/Grails', 'Java', 'MySQL', 'HTML/CSS'],
      },
    ],
  },
  {
    company: 'Epic Systems',
    roles: [
      {
        title: 'Integration Engineer',
        dates: 'Feb 2016 – Nov 2016',
        highlights: [
          'Guided healthcare organizations through EHR rollouts, recommending configurations to fit clinical workflows and meeting fixed go-live dates',
        ],
        tags: ['Client Implementation', 'Healthcare IT', 'Configuration', 'Project Management'],
      },
    ],
  },
  {
    company: 'Healmet',
    roles: [
      {
        title: 'Bioengineer',
        dates: 'Aug 2015 – Jan 2016',
        highlights: [
          'Helped plan a wearable prototype for measuring vital signs (heart rate, oxygen saturation, EKG)',
        ],
        tags: ['Signal Processing', 'MATLAB', 'Hardware Prototyping', 'EKG'],
      },
    ],
  },
  {
    company: 'University Hospitals Cleveland Medical Center',
    roles: [
      {
        title: 'Research Assistant',
        dates: 'Aug 2013 – May 2015',
        highlights: [
          'Supported a lab studying OCT imaging of coronary arteries, and improved how patient data was tracked and secured',
        ],
        tags: ['Image Processing', 'OCT Imaging'],
      },
    ],
  },
]

/**
 * One collapsible role. `company` is set only for employers with a single
 * role, where the company belongs on the role's own line; in a multi-role
 * group the company already sits in the heading above.
 */
function ExperienceRow({
  id,
  role,
  company,
}: {
  id: string
  role: Role
  company?: string
}) {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="items-center py-4 text-base font-medium hover:text-accent-text">
        <span className="flex flex-1 flex-col items-start gap-0.5 pr-3 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="group-hover/accordion-trigger:underline">{role.title}</span>
          {company && (
            <span className="text-sm font-normal text-muted-foreground no-underline">
              {company}
            </span>
          )}
          <span className="font-mono text-sm font-normal text-muted-foreground no-underline sm:ml-auto">
            {role.dates}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground marker:text-border">
          {role.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
        <TagList tags={role.tags} />
      </AccordionContent>
    </AccordionItem>
  )
}

// Titles for the cycling hero heading. Deliberately hand-written rather
// than derived from EXPERIENCE: the heading offers a role ("your next …")
// instead of listing history, so a full résumé of past titles reads as a
// claim to every one of those careers at once. Two professional entries
// carry the pitch, then one sincere and one joke widen it past the job.
//
// Order matters. The first entry is what loads before the cycle starts and
// the only one visitors with prefers-reduced-motion ever see, so it leads
// with the straightest professional title — and the joke sits last, where
// it lands as a punchline.
const ROLE_TITLES = [
  'full stack engineer',
  'engineer who speaks product',
  'teammate',
  'dungeon master',
]

function App() {
  const activeId = useActiveSection(SECTION_IDS)
  const isScrolled = useIsScrolled()

  return (
    <>
      {/* Compacting a sticky header shrinks a box that is still in flow, so
          the height it drops would pull the whole page up with it — content
          sliding under the reader mid-scroll, which is what made the compact
          transition read as a jitter. `mb-6` hands back exactly the 1.5rem of
          padding `py-3` gives up, so the space the header occupies never
          changes and nothing below it moves; only the bar itself shrinks. */}
      <header
        className={cn(
          'sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background rail:col-span-2 motion-safe:transition-[padding,margin] motion-safe:duration-200',
          isScrolled ? 'mb-6 py-3' : 'py-6',
        )}
      >
        <span
          className={cn(
            'font-semibold motion-safe:transition-[font-size] motion-safe:duration-200',
            isScrolled && 'text-sm',
          )}
        >
          Roger Li
        </span>
        <div className="flex items-center gap-4">
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
          <MobileNav links={NAV_LINKS} activeId={activeId} />
        </div>
      </header>

      <SectionRail links={NAV_LINKS} activeId={activeId} />

      <main className="flex flex-col gap-16 py-12">
        <section id="about">
          <h1 className="mb-4 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
            {/* nbsp keeps "your next" intact — it introduces the cycling
                title below, and breaking after "your" strands "next" alone
                on a line at narrow widths. */}
            Hi, I&rsquo;m Roger, your&nbsp;next
            <RoleTitle titles={ROLE_TITLES} />
          </h1>
          <p className="max-w-[60ch] text-muted-foreground">
            My path here has been a little winding: bioengineering
            research, then software, then product, now back to software.
            I build across the stack and do my best work on the frontend,
            where product sense matters most. That mix is what makes me
            useful: I can go deep on code and still talk fluently with the
            people who aren&rsquo;t writing it.
          </p>
        </section>

        <Section id="experience" title="Experience">
          <Accordion className="border-t border-border">
            {EXPERIENCE.map((employer) =>
              employer.roles.length > 1 ? (
                /* Several roles at one employer: a heading carrying the whole
                   span, then the roles nested behind a left rule, so the
                   stretch reads as one job rather than three. */
                <div key={employer.company} className="not-last:border-b">
                  <MetaRow
                    what={employer.company}
                    where={`${employer.roles.length} roles`}
                    when={employer.span}
                  />
                  <div className="border-l border-border pl-4">
                    {employer.roles.map((role) => (
                      <ExperienceRow
                        key={`${employer.company}-${role.title}`}
                        id={`${employer.company}-${role.title}`}
                        role={role}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <ExperienceRow
                  key={employer.company}
                  id={employer.company}
                  role={employer.roles[0]}
                  company={employer.company}
                />
              ),
            )}
          </Accordion>
        </Section>

        <Section id="education" title="Education">
          {/* The top rule makes this read as a sibling of the experience
              list above, which the accordion gives itself. */}
          <MetaRow
            className="border-t border-border"
            what="B.S. Biomedical Engineering"
            where="Case Western Reserve University"
            when={<>Aug 2011 &ndash; May 2015</>}
          />
        </Section>

        <SkillsSection />
        <ProjectsSection />
        <WorkingWithAiSection />
        <BeyondWorkSection />
        <ContactSection />
      </main>

      <footer className="border-t border-border py-6 text-xs text-muted-foreground rail:col-start-2">
        <p>
          Built to be legible to AI agents, too:{' '}
          <a href="/llms.txt" className={LINK_CLASS}>
            llms.txt
          </a>
          {' '}&middot;{' '}
          <a href="/resume.json" className={LINK_CLASS}>
            resume.json
          </a>
        </p>
      </footer>
    </>
  )
}

export default App
