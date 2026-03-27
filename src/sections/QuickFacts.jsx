import './QuickFacts.css'

const quickFactCards = [
  {
    title: 'Frontend + UX',
    text: 'Interfaces mit klarer Dramaturgie, sauberem Aufbau und Interaktion, die nicht zufällig wirkt, sondern geführt.',
  },
  {
    title: 'Fullstack + APIs',
    text: 'Logik, Datenflüsse, Backend-Strukturen und Tools, die nicht nur von vorne gut aussehen, sondern hinten auch nicht brennen.',
  },
  {
    title: '3D + Motion',
    text: 'Realtime-Szenen, inszenierte Übergänge, technische Animation und Interfaces, die sich nach Experience anfühlen.',
  },
  {
    title: 'CAD + Engineering',
    text: 'Technisches Verständnis, Konstruktion, räumliches Denken und Präzision als echter Bonus für digitale Projekte.',
  },
  {
    title: 'Automation',
    text: 'Wiederholbare Prozesse, Integrationen und Systeme, die nervige Arbeit wegräumen und Produktivität sauber erhöhen.',
  },
  {
    title: 'Audio + Creative Tech',
    text: 'Sound, Rhythmus, Timing und Wirkung. Nicht immer sichtbar, aber oft genau der Unterschied zwischen nett und stark.',
  },
  {
    title: 'Systemisches Denken',
    text: 'Ich denke selten nur in Komponenten. Meistens denke ich schon in Verhalten, Abhängigkeiten, Zuständen und Wirkung.',
  },
  {
    title: 'High-End Detailarbeit',
    text: 'Das Ziel ist nicht einfach nur “funktioniert”, sondern “fühlt sich hochwertig an, bevor man es überhaupt erklären muss”.',
  },
]

export default function QuickFacts() {
  return (
    <section
      id="quickfacts"
      className="quickfacts section-shell"
      data-scroll-end-offset="clamp(72px, 10vh, 140px)"
    >
      <div className="quickfacts-shell">
        <div className="quickfacts-hero">
          <span className="section-label">Quick Facts</span>

          <div className="section-copy">
            <h2>Ich baue nicht einfach Webseiten. Ich baue Verhalten.</h2>
            <p>
              Das Ziel ist nicht bloß Information. Das Ziel ist, dass Scroll, Timing,
              Interaktion und Übergänge als zusammenhängende Experience wirken.
            </p>
          </div>
        </div>

        <div className="quickfacts-grid">
          {quickFactCards.map((card) => (
            <article key={card.title} className="quickfact-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>

        <div className="quickfacts-tail">
          <div className="quickfacts-tail__line" />
          <p>
            Genau aus diesem Grund werden Section-Wechsel jetzt nicht mehr einfach
            stumpf durchgescrollt, sondern bewusst aufgebaut.
          </p>
        </div>
      </div>
    </section>
  )
}