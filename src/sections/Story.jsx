import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import StoryScene from './StoryScene'

gsap.registerPlugin(ScrollTrigger)

const storySteps = [
  {
    step: '01',
    eyebrow: 'Frontend + Wirkung',
    title: 'Ich baue Interfaces, die nicht nach Baukasten aussehen.',
    text:
      'Mein Fokus liegt auf Frontend mit Charakter: saubere Struktur, starke Usability und Bewegung, die nicht nervt, sondern erklärt. Kurz gesagt: hübsch reicht nicht, es muss sich auch richtig anfühlen.',
    tags: ['React', 'UX', 'Motion', 'UI Systems'],
    signal: 'Frontend mindset',
    mood: 'frontend',
    spotlight: 'Ich verbinde Designgefühl mit sauberer Umsetzung.',
  },
  {
    step: '02',
    eyebrow: '3D + Kreativtechnik',
    title: 'Ich denke nicht nur in Screens, sondern auch in Raum, Rhythmus und Inszenierung.',
    text:
      'CAD, visuelle Gestaltung und Sounddesign fließen direkt in meine Arbeit ein. Dadurch entstehen digitale Erlebnisse mit mehr Tiefe als ein Standard-Template von der Stange.',
    tags: ['3D', 'CAD', 'Visual Thinking', 'Audio'],
    signal: 'Creative tech',
    mood: 'creative',
    spotlight: 'Technik darf klar sein und trotzdem Eindruck machen.',
  },
  {
    step: '03',
    eyebrow: 'Systeme + Praxis',
    title: 'Ich kombiniere Software, Technikverständnis und echte Hands-on-Praxis.',
    text:
      'Durch Systemintegration, Mechatronik und Entwicklungsarbeit denke ich nicht isoliert im Frontend. Ich verstehe Abläufe, Logik und technische Zusammenhänge — also nicht nur die schöne Fassade, sondern auch das Maschinenhaus dahinter.',
    tags: ['Python', 'Systemintegration', 'Mechatronik', 'Engineering'],
    signal: 'Full spectrum',
    mood: 'engineering',
    spotlight: 'Ich bringe UI, Logik und technische Realität zusammen.',
  },
]

export default function Story() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const stageRef = useRef(null)
  const copyRef = useRef(null)
  const cardRefs = useRef([])
  const bubbleRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)

  const current = useMemo(() => storySteps[activeStep], [activeStep])

  useEffect(() => {
    const section = sectionRef.current
    const header = headerRef.current
    const stage = stageRef.current
    const copy = copyRef.current
    const cards = cardRefs.current.filter(Boolean)
    const bubble = bubbleRef.current

    if (!section || !header || !stage || !copy || !cards.length || !bubble) {
      return undefined
    }

    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px)', () => {
      const ctx = gsap.context(() => {
        gsap.from(header, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
          },
        })

        gsap.from(stage, {
          opacity: 0,
          y: 50,
          scale: 0.96,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
          },
        })

        gsap.to(section.querySelector('.story-ambient--one'), {
          yPercent: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })

        gsap.to(section.querySelector('.story-ambient--two'), {
          yPercent: 10,
          xPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=220%',
          pin: stage,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = gsap.utils.clamp(0, 1, self.progress)
            let next = 0

            if (progress >= 0.68) {
              next = 2
            } else if (progress >= 0.34) {
              next = 1
            }

            setActiveStep((prev) => (prev === next ? prev : next))
          },
        })
      }, section)

      return () => ctx.revert()
    })

    mm.add('(max-width: 900px)', () => {
      const ctx = gsap.context(() => {
        gsap.from([header, stage], {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 84%',
          },
        })

        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
          onUpdate: (self) => {
            const progress = gsap.utils.clamp(0, 1, self.progress)
            let next = 0

            if (progress >= 0.68) {
              next = 2
            } else if (progress >= 0.34) {
              next = 1
            }

            setActiveStep((prev) => (prev === next ? prev : next))
          },
        })
      }, section)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean)
    const bubble = bubbleRef.current
    const copy = copyRef.current

    if (!cards.length || !bubble || !copy) {
      return
    }

    gsap.to(cards, {
      opacity: (index) => (index === activeStep ? 1 : 0.42),
      y: (index) => (index === activeStep ? 0 : 8),
      scale: (index) => (index === activeStep ? 1 : 0.97),
      borderColor: (index) =>
        index === activeStep ? 'rgba(103, 232, 249, 0.35)' : 'rgba(255,255,255,0.08)',
      boxShadow: (index) =>
        index === activeStep
          ? '0 20px 40px rgba(0, 0, 0, 0.22), 0 0 40px rgba(103, 232, 249, 0.08)'
          : '0 12px 24px rgba(0, 0, 0, 0.12)',
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    })

    gsap.fromTo(
      bubble,
      { opacity: 0, y: 14, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power2.out', overwrite: 'auto' }
    )

    gsap.fromTo(
      copy,
      { opacity: 0.55, y: 16 },
      { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out', overwrite: 'auto' }
    )
  }, [activeStep])

  return (
    <section ref={sectionRef} className="story-section" id="story">
      <div className="story-ambient story-ambient--one" />
      <div className="story-ambient story-ambient--two" />

      <div ref={headerRef} className="story-header">
        <span className="section-kicker">Story</span>
        <h2>
          Kein langweiliger Lebenslaufblock.
          <span> Lieber ein Avatar, der kurz übernimmt.</span>
        </h2>
        <p>
          Hier erzählt ein kleiner 3D-Buddy in drei Stationen, wie ich arbeite: visuell,
          technisch und mit einer guten Portion Praxis. Der zeigt sogar auf den Text — ganz ohne
          PowerPoint-Vibes aus 2009.
        </p>
      </div>

      <div ref={stageRef} className="story-stage">
        <div className="story-scene-panel">
          <div ref={bubbleRef} className="story-speech-bubble">
            <span className="story-speech-label">Avatar says</span>
            <p>{current.spotlight}</p>
          </div>

          <div className="story-canvas-wrap">
            <StoryScene activeIndex={activeStep} mood={current.mood} />
          </div>
        </div>

        <div ref={copyRef} className="story-copy-panel">
          <div className="story-copy-topline">
            <span className="story-step-index">{current.step}</span>
            <span className="story-step-signal">{current.signal}</span>
          </div>

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

          <div className="story-card-list">
            {storySteps.map((item, index) => (
              <button
                key={item.step}
                type="button"
                className={`story-card ${index === activeStep ? 'is-active' : ''}`}
                onClick={() => setActiveStep(index)}
                ref={(node) => {
                  cardRefs.current[index] = node
                }}
              >
                <span className="story-card-step">{item.step}</span>
                <span className="story-card-copy">
                  <strong>{item.eyebrow}</strong>
                  <small>{item.title}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}