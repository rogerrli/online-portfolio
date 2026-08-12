import { Badge } from '@/components/ui/badge'

const PRACTICES = [
  'Claude Code',
  'Cursor',
  'Git Worktrees',
  'Custom Skills',
  'Scheduled Routines',
  'Agent Orchestration',
]

export function WorkingWithAiSection() {
  return (
    <section id="working-with-ai">
      <h2 className="mb-2 text-2xl font-medium tracking-tight">Working with AI</h2>
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <p className="max-w-[60ch]">
          AI is part of how I build software day to day, not just a talking
          point &mdash; this site itself, including this section, was built
          collaboratively with Claude Code. The commit history&rsquo;s public
          on{' '}
          <a
            href="https://github.com/rogerrli/online-portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-3 hover:text-accent-text"
          >
            GitHub
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          .
        </p>
        <p className="max-w-[60ch] text-muted-foreground">
          In practice that means running several Claude Code sessions in
          parallel, each on its own git worktree, working separate issues
          without stepping on each other. I write custom Claude Code skills
          to package up recurring workflows, set up scheduled routines for
          tasks that shouldn&rsquo;t need a manual kickoff, and spend real
          time on how a fleet of agents gets organized and handed off
          between &mdash; not just what one agent can do in isolation.
        </p>
        <ul aria-label="AI tools and practices" className="flex flex-wrap gap-2">
          {PRACTICES.map((practice) => (
            <li key={practice}>
              <Badge
                variant="secondary"
                className="h-auto px-2.5 py-1 text-sm font-normal"
              >
                {practice}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
