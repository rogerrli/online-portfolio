interface Interest {
  emoji: string
  label: string
  description: string
}

const INTERESTS: Interest[] = [
  {
    emoji: '🎲',
    label: 'Dungeon Master',
    description:
      "Five or six years running tabletop D&D for the same group. The best campaign was a replay of Final Fantasy X as a D&D game, which worked far better than it had any right to.",
  },
]

export function BeyondWorkSection() {
  return (
    <section id="beyond-work">
      <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">Beyond Work</h2>
      <dl className="flex flex-col gap-6 border-t border-border pt-6">
        {INTERESTS.map((interest) => (
          <div key={interest.label}>
            <dt className="mb-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              <span aria-hidden="true">{interest.emoji}</span> {interest.label}
            </dt>
            <dd className="max-w-[60ch]">{interest.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
