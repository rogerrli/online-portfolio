import './App.css'

const EXPERIENCE = [
  'Senior Software Engineer',
  'Product Manager',
  'Product Manager',
  'Solution Engineer',
  'Full Stack Engineer',
  'Integration Engineer',
  'Bioengineer',
  'Research Assistant',
]

function App() {
  return (
    <>
      <header className="site-header">
        <span className="site-title">Roger Li</span>
        <nav aria-label="Primary">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
        </nav>
      </header>

      <main>
        <section id="about" className="about">
          <h1>Hi, I&rsquo;m Roger &mdash; a software engineer.</h1>
          <p>
            I consider myself a jack of all trades. Primarily focused on
            software engineering, I enjoy meshing the technical with the
            non-technical, identifying solutions and delivering results.
          </p>
          <dl className="about-meta">
            <div>
              <dt>Location</dt>
              <dd>Brooklyn, New York &middot; open to remote</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href="mailto:li.rojie@gmail.com">li.rojie@gmail.com</a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href="tel:+17342331177">734-233-1177</a>
              </dd>
            </div>
          </dl>
        </section>

        <section id="experience" className="experience">
          <h2>Experience</h2>
          <ol>
            {EXPERIENCE.map((title, i) => (
              <li key={`${title}-${i}`}>{title}</li>
            ))}
          </ol>
        </section>
      </main>
    </>
  )
}

export default App
