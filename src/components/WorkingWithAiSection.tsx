export function WorkingWithAiSection() {
  return (
    <section id="working-with-ai">
      <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">Working with AI</h2>
      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <p className="max-w-[60ch]">
          AI is part of how I build software day to day. This site is the
          easiest thing to point at: it was built with Claude Code, and the
          commit history is public on{' '}
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
          In practice that means three to five Claude Code sessions running
          at once, each on its own git worktree, working separate issues
          without stepping on each other. Complexity sets that number, not
          ambition. I write custom skills for the parts that repeat: one
          keeps an issue, its worktree, its branch, and its PR linked as a
          single piece of work across every tool involved. Scheduled
          routines clean up stale worktrees and sessions without me asking.
          Most of my time goes to how a fleet of agents gets organized and
          how work is handed between them, which is a different problem
          from making any one agent smarter.
        </p>
      </div>
    </section>
  )
}
