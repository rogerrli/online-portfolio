interface Interest {
  label: string
  description: string
}

const INTERESTS: Interest[] = [
  {
    label: 'Machine Shop',
    description:
      'I like building things with my hands, too — I keep a small home machine shop for personal projects.',
  },
  {
    label: 'Dungeon Master',
    description:
      "I've run tabletop D&D campaigns for years — different medium, same instinct for building systems people want to explore.",
  },
]

export function BeyondWorkSection() {
  return (
    <section id="beyond-work">
      <h2 className="mb-2 text-2xl font-medium tracking-tight">Beyond Work</h2>
      <dl className="flex flex-col gap-6 border-t border-border pt-6">
        {INTERESTS.map((interest) => (
          <div key={interest.label}>
            <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
              {interest.label}
            </dt>
            <dd className="max-w-[60ch]">{interest.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
