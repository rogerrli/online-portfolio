interface Interest {
  emoji: string
  label: string
  description: string
}

const INTERESTS: Interest[] = [
  {
    emoji: '🔧',
    label: 'Machine Shop',
    description:
      'I like building things with my hands, too — I keep a small home machine shop for personal projects.',
  },
  {
    emoji: '🎲',
    label: 'Dungeon Master',
    description:
      "I've run tabletop D&D campaigns for years — different medium, same instinct for building systems people want to explore.",
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
            <dd>{interest.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
