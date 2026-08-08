import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SkillsSection } from '@/components/SkillsSection'
import { ProjectsSection } from '@/components/ProjectsSection'
import { ContactSection } from '@/components/ContactSection'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Role {
  title: string
  company?: string
  dates: string
  description: string
}

const EXPERIENCE: Role[] = [
  {
    title: 'Senior Software Engineer',
    dates: 'May 2023 to Present',
    description: 'Frontend development in React.js',
  },
  {
    title: 'Product Manager',
    company: 'Jumbo',
    dates: 'May 2022 to May 2023',
    description:
      'Launched multiple features onto iOS and helped transition the product from B2C to B2B2C. Built weekly roadmaps for engineers, and focused on prioritizing protecting user data. High emphasis on analytics to iterate the product to meet our internal KPI goals.',
  },
  {
    title: 'Product Manager',
    company: 'VidMob',
    dates: 'Oct 2020 to Present',
    description:
      "Planned the roadmap for 3 teams, acting as both the product owner and scrum master. Focused on the business' main objectives by collaborating with clients and evaluating data to identify the next best value add to the product. Continued supporting ancillary responsibilities from the previous two roles at the company.",
  },
  {
    title: 'Solution Engineer',
    company: 'VidMob',
    dates: 'Oct 2019 to Oct 2021',
    description:
      'Architected solutions using POCs to help product teams understand cost, risks, and value on prospective new features. Completely transformed the API documentation strategy and set up a public-facing documentation strategy as well. Helped our partnerships team with all things technical when it came to prospecting new integrations.',
  },
  {
    title: 'Full Stack Engineer',
    company: 'VidMob',
    dates: 'May 2017 to Sept 2019',
    description:
      'Architected and executed multiple new features and systems in order to deliver value to our end users. Revamped the entire email notification system, built approximately a dozen integrations to remove manual workflows, and eventually was an engineering team lead.',
  },
  {
    title: 'Integration Engineer',
    company: 'Epic Systems',
    dates: 'Feb 2016 to Nov 2016',
    description:
      'Guided clients implementing new software by recommending specific configurations tailored to their custom needs in order to provide the most value to them by predetermined launch dates. Prioritized work between multiple clients and job responsibilities.',
  },
  {
    title: 'Bioengineer',
    company: 'Healmet',
    dates: 'Aug 2015 to Jan 2016',
    description:
      'Helped plan a prototype for a product that would assist in detecting basic vitals, such as heart rate, oxygen saturation, and EKG (similar to what modern Apple Watches are capable of doing).',
  },
  {
    title: 'Research Assistant',
    company: 'University Hospitals Cleveland Medical Center',
    dates: 'Aug 2013 to May 2015',
    description:
      'Assisted a laboratory focused on OCT imaging of coronary arteries. Helped with managing patient data so that it was handled securely while also improving systems to make keeping track of them more intuitive.',
  },
]

function App() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-border py-6">
        <span className="font-semibold">Roger Li</span>
        <div className="flex items-center gap-6">
          <nav aria-label="Primary" className="flex gap-6">
            <a href="#about" className="text-muted-foreground hover:text-accent-foreground">
              About
            </a>
            <a href="#experience" className="text-muted-foreground hover:text-accent-foreground">
              Experience
            </a>
            <a href="#skills" className="text-muted-foreground hover:text-accent-foreground">
              Skills
            </a>
            <a href="#projects" className="text-muted-foreground hover:text-accent-foreground">
              Projects
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-accent-foreground">
              Contact
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-col gap-16 py-12">
        <section id="about">
          <h1 className="mb-4 text-4xl font-medium tracking-tight text-balance sm:text-5xl">
            Hi, I&rsquo;m Roger &mdash; a software engineer.
          </h1>
          <p className="mb-8 max-w-[60ch] text-muted-foreground">
            I consider myself a jack of all trades. Primarily focused on
            software engineering, I enjoy meshing the technical with the
            non-technical, identifying solutions and delivering results.
          </p>
          <dl className="flex flex-wrap gap-8">
            <div>
              <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
                Location
              </dt>
              <dd>Brooklyn, New York &middot; open to remote</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
                Email
              </dt>
              <dd>
                <a href="mailto:li.rojie@gmail.com" className="underline underline-offset-3 hover:text-accent-foreground">
                  li.rojie@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
                Phone
              </dt>
              <dd>
                <a href="tel:+17342331177" className="underline underline-offset-3 hover:text-accent-foreground">
                  734-233-1177
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section id="experience">
          <h2 className="mb-2 text-2xl font-medium tracking-tight">Experience</h2>
          <Accordion className="border-t border-border">
            {EXPERIENCE.map((role, i) => (
              <AccordionItem key={`${role.title}-${i}`} value={`${role.title}-${i}`}>
                <AccordionTrigger className="py-4 text-base font-medium">
                  <span className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                    <span>{role.title}</span>
                    {role.company && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {role.company}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2 text-sm text-muted-foreground">{role.dates}</p>
                  <p>{role.description}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </>
  )
}

export default App
