import './Contact.css'

const contactLinks = [
  {
    label: 'Email',
    value: 'hello@yourdomain.dev',
    href: 'mailto:hello@yourdomain.dev',
    note: 'Für Anfragen, Projekte und Interviews',
  },
  {
    label: 'GitHub',
    value: 'github.com/FremdTon90',
    href: 'https://github.com/FremdTon90',
    note: 'Code, Experimente und Projektstruktur',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/your-profile',
    href: 'https://www.linkedin.com/in/your-profile',
    note: 'Berufliches Profil und Netzwerk',
  },
]

const signalItems = [
  'Available for frontend / fullstack roles',
  'Strong in visual systems and interaction',
]

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact-bg contact-bg--one" />
      <div className="contact-bg contact-bg--two" />

      <div className="contact-inner">
        <div className="contact-copy">
          <span className="section-kicker">Contact</span>

          <h2>
            Let’s build something
            <span> that leaves an impression.</span>
          </h2>

          <p className="contact-lead">
            I’m looking for frontend and fullstack roles where UI quality,
            interaction and technical depth actually matter.
          </p>

          <div className="contact-actions">
            <a className="contact-button contact-button--primary" href="mailto:hello@yourdomain.dev">
              Start a conversation
            </a>

            <a
              className="contact-button contact-button--ghost"
              href="/cv.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Open CV
            </a>
          </div>

          <div className="contact-signals">
            {signalItems.map((item) => (
              <div className="contact-signal" key={item}>
                <span className="contact-signal__dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-panel">
          <div className="contact-panel__header">
            <span className="contact-panel__eyebrow">Open channel</span>
            <span className="contact-panel__pulse" />
          </div>

          <div className="contact-card-grid">
            {contactLinks.map((item) => (
              <a
                className="contact-card"
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
              >
                <span className="contact-card__label">{item.label}</span>
                <strong className="contact-card__value">{item.value}</strong>
                <span className="contact-card__note">{item.note}</span>
              </a>
            ))}
          </div>

          <div className="contact-status">
            <div className="contact-status__block">
              <span className="contact-status__label">Focus</span>
              <strong>Frontend / Fullstack Interfaces</strong>
            </div>

            <div className="contact-status__block">
              <span className="contact-status__label">Profile</span>
              <strong>Code + Design + CAD + Creative Tech</strong>
            </div>

            <div className="contact-status__block">
              <span className="contact-status__label">Preferred work</span>
              <strong>Products with visual ambition</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}