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

const SPIDER_PRESS_ANIMATION = {
  startDelay: 750,
  totalDuration: 1500,
  windupDuration: 520,
  travelDuration: 360,
  impactDuration: 130,
  releaseDuration: 250,
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3)
}

function easeInCubic(value) {
  return value * value * value
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
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

export default function Hero({ onNavigationStart, onSceneReady }) {
  const buttonRefs = useRef(new Map())
  const interactionRef = useRef(HOME_INTERACTION)
  const hoveredButtonIdRef = useRef(null)
  const lastHoveredButtonIdRef = useRef(null)

  const pressAnimationFrameRef = useRef(null)
  const pressAnimationStateRef = useRef(null)

  const [sceneReady, setSceneReady] = useState(false)
  const [isAnimatingPress, setIsAnimatingPress] = useState(false)
  const [impactButtonId, setImpactButtonId] = useState(null)
  const [pressPhase, setPressPhase] = useState('idle')

  const linksWithIds = useMemo(() => sectionLinks, [])

  useEffect(() => {
    interactionRef.current = {
      ...HOME_INTERACTION,
      changedAt: performance.now(),
    }

    return () => {
      if (pressAnimationFrameRef.current) {
        window.cancelAnimationFrame(pressAnimationFrameRef.current)
      }
    }
  }, [])

  const runNavigation = (href) => {
    onNavigationStart?.()

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.querySelector(href)

        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      })
    })
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

  const stopPressAnimation = () => {
    if (pressAnimationFrameRef.current) {
      window.cancelAnimationFrame(pressAnimationFrameRef.current)
      pressAnimationFrameRef.current = null
    }

    pressAnimationStateRef.current = null
  }

  const finishPressAnimation = () => {
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
    setImpactButtonId(null)
    setPressPhase('idle')

    const pendingHref = pressAnimationStateRef.current?.href || null
    stopPressAnimation()

    if (pendingHref) {
      runNavigation(pendingHref)
    }
  }

  const animateSpiderPressFrame = (now) => {
    const state = pressAnimationStateRef.current

    if (!state) return

    const delayedElapsed = now - state.startedAt - SPIDER_PRESS_ANIMATION.startDelay

    if (delayedElapsed < 0) {
      interactionRef.current = {
        mode: 'hovering',
        x: state.target.x,
        y: state.target.y,
        press: 0,
        changedAt: now,
      }

      if (pressPhase !== 'delay') {
        setPressPhase('delay')
      }

      if (impactButtonId) {
        setImpactButtonId(null)
      }

      pressAnimationFrameRef.current = window.requestAnimationFrame(animateSpiderPressFrame)
      return
    }

    const elapsed = delayedElapsed
    const total = SPIDER_PRESS_ANIMATION.totalDuration

    const windupEnd = SPIDER_PRESS_ANIMATION.windupDuration
    const travelEnd = windupEnd + SPIDER_PRESS_ANIMATION.travelDuration
    const impactEnd = travelEnd + SPIDER_PRESS_ANIMATION.impactDuration
    const releaseEnd = impactEnd + SPIDER_PRESS_ANIMATION.releaseDuration

    let mode = 'hovering'
    let press = 0
    let nextPhase = 'aiming'
    let shouldImpact = false

    if (elapsed <= windupEnd) {
      mode = 'hovering'
      press = 0
      nextPhase = 'windup'

      interactionRef.current = {
        mode,
        x: state.target.x,
        y: state.target.y,
        press,
        changedAt: now,
      }
    } else if (elapsed <= travelEnd) {
      const t = clamp((elapsed - windupEnd) / SPIDER_PRESS_ANIMATION.travelDuration, 0, 1)
      mode = 'pressing'
      press = 0.12 + 0.88 * easeInCubic(t)
      nextPhase = 'travel'

      interactionRef.current = {
        mode,
        x: state.target.x,
        y: state.target.y,
        press,
        changedAt: now,
      }
    } else if (elapsed <= impactEnd) {
      const t = clamp((elapsed - travelEnd) / SPIDER_PRESS_ANIMATION.impactDuration, 0, 1)
      mode = 'pressing'
      press = 1
      nextPhase = 'impact'
      shouldImpact = t >= 0.08 && t <= 0.92

      interactionRef.current = {
        mode,
        x: state.target.x,
        y: state.target.y,
        press,
        changedAt: now,
      }
    } else if (elapsed <= releaseEnd) {
      const t = clamp((elapsed - impactEnd) / SPIDER_PRESS_ANIMATION.releaseDuration, 0, 1)
      mode = 'returning'
      press = 1 - 0.82 * easeOutCubic(t)
      nextPhase = 'release'

      interactionRef.current = {
        mode,
        x: state.target.x,
        y: state.target.y,
        press,
        changedAt: now,
      }
    } else if (elapsed < total) {
      const t = clamp((elapsed - releaseEnd) / Math.max(total - releaseEnd, 1), 0, 1)
      mode = 'returning'
      press = 0.18 * (1 - easeInOutCubic(t))
      nextPhase = 'settle'

      interactionRef.current = {
        mode,
        x: state.target.x,
        y: state.target.y,
        press,
        changedAt: now,
      }
    } else {
      finishPressAnimation()
      return
    }

    if (nextPhase !== pressPhase) {
      setPressPhase(nextPhase)
    }

    if (shouldImpact) {
      if (impactButtonId !== state.buttonId) {
        setImpactButtonId(state.buttonId)
      }
    } else if (impactButtonId) {
      setImpactButtonId(null)
    }

    pressAnimationFrameRef.current = window.requestAnimationFrame(animateSpiderPressFrame)
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

    stopPressAnimation()
    setIsAnimatingPress(true)
    setImpactButtonId(null)
    setPressPhase('delay')

    hoveredButtonIdRef.current = link.id
    lastHoveredButtonIdRef.current = link.id

    pressAnimationStateRef.current = {
      href,
      buttonId: link.id,
      target: normalized,
      startedAt: performance.now(),
    }

    interactionRef.current = {
      mode: 'hovering',
      x: normalized.x,
      y: normalized.y,
      press: 0,
      changedAt: performance.now(),
    }

    pressAnimationFrameRef.current = window.requestAnimationFrame(animateSpiderPressFrame)
  }

  const handleButtonClick = (event, link) => {
    event.preventDefault()

    if (isAnimatingPress) return

    triggerSpiderPress(link.href, link)
  }

  const handleSceneReady = () => {
    setSceneReady(true)
    onSceneReady?.()
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
                const isImpact = impactButtonId === link.id
                const isTargeted = isAnimatingPress && lastHoveredButtonIdRef.current === link.id

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
                    className={`hero-button${isAnimatingPress ? ' is-busy' : ''}${isTargeted ? ' is-spider-targeted' : ''}${isImpact ? ' is-spider-impact' : ''}${isImpact && pressPhase === 'impact' ? ' is-spider-impact-live' : ''}`}
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
              onReady={handleSceneReady}
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