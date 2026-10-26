import resume from '../../public/resume.json'

/**
 * The site's view of public/resume.json, which is the single source of truth
 * for work history. Everything a visitor reads about a role — its title,
 * dates and bullets — is derived here rather than retyped, because the two
 * used to drift: the site said "Certified Scrum Manager" while the resume
 * said "Master", and nothing tied them together.
 *
 * The PDF generator derives the same shapes independently in
 * scripts/generate-resume-pdf.mjs. Sharing that logic would mean teaching the
 * TypeScript build about a .mjs script to deduplicate about fifteen lines of
 * grouping and date formatting, which costs more than it saves. It is the
 * prose that must not drift, and the prose now has one home.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "2023-05-01" into "May 2023". */
function formatDate(iso: string): string {
  const [year, month] = iso.split('-')
  return `${MONTHS[Number(month) - 1]} ${year}`
}

/** An en-dashed range, matching the resume's own date style. */
function formatRange(start: string, end?: string): string {
  return `${formatDate(start)} – ${end ? formatDate(end) : 'Present'}`
}

export interface Role {
  title: string
  dates: string
  /** The role's accomplishments, as the resume states them. */
  highlights: string[]
  /** Short tech/skill tags shown as pills, e.g. ["React", "TypeScript"]. */
  tags?: string[]
}

export interface Employer {
  company: string
  roles: Role[]
  /** The whole stretch at an employer, set only when it holds several roles. */
  span?: string
}

/**
 * Tag pills are the one thing here the resume cannot supply: a one-page PDF
 * has no room for them, so they stay the site's own. Keyed by employer and
 * position; a key that stops matching simply drops that role's pills, which
 * is visible on the page rather than silently wrong.
 */
const TAGS: Record<string, string[]> = {
  'Oscar/Senior Software Engineer': [
    'React', 'TypeScript', 'Tailwind', 'Base UI', 'Jotai', 'Accessibility',
    'Data Viz', 'Reporting', 'Claude Code', 'Cursor', 'Playwright', 'Jest',
  ],
  'Jumbo/Product Manager': ['iOS', 'Analytics', 'Product Strategy', 'A/B Testing'],
  'VidMob/Product Manager': ['Roadmapping', 'Scrum'],
  'VidMob/Solutions Engineer': ['API Design', 'Postman', 'OAuth1/OAuth2', 'Documentation'],
  'VidMob/Full Stack Engineer → Engineering Lead': [
    'React JS', 'Angular JS', 'Groovy/Grails', 'Java', 'MySQL', 'HTML/CSS',
  ],
  'Epic Systems/Integration Engineer': [
    'Client Implementation', 'Healthcare IT', 'Configuration', 'Project Management',
  ],
  'Healmet/Bioengineer': ['Signal Processing', 'Hardware Prototyping', 'EKG'],
  'University Hospitals Cleveland Medical Center/Research Assistant': [
    'Image Processing', 'OCT Imaging',
  ],
}

if (import.meta.env.DEV) {
  // The tag map is the one hand-maintained link left between the site and the
  // resume, so a renamed position would quietly drop that role's pills.
  const roles = new Set(resume.work.map((job) => `${job.name}/${job.position}`))
  for (const key of Object.keys(TAGS)) {
    if (!roles.has(key)) {
      console.warn(`[resume] TAGS key matches no role in resume.json: "${key}"`)
    }
  }
}

type Job = (typeof resume.work)[number]

const toRole = (job: Job): Role => ({
  title: job.position,
  dates: formatRange(job.startDate, job.endDate),
  highlights: job.highlights,
  tags: TAGS[`${job.name}/${job.position}`],
})

/**
 * Groups consecutive roles at the same employer, so a stretch like VidMob
 * reads as one job rather than three. Consecutive rather than global, because
 * the list is chronological and a return to a former employer years later is
 * a separate stretch.
 */
function groupByEmployer(work: readonly Job[]): Job[][] {
  const groups: Job[][] = []
  for (const job of work) {
    const last = groups.at(-1)
    if (last && last[0].name === job.name) last.push(job)
    else groups.push([job])
  }
  return groups
}

export const EXPERIENCE: Employer[] = groupByEmployer(resume.work).map((jobs) => ({
  company: jobs[0].name,
  roles: jobs.map(toRole),
  // Several roles at one employer share a heading carrying the whole stretch,
  // from the oldest role's start to the newest role's end. The list runs
  // newest-first, so the oldest role is the last one in the group.
  span:
    jobs.length > 1
      ? formatRange(jobs[jobs.length - 1].startDate, jobs[0].endDate)
      : undefined,
}))

export const EDUCATION = resume.education.map((entry) => ({
  degree: [entry.studyType, entry.area].filter(Boolean).join(' '),
  institution: entry.institution,
  dates: formatRange(entry.startDate, entry.endDate),
}))

export const CERTIFICATES = resume.certificates.map((entry) => entry.name)
