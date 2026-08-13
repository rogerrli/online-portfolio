import { Card, CardContent, CardHeader } from '@/components/ui/card'

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
      "The old liroger.com was a Squarespace template I mostly left alone, since changing anything was a chore and I was paying a subscription for the privilege. This version is a normal codebase (Vite, React, TypeScript, Tailwind, Base UI) where updating content is a commit rather than a session in a page builder. Built with Claude Code, planned as GitHub issues, shipped through PRs.",
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Claude Code'],
    links: [
      { href: 'https://online-portfolio-puce.vercel.app', label: 'Live site' },
      { href: 'https://github.com/rogerrli/online-portfolio', label: 'Source' },
    ],
  },
  {
    title: 'VidMob — integration platform',
    description:
      "Roughly a dozen integrations in Groovy/Grails, wiring VidMob into the ad platforms and storage tools clients were already using. Amazon Ads was the outlier: their API was inconsistent enough for the industry that I ended up giving Amazon feedback on how it should be shaped.",
    tags: ['Groovy/Grails', 'OAuth1/OAuth2', 'REST APIs'],
  },
  {
    title: 'VidMob — public API documentation',
    description:
      "VidMob's API docs were internal-only and inconsistent. When a prospective client needed to evaluate our new RESTful v2, I rewrote the documentation and put a public-facing version behind it.",
    tags: ['API Design', 'Technical Writing', 'Postman'],
  },
  {
    title: 'Jumbo — B2C to B2B2C transition',
    description:
      "Jumbo's consumer iOS app needed to work for business partners too. The engineering was the easy part. The real work was convincing those companies to buy it, and what they asked for in those conversations shaped the roadmap more than any planning session did.",
    tags: ['Product Strategy', 'Partnerships', 'Analytics'],
  },
]

export function ProjectsSection() {
  return (
    <section id="projects">
      <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">Projects</h2>
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
              {project.tags && project.tags.length > 0 && (
                <ul aria-label="Technologies used" className="mt-3 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              {project.links && project.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {project.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline underline-offset-3 hover:text-accent-text"
                    >
                      {link.label}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
