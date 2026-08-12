import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
]

const API_EXPERIENCE_PREVIEW = [
  'OAuth1 and OAuth2',
  'Facebook Graph/Marketing',
  'Salesforce',
  'Slack',
  'HubSpot',
  'VidMob',
]

const API_EXPERIENCE_REST = [
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

  return (
    <section id="skills">
      <h2 className="mb-2 font-heading text-2xl font-medium tracking-tight">Skills</h2>
      <dl className="flex flex-col gap-6 border-t border-border pt-6">
        {SKILL_GROUPS.map((group) => (
          <div key={group.label}>
            <dt className="mb-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {group.label}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </dd>
          </div>
        ))}
        <div>
          <dt className="mb-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            API Experience
          </dt>
          <dd className="flex flex-wrap items-center gap-2">
            {API_EXPERIENCE_PREVIEW.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
            {apiExpanded &&
              API_EXPERIENCE_REST.map((skill) => (
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
              {apiExpanded ? 'Show less' : `+${API_EXPERIENCE_REST.length} more`}
            </Button>
          </dd>
        </div>
      </dl>
    </section>
  )
}
