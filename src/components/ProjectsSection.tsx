import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Project {
  title: string
  description: string
  /** Short tech/skill tags shown as pills, e.g. ["TypeScript", "React"]. */
  tags?: string[]
  /** Optional link out to the live project, repo, or case study. */
  link?: {
    href: string
    label: string
  }
}

// TODO(roger): replace this placeholder with real project entries.
// Each array item renders as one card in the grid below, so adding a
// project is just pushing a new object here — no layout changes needed.
const PROJECTS: Project[] = [
  {
    title: 'Example Project — replace me',
    description:
      'Add a real project here: what you built, your role, and the impact/outcome. Aim for 2-4 sentences.',
    tags: ['Replace', 'with', 'tech stack'],
  },
]

export function ProjectsSection() {
  return (
    <section id="projects">
      <h2 className="mb-2 text-2xl font-medium tracking-tight">Projects</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <Card key={`${project.title}-${i}`}>
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
                      className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              {project.link && (
                <a
                  href={project.link.href}
                  className="mt-3 inline-block text-sm underline underline-offset-3 hover:text-accent-foreground"
                >
                  {project.link.label}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
