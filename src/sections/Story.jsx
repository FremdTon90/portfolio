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
    modeClass: 'mode-frontend',
    signal: 'Interface focus',
  },
  {
    step: '02',
    eyebrow: 'Visual + technical',
    title: 'Ich denke in Bewegung, Raum und Systemen.',
    text:
      'Ich arbeite nicht nur mit Code, sondern denke auch visuell. Animation, Struktur, Rhythmus und Klarheit gehören für mich genauso zum Produkt wie die technische Umsetzung.',
    tags: ['Interaction', 'Structure', 'Visual Thinking', 'Storytelling'],
    modeClass: 'mode-visual',
    signal: 'Motion logic',
  },
  {
    step: '03',
    eyebrow: 'Beyond classic web',
    title: 'CAD, Design und Creative Tech machen mein Profil besonders.',
    text:
      'Meine Stärke ist die Mischung aus Frontend, Designverständnis und technischem Breitenwissen. Dadurch entstehen Lösungen, die nicht nach Standardkasten aussehen.',
    tags: ['CAD', 'Creative Tech', 'Design', 'Allrounder Mindset'],
    modeClass: 'mode-creative',
    signal: 'Multidisciplinary',
  },
]

export default function Story() {
  const sectionRef = useRef(null)
  const panelRef = useRef(null)
  const progressFillRef = useRef(null)
  const avatarShellRef = useRef(null)
  const avatarHeadRef = useRef(null)
  const avatarGlowRef = useRef(null)
  const ringOneRef = useRef(null)
  const ringTwoRef = useRef(null)
  const ringThreeRef = useRef(null)
  const contentRef = useRef(null)

  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const panel = panelRef.current
    const fill = progressFillRef.current
    const avatarShell = avatarShellRef.current
    const avatarHead = avatarHeadRef.current
    const avatarGlow = avatarGlowRef.current
    const ringOne = ringOneRef.current
    const ringTwo = ringTwoRef.current
    const ringThree = ringThreeRef.current
    const content = contentRef.current

    if (
      !section ||
      !panel ||
      !fill ||
      !avatarShell ||
      !avatarHead ||
      !avatarGlow ||
      !ringOne ||
      !ringTwo ||
      !ringThree ||
      !content
    ) {
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

        gsap.set(fill, {
          height: '6%',
          transformOrigin: 'top center',
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

        gsap.to(ringOne, {
          rotate: 360,
          duration: 18,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(ringTwo, {
          rotate: -360,
          duration: 24,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(ringThree, {
          rotate: 360,
          duration: 30,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(avatarShell, {
          y: -10,
          duration: 2.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })

        gsap.to(avatarGlow, {
          scale: 1.08,
          opacity: 0.95,
          duration: 2.1,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 1.35,
          pinSpacing: true,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = gsap.utils.clamp(0, 1, self.progress)
            let nextStep = 0

            if (progress >= 0.74) {
              nextStep = 2
            } else if (progress >= 0.38) {
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
              rotateX: -2.5 + progress * 5,
              rotateY: -5 + progress * 10,
              y: progress * -10,
              duration: 0.2,
              ease: 'none',
              overwrite: 'auto',
            })

            gsap.to(avatarHead, {
              rotateZ: -1.5 + progress * 3,
              y: -5 + progress * 10,
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

        gsap.set(fill, {
          height: '6%',
          transformOrigin: 'top center',
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

        gsap.to(ringOne, {
          rotate: 360,
          duration: 18,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(ringTwo, {
          rotate: -360,
          duration: 24,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(ringThree, {
          rotate: 360,
          duration: 30,
          ease: 'none',
          repeat: -1,
        })

        gsap.to(avatarShell, {
          y: -8,
          duration: 2.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })

        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = gsap.utils.clamp(0, 1, self.progress)
            let nextStep = 0

            if (progress >= 0.74) {
              nextStep = 2
            } else if (progress >= 0.38) {
              nextStep = 1
            }

            setActiveStep((prev) => (prev !== nextStep ? nextStep : prev))

            gsap.to(fill, {
              height: `${Math.max(progress * 100, 6)}%`,
              duration: 0.18,
              ease: 'none',
              overwrite: 'auto',
            })
          },
        })
      }, section)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  useEffect(() => {
    if (!contentRef.current || !avatarHeadRef.current) {
      return
    }

    gsap.fromTo(
      contentRef.current,
      {
        opacity: 0.45,
        y: 16,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      }
    )

    gsap.fromTo(
      avatarHeadRef.current,
      {
        scale: 0.94,
        opacity: 0.7,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      }
    )
  }, [activeStep])

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
          <div ref={panelRef} className={`story-panel ${current.modeClass}`}>
            <div className="story-panel-grid" />
            <div className="story-panel-scanlines" />
            <div className="story-panel-glow one" />
            <div className="story-panel-glow two" />

            <div className="story-panel-header">
              <span className="story-panel-kicker">Digital guide</span>
              <span className="story-panel-status">Live</span>
            </div>

            <div ref={avatarShellRef} className="story-avatar-shell">
              <div ref={ringOneRef} className="story-avatar-ring ring-one" />
              <div ref={ringTwoRef} className="story-avatar-ring ring-two" />
              <div ref={ringThreeRef} className="story-avatar-ring ring-three" />

              <div ref={avatarGlowRef} className="story-avatar-glow" />

              <div ref={avatarHeadRef} className="story-avatar-figure">
                <div className="story-avatar-halo" />
                <div className="story-avatar-head">
                  <div className="story-avatar-faceplate" />
                  <div className="story-avatar-eye-band" />
                  <div className="story-avatar-eye-glow left" />
                  <div className="story-avatar-eye-glow right" />
                  <div className="story-avatar-mouth-line" />
                </div>
                <div className="story-avatar-neck" />
                <div className="story-avatar-shoulders">
                  <div className="story-avatar-shoulder-line top" />
                  <div className="story-avatar-shoulder-line mid" />
                  <div className="story-avatar-core-badge">{current.step}</div>
                </div>
              </div>
            </div>

            <div ref={contentRef} className="story-panel-copy">
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
              <span>{current.signal}</span>
              <span>{current.step} / 03</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}