import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/Section'
import { cn, LABEL_CLASS } from '@/lib/utils'

interface SkillGroup {
  label: string
  skills: string[]
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    label: 'Current Focus',
    skills: ['React JS', 'TypeScript', 'HTML/CSS', 'AI Coding', 'GitHub'],
  },
  {
    label: 'Also Worked With',
    skills: [
      'Python (OpenCV)',
      'MySQL',
      'Java',
      'Angular JS',
      'Groovy / Grails',
      'MATLAB',
      'Data Modeling',
      'Image/Signal Processing',
      'Scrum Dev Cycle',
      'Postman Expert',
      'Jira & Confluence',
    ],
  },
  {
    label: 'Certifications',
    skills: ['Certified Scrum Manager', 'Certified Scrum Product Owner'],
  },
]

// Ordered most-recognizable first; the first API_PREVIEW_COUNT show by
// default and the rest sit behind the "show more" toggle.
const API_EXPERIENCE = [
  'OAuth1 and OAuth2',
  'Facebook Graph/Marketing',
  'Salesforce',
  'Slack',
  'HubSpot',
  'VidMob',
  'Amazon (Ads)',
  'Box',
  'Dropbox',
  'Google Drive',
  'Instagram',
  'Intercom',
  'JW Player',
  'MailChimp/Mandrill',
  'Pinterest (Ads)',
  'Snapchat (Ads)',
  'Spotify (Ads)',
  'TikTok (Ads)',
  'Twitter (Ads)',
  'Vimeo',
]

const API_PREVIEW_COUNT = 6

function SkillBadge({ skill }: { skill: string }) {
  return (
    <Badge
      variant="secondary"
      className="h-auto px-2.5 py-1 font-mono text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {skill}
    </Badge>
  )
}

export function SkillsSection() {
  const [apiExpanded, setApiExpanded] = useState(false)
  const visibleApis = apiExpanded
    ? API_EXPERIENCE
    : API_EXPERIENCE.slice(0, API_PREVIEW_COUNT)

  return (
    <Section id="skills" title="Skills">
      <dl className="flex flex-col gap-6 border-t border-border pt-6">
        {SKILL_GROUPS.map((group) => (
          <div key={group.label}>
            <dt className={cn('mb-2', LABEL_CLASS)}>{group.label}</dt>
            <dd className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </dd>
          </div>
        ))}
        <div>
          <dt className={cn('mb-2', LABEL_CLASS)}>API Experience</dt>
          <dd className="flex flex-wrap items-center gap-2">
            {visibleApis.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2.5 py-1 text-sm font-normal text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground"
              onClick={() => setApiExpanded((expanded) => !expanded)}
              aria-expanded={apiExpanded}
            >
              {apiExpanded
                ? 'Show less'
                : `+${API_EXPERIENCE.length - API_PREVIEW_COUNT} more`}
            </Button>
          </dd>
        </div>
      </dl>
    </Section>
  )
}
