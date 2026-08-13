import { Section } from '@/components/Section'
import { cn, LABEL_CLASS } from '@/lib/utils'

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
    <Section id="beyond-work" title="Beyond Work">
      <dl className="flex flex-col gap-6 border-t border-border pt-6">
        {INTERESTS.map((interest) => (
          <div key={interest.label}>
            <dt className={cn('mb-1', LABEL_CLASS)}>
              <span aria-hidden="true">{interest.emoji}</span> {interest.label}
            </dt>
            <dd className="max-w-[60ch]">{interest.description}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
