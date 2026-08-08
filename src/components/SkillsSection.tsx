import { Badge } from '@/components/ui/badge'

interface SkillGroup {
  label: string
  skills: string[]
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    label: 'Languages',
    skills: [
      'Groovy / Grails',
      'Python (OpenCV)',
      'MySQL',
      'React JS',
      'Angular JS',
      'HTML/CSS',
      'Java',
      'MATLAB',
    ],
  },
  {
    label: 'Other',
    skills: [
      'AI Coding',
      'Scrum Dev Cycle',
      'Data Modeling',
      'Image/Signal Processing',
      'Postman Expert',
      'Jira & Confluence',
      'GitHub',
    ],
  },
  {
    label: 'API Experience',
    skills: [
      'OAuth1 and OAuth2',
      'Amazon (Ads)',
      'Box',
      'Dropbox',
      'Facebook Graph/Marketing',
      'Google Drive',
      'HubSpot',
      'Instagram',
      'Intercom',
      'JW Player',
      'MailChimp/Mandrill',
      'Pinterest (Ads)',
      'Salesforce',
      'Slack',
      'Snapchat (Ads)',
      'Spotify (Ads)',
      'TikTok (Ads)',
      'Twitter (Ads)',
      'VidMob',
      'Vimeo',
    ],
  },
]

export function SkillsSection() {
  return (
    <section id="skills">
      <h2 className="mb-2 text-2xl font-medium tracking-tight">Skills</h2>
      <dl className="flex flex-col gap-6 border-t border-border pt-6">
        {SKILL_GROUPS.map((group) => (
          <div key={group.label}>
            <dt className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">
              {group.label}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="h-auto px-2.5 py-1 text-sm font-normal"
                >
                  {skill}
                </Badge>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
