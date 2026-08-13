import { ExternalLink } from '@/components/ExternalLink'
import { Section } from '@/components/Section'
import { LINK_CLASS } from '@/lib/utils'

export function WorkingWithAiSection() {
  return (
    <Section id="working-with-ai" title="Working with AI">
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <p className="max-w-[60ch]">
          AI is part of how I build software day to day, not just a talking
          point &mdash; this site itself, including this section, was built
          collaboratively with Claude Code. The commit history&rsquo;s public
          on{' '}
          <ExternalLink
            href="https://github.com/rogerrli/online-portfolio"
            className={LINK_CLASS}
          >
            GitHub
          </ExternalLink>
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
      </div>
    </Section>
  )
}
