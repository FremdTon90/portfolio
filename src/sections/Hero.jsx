import { useEffect, useMemo, useRef, useState } from 'react'
import SpiderHeroScene from './SpiderHeroScene'
import './Hero.css'

const BUTTON_TARGET_CONFIG = {
  idle: {
    x: -0.35,
    y: -0.15,
  },

  quickfacts: {
    offsetX: 0.05,
    offsetY: 0.42,
  },

  skills: {
    offsetX: 0.05,
    offsetY: 0.25,
  },

  projects: {
    offsetX: 0.1,
    offsetY: 0.11,
  },

  showcase: {
    offsetX: 0.1,
    offsetY: 0.05,
  },

  contact: {
    offsetX: 0.1,
    offsetY: -0.1,
  },
}

const sectionLinks = [
  {
    id: 'hero-link-0',
    key: 'quickfacts',
    label: 'Quick Facts',
    href: '#quickfacts',
    primary: true,
  },
  {
    id: 'hero-link-1',
    key: 'skills',
    label: 'Skills',
    href: '#skills',
  },
  {
    id: 'hero-link-2',
    key: 'projects',
    label: 'Projects',
    href: '#projects',
  },
  {
    id: 'hero-link-3',
    key: 'showcase',
    label: 'Showcase',
    href: '#showcase',
  },
  {
    id: 'hero-link-4',
    key: 'contact',
    label: 'Kontakt',
    href: '#contact',
  },
]

const HOME_INTERACTION = {
  mode: 'idle',
  x: BUTTON_TARGET_CONFIG.idle.x,
  y: BUTTON_TARGET_CONFIG.idle.y,
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

function getButtonTarget(link, element) {
  const center = getElementCenterNormalized(element)
  const config = BUTTON_TARGET_CONFIG[link.key] || { offsetX: 0, offsetY: 0 }

  return {
    x: clamp(center.x + (config.offsetX ?? 0), -1, 1),
    y: clamp(center.y + (config.offsetY ?? 0), -1, 1),
  }
}

export default function Hero() {
  const buttonRefs = useRef(new Map())
  const interactionRef = useRef(HOME_INTERACTION)
  const animationTimeoutsRef = useRef([])
  const hoveredButtonIdRef = useRef(null)
  const lastHoveredButtonIdRef = useRef(null)

  const [sceneReady, setSceneReady] = useState(false)
  const [isAnimatingPress, setIsAnimatingPress] = useState(false)
  const [pressedButtonId, setPressedButtonId] = useState(null)

  const linksWithIds = useMemo(() => sectionLinks, [])

  useEffect(() => {
    interactionRef.current = {
      ...HOME_INTERACTION,
      changedAt: performance.now(),
    }

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

  const aimSpiderAtButton = (link, mode = 'hovering') => {
    const buttonElement = buttonRefs.current.get(link.id)

    if (!buttonElement) return

    const normalized = getButtonTarget(link, buttonElement)

    interactionRef.current = {
      mode,
      x: normalized.x,
      y: normalized.y,
      press: 0,
      changedAt: performance.now(),
    }
  }

  const resetSpiderToIdle = () => {
    interactionRef.current = {
      mode: 'idle',
      x: BUTTON_TARGET_CONFIG.idle.x,
      y: BUTTON_TARGET_CONFIG.idle.y,
      press: 0,
      changedAt: performance.now(),
    }
  }

  const getLinkById = (buttonId) => {
    return linksWithIds.find((link) => link.id === buttonId) || null
  }

  const handleButtonEnter = (link) => {
    hoveredButtonIdRef.current = link.id
    lastHoveredButtonIdRef.current = link.id

    if (isAnimatingPress) return

    aimSpiderAtButton(link, 'hovering')
  }

  const handleButtonLeave = (buttonId) => {
    if (hoveredButtonIdRef.current === buttonId) {
      hoveredButtonIdRef.current = null
    }
  }

  const handleButtonColumnLeave = () => {
    hoveredButtonIdRef.current = null

    if (isAnimatingPress) return

    const lastHoveredButtonId = lastHoveredButtonIdRef.current
    const lastHoveredLink = lastHoveredButtonId ? getLinkById(lastHoveredButtonId) : null

    if (lastHoveredLink) {
      aimSpiderAtButton(lastHoveredLink, 'hovering')
      return
    }

    resetSpiderToIdle()
  }

  const handleHeroStageLeave = () => {
    hoveredButtonIdRef.current = null
    lastHoveredButtonIdRef.current = null

    if (isAnimatingPress) return

    resetSpiderToIdle()
  }

  const triggerSpiderPress = (href, link) => {
    const buttonElement = buttonRefs.current.get(link.id)

    if (!buttonElement) {
      runNavigation(href)
      return
    }

    const normalized = getButtonTarget(link, buttonElement)

    clearAnimationTimeouts()
    setIsAnimatingPress(true)
    setPressedButtonId(link.id)
    hoveredButtonIdRef.current = link.id
    lastHoveredButtonIdRef.current = link.id

    interactionRef.current = {
      mode: 'hovering',
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
      }, 120)
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
      }, 420)
    )

    animationTimeoutsRef.current.push(
      window.setTimeout(() => {
        const hoveredButtonId = hoveredButtonIdRef.current
        const lastHoveredButtonId = lastHoveredButtonIdRef.current

        const hoveredLink = hoveredButtonId ? getLinkById(hoveredButtonId) : null
        const lastHoveredLink = lastHoveredButtonId ? getLinkById(lastHoveredButtonId) : null

        if (hoveredLink) {
          aimSpiderAtButton(hoveredLink, 'hovering')
        } else if (lastHoveredLink) {
          aimSpiderAtButton(lastHoveredLink, 'hovering')
        } else {
          resetSpiderToIdle()
        }

        setIsAnimatingPress(false)
        setPressedButtonId(null)
        runNavigation(href)
      }, 760)
    )
  }

  const handleButtonClick = (event, link) => {
    event.preventDefault()

    if (isAnimatingPress) return

    triggerSpiderPress(link.href, link)
  }

  return (
    <section className="hero" id="hero">
      <div className="hero-inner">
        <div className="hero-badge-row">
          <span className="hero-badge">Available for work</span>
          <span className="hero-badge">Frontend + Fullstack</span>
          <span className="hero-badge">CAD + Creative Tech</span>
        </div>

        <div className="hero-stage" onMouseLeave={handleHeroStageLeave}>
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
            <div className="hero-button-column" onMouseLeave={handleButtonColumnLeave}>
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
                    onMouseEnter={() => handleButtonEnter(link)}
                    onMouseLeave={() => handleButtonLeave(link.id)}
                    onFocus={() => handleButtonEnter(link)}
                    onBlur={() => handleButtonLeave(link.id)}
                    onClick={(event) => handleButtonClick(event, link)}
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