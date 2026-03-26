import { useEffect, useMemo, useRef, useState } from 'react'
import SpiderHeroScene from './SpiderHeroScene'
import './Hero.css'

const sectionLinks = [
  { label: 'Quick Facts', href: '#quickfacts', primary: true },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Kontakt', href: '#contact' },
]

const HOME_INTERACTION = {
  mode: 'idle',
  x: 0,
  y: 0,
  press: 0,
  changedAt: 0,
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getElementCenterNormalized(element) {
  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width * 0.5
  const centerY = rect.top + rect.height * 0.5

  return {
    x: clamp((centerX / window.innerWidth) * 2 - 1, -1, 1),
    y: clamp(-((centerY / window.innerHeight) * 2 - 1), -1, 1),
  }
}

export default function Hero() {
  const buttonRefs = useRef(new Map())
  const interactionRef = useRef(HOME_INTERACTION)
  const animationTimeoutsRef = useRef([])

  const [sceneReady, setSceneReady] = useState(false)
  const [isAnimatingPress, setIsAnimatingPress] = useState(false)
  const [pressedButtonId, setPressedButtonId] = useState(null)

  const linksWithIds = useMemo(
    () =>
      sectionLinks.map((link, index) => ({
        ...link,
        id: `hero-link-${index}`,
      })),
    []
  )

  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  const clearAnimationTimeouts = () => {
    animationTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    animationTimeoutsRef.current = []
  }

  const runNavigation = (href) => {
    const target = document.querySelector(href)

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      window.history.replaceState(null, '', href)
      return
    }

    window.location.hash = href
  }

  const triggerSpiderPress = (href, buttonId) => {
    const buttonElement = buttonRefs.current.get(buttonId)

    if (!buttonElement) {
      runNavigation(href)
      return
    }

    const normalized = getElementCenterNormalized(buttonElement)

    clearAnimationTimeouts()
    setIsAnimatingPress(true)
    setPressedButtonId(buttonId)

    interactionRef.current = {
      mode: 'moving',
      x: normalized.x,
      y: normalized.y,
      press: 0,
      changedAt: performance.now(),
    }

    animationTimeoutsRef.current.push(
      window.setTimeout(() => {
        interactionRef.current = {
          mode: 'pressing',
          x: normalized.x,
          y: normalized.y,
          press: 1,
          changedAt: performance.now(),
        }
      }, 430)
    )

    animationTimeoutsRef.current.push(
      window.setTimeout(() => {
        interactionRef.current = {
          mode: 'returning',
          x: normalized.x,
          y: normalized.y,
          press: 0,
          changedAt: performance.now(),
        }
        setPressedButtonId(null)
      }, 840)
    )

    animationTimeoutsRef.current.push(
      window.setTimeout(() => {
        interactionRef.current = {
          ...HOME_INTERACTION,
          changedAt: performance.now(),
        }
        setIsAnimatingPress(false)
        setPressedButtonId(null)
        runNavigation(href)
      }, 1320)
    )
  }

  const handleButtonClick = (event, href, buttonId) => {
    event.preventDefault()

    if (isAnimatingPress) return

    triggerSpiderPress(href, buttonId)
  }

  return (
    <section className="hero" id="hero">
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

          <div className="hero-action-panel">
            <div className="hero-button-column">
              {linksWithIds.map((link) => {
                const isPressed = pressedButtonId === link.id

                return (
                  <a
                    key={link.id}
                    ref={(element) => {
                      if (element) {
                        buttonRefs.current.set(link.id, element)
                      } else {
                        buttonRefs.current.delete(link.id)
                      }
                    }}
                    className={`hero-button${link.primary ? ' primary' : ''}${isAnimatingPress ? ' is-busy' : ''}${isPressed ? ' is-spider-pressing' : ''}`}
                    href={link.href}
                    onClick={(event) => handleButtonClick(event, link.href, link.id)}
                  >
                    <span className="hero-button-label">{link.label}</span>
                  </a>
                )
              })}
            </div>
          </div>

          <div className={`hero-spider-wrap${sceneReady ? ' is-ready' : ''}`}>
            <SpiderHeroScene
              interactionRef={interactionRef}
              onReady={() => setSceneReady(true)}
            />
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