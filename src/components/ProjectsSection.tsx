import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ExternalLink } from '@/components/ExternalLink'
import { Section } from '@/components/Section'
import { TagList } from '@/components/TagList'
import { cn, LINK_CLASS } from '@/lib/utils'

interface Project {
  title: string
  description: string
  /** Short tech/skill tags shown as pills, e.g. ["TypeScript", "React"]. */
  tags?: string[]
  /** Optional links out to the live project, repo, or case study. */
  links?: {
    href: string
    label: string
  }[]
}

// Each array item renders as one card in the grid below, so adding a
// project is just pushing a new object here — no layout changes needed.
const PROJECTS: Project[] = [
  {
    title: 'This site',
    description:
      "The old liroger.com was a generic template site that was a pain to keep current. I rebuilt it as a code-owned site (Vite, React, TypeScript, Tailwind, shadcn/Base UI) with content and design tracked as normal commits instead of a page builder. It was also built collaboratively with Claude Code — work planned as GitHub issues, implemented across git worktrees, shipped through PRs — which is what you're looking at right now.",
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Claude Code'],
    links: [
      { href: 'https://online-portfolio-puce.vercel.app', label: 'Live site' },
      { href: 'https://github.com/rogerrli/online-portfolio', label: 'Source' },
    ],
  },
  {
    title: 'VidMob — integration platform',
    description:
      "Teams were losing time to manual, repetitive workflows connecting VidMob to the ad platforms and tools clients relied on. I architected and built roughly a dozen integrations (Groovy/Grails, OAuth1/OAuth2) across platforms like Facebook, Google, and Salesforce, replacing manual handoffs with automated syncs.",
    tags: ['Groovy/Grails', 'OAuth1/OAuth2', 'REST APIs'],
  },
  {
    title: 'VidMob — public API documentation',
    description:
      "VidMob's API documentation was internal-only and inconsistent, which slowed down both new integrations and partnership conversations. I overhauled the documentation strategy end to end and stood up a public-facing version, giving partners and prospects a self-serve technical reference instead of routing every question through an engineer.",
    tags: ['API Design', 'Technical Writing', 'Postman'],
  },
  {
    title: 'Jumbo — B2C to B2B2C transition',
    description:
      "Jumbo needed to evolve its consumer iOS app into a model that also served business partners, without losing the trust of existing users. As product manager, I set weekly roadmaps for the engineering team, prioritized user-data protection through the transition, and used analytics to steer feature decisions toward our KPI goals across several shipped iOS releases.",
    tags: ['Product Strategy', 'Data Privacy', 'Analytics'],
  },
]

export function ProjectsSection() {
  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <Card
            key={`${project.title}-${i}`}
            className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-accent/40"
          >
            <CardHeader>
              <h3 className="font-heading text-base leading-snug font-medium">
                {project.title}
              </h3>
            </CardHeader>
            <CardContent>
              <p className="break-words text-muted-foreground">{project.description}</p>
              <TagList tags={project.tags} />
              {project.links && project.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {project.links.map((link) => (
                    <ExternalLink
                      key={link.href}
                      href={link.href}
                      className={cn('text-sm', LINK_CLASS)}
                    >
                      {link.label}
                    </ExternalLink>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
