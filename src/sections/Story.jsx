import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const storySteps = [
  {
    step: '01',
    eyebrow: 'Frontend first',
    title: 'Frontend ist mein Kern.',
    text:
      'Ich liebe Frontend, weil hier Technik, Design und Nutzererlebnis direkt zusammenkommen. Gute Interfaces sollen nicht nur funktionieren, sondern spürbar wirken.',
    tags: ['React', 'UI Systems', 'Motion', 'UX Thinking'],
  },
  {
    step: '02',
    eyebrow: 'Visual + technical',
    title: 'Ich denke in Bewegung, Raum und Systemen.',
    text:
      'Ich arbeite nicht nur mit Code, sondern denke auch visuell. Animation, Struktur, Rhythmus und Klarheit gehören für mich genauso zum Produkt wie die technische Umsetzung.',
    tags: ['Interaction', 'Structure', 'Visual Thinking', 'Storytelling'],
  },
  {
    step: '03',
    eyebrow: 'Beyond classic web',
    title: 'CAD, Design und Creative Tech machen mein Profil besonders.',
    text:
      'Meine Stärke ist die Mischung aus Frontend, Designverständnis und technischem Breitenwissen. Dadurch entstehen Lösungen, die nicht nach Standardkasten aussehen.',
    tags: ['CAD', 'Creative Tech', 'Design', 'Allrounder Mindset'],
  },
]

export default function Story() {
  const sectionRef = useRef(null)
  const panelRef = useRef(null)
  const progressFillRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const panel = panelRef.current
    const fill = progressFillRef.current

    if (!section || !panel || !fill) {
      return undefined
    }

    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px)', () => {
      const ctx = gsap.context(() => {
        gsap.set(panel, {
          opacity: 0,
          y: 40,
          scale: 0.96,
        })

        gsap.to(panel, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
          },
        })

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=2200',
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            const progress = self.progress
            let nextStep = 0

            if (progress >= 0.66) {
              nextStep = 2
            } else if (progress >= 0.33) {
              nextStep = 1
            }

            setActiveStep((prev) => (prev !== nextStep ? nextStep : prev))

            gsap.to(fill, {
              height: `${Math.max(progress * 100, 6)}%`,
              duration: 0.18,
              ease: 'none',
              overwrite: 'auto',
            })

            gsap.to(panel, {
              rotateX: -4 + progress * 8,
              rotateY: -8 + progress * 16,
              y: progress * -14,
              duration: 0.2,
              ease: 'none',
              overwrite: 'auto',
            })
          },
        })
      }, section)

      return () => ctx.revert()
    })

    mm.add('(max-width: 900px)', () => {
      const ctx = gsap.context(() => {
        gsap.set(panel, {
          opacity: 0,
          y: 30,
        })

        gsap.to(panel, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
          },
        })
      }, section)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  const current = storySteps[activeStep]

  return (
    <section ref={sectionRef} className="story-section">
      <span className="section-label">Story</span>

      <div className="story-layout">
        <div className="story-left">
          <div className="story-progress">
            <div className="story-progress-track">
              <div ref={progressFillRef} className="story-progress-fill" />
            </div>

            <div className="story-progress-steps">
              {storySteps.map((item, index) => (
                <button
                  key={item.step}
                  type="button"
                  className={`story-step-button ${activeStep === index ? 'active' : ''}`}
                  onClick={() => setActiveStep(index)}
                >
                  <span className="story-step-number">{item.step}</span>
                  <span className="story-step-copy">
                    <span className="story-step-eyebrow">{item.eyebrow}</span>
                    <span className="story-step-title">{item.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="story-right">
          <div ref={panelRef} className="story-panel">
            <div className="story-panel-grid" />
            <div className="story-panel-glow one" />
            <div className="story-panel-glow two" />

            <div className="story-panel-header">
              <span className="story-panel-kicker">Digital profile</span>
              <span className="story-panel-status">Live</span>
            </div>

            <div className="story-avatar-shell">
              <div className="story-avatar-ring ring-one" />
              <div className="story-avatar-ring ring-two" />
              <div className="story-avatar-core">
                <span>{current.step}</span>
              </div>
            </div>

            <div className="story-panel-copy">
              <p className="story-panel-eyebrow">{current.eyebrow}</p>
              <h3>{current.title}</h3>
              <p>{current.text}</p>

              <div className="story-tags">
                {current.tags.map((tag) => (
                  <span key={tag} className="story-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="story-panel-footer">
              <span>Profile signal</span>
              <span>{current.step} / 03</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}