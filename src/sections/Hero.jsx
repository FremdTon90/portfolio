import { useEffect, useRef, useState } from 'react'
import SpiderHeroScene from './SpiderHeroScene'
import './Hero.css'

const sectionLinks = [
  { label: 'Quick Facts', href: '#quickfacts', primary: true },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Kontakt', href: '#contact' },
]

export default function Hero() {
  const sectionRef = useRef(null)
  const cursorRef = useRef({ x: 0.12, y: -0.06 })
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const handlePointerMove = (event) => {
      const rect = section.getBoundingClientRect()
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const normalizedY = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

      cursorRef.current = {
        x: Math.max(-0.9, Math.min(0.9, normalizedX)),
        y: Math.max(-0.85, Math.min(0.85, normalizedY)),
      }
    }

    const handlePointerLeave = () => {
      cursorRef.current = { x: 0.12, y: -0.06 }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <section ref={sectionRef} className="hero" id="hero">
      <div className="hero-inner">
        <div className="hero-badge-row">
          <span className="hero-badge">Available for work</span>
          <span className="hero-badge">Frontend + Fullstack</span>
          <span className="hero-badge">CAD + Creative Tech</span>
        </div>

        <div className="hero-stage">
          <div className="hero-bg-title">
            <span className="hero-bg-line">Dustin</span>
            <span className="hero-bg-line">
              builds <span className="hero-title-accent">digital</span>
            </span>
            <span className="hero-bg-line">
              experiences<span className="hero-title-accent">.</span>
            </span>
          </div>

          <div className="hero-button-row">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                className={`hero-button${link.primary ? ' primary' : ''}`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className={`hero-spider-wrap${sceneReady ? ' is-ready' : ''}`}>
            <SpiderHeroScene cursorRef={cursorRef} onReady={() => setSceneReady(true)} />
          </div>

          <p className="hero-subtitle">
            Frontend Developer · CAD Designer · Creative Technologist
          </p>

          <div className="hero-grid-zone" aria-hidden="true">
            <div className="hero-grid-glow" />
            <div className="hero-grid-plane" />
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        <span>Scroll to explore</span>
        <div className="hero-scroll-line" />
      </div>
    </section>
  )
}