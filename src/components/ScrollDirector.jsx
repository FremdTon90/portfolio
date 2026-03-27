import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TransitionLayer from './TransitionLayer'

const NAV_LOCK_DURATION = 1100
const OBSERVER_THRESHOLD = 0.62

const EDGE_TOLERANCE = 8
const ARMING_DISTANCE = 700
const ARMING_RESET_DELAY = 850
const PLAYBACK_DURATION = 1400

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getSectionElement(id) {
  return document.getElementById(id)
}

export default function ScrollDirector({ sections, children }) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null)
  const [transitionState, setTransitionState] = useState({
    active: false,
    phase: 'idle',
    from: null,
    to: null,
    mode: 'idle',
    direction: 'forward',
    progress: 0,
  })

  const lockTimeoutRef = useRef(null)
  const resetTimeoutRef = useRef(null)
  const playbackTimeoutRef = useRef(null)

  const isProgrammaticRef = useRef(false)
  const activeSectionIdRef = useRef(sections[0]?.id ?? null)

  const armingRef = useRef({
    from: null,
    to: null,
    direction: null,
    progress: 0,
  })

  useEffect(() => {
    activeSectionIdRef.current = activeSectionId
  }, [activeSectionId])

  const clearTimers = useCallback(() => {
    if (lockTimeoutRef.current) {
      window.clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }

    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }

    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current)
      playbackTimeoutRef.current = null
    }
  }, [])

  const resetArming = useCallback(() => {
    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }

    armingRef.current = {
      from: null,
      to: null,
      direction: null,
      progress: 0,
    }

    setTransitionState((current) => {
      if (current.phase === 'playback') {
        return current
      }

      return {
        active: false,
        phase: 'idle',
        from: null,
        to: null,
        mode: 'idle',
        direction: 'forward',
        progress: 0,
      }
    })
  }, [])

  const releaseNavigationLock = useCallback(() => {
    isProgrammaticRef.current = false

    if (lockTimeoutRef.current) {
      window.clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }

    if (playbackTimeoutRef.current) {
      window.clearTimeout(playbackTimeoutRef.current)
      playbackTimeoutRef.current = null
    }

    document.documentElement.removeAttribute('data-scroll-director-lock')
    document.body.removeAttribute('data-scroll-director-lock')

    armingRef.current = {
      from: null,
      to: null,
      direction: null,
      progress: 0,
    }

    setTransitionState({
      active: false,
      phase: 'idle',
      from: null,
      to: null,
      mode: 'idle',
      direction: 'forward',
      progress: 0,
    })
  }, [])

  const finalizeNavigation = useCallback(
    (nextSectionId, options = {}) => {
      const target = getSectionElement(nextSectionId)

      if (!target) {
        releaseNavigationLock()
        return false
      }

      const targetTop = Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top))

      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: targetTop,
          behavior: 'auto',
        })

        window.requestAnimationFrame(() => {
          window.scrollTo({
            top: targetTop,
            behavior: 'auto',
          })

          setActiveSectionId(nextSectionId)
        })
      })

      lockTimeoutRef.current = window.setTimeout(() => {
        releaseNavigationLock()
      }, options.lockDuration ?? NAV_LOCK_DURATION)

      return true
    },
    [releaseNavigationLock]
  )

  const navigateToSection = useCallback(
    (nextSectionId, options = {}) => {
      const target = getSectionElement(nextSectionId)

      if (!target) {
        return false
      }

      clearTimers()
      resetArming()

      const fromSectionId = activeSectionIdRef.current
      const mode = options.mode ?? 'navLock'
      const direction = options.direction ?? 'forward'

      isProgrammaticRef.current = true

      setTransitionState({
        active: true,
        phase: 'playback',
        from: fromSectionId,
        to: nextSectionId,
        mode,
        direction,
        progress: 1,
      })

      document.documentElement.setAttribute('data-scroll-director-lock', 'true')
      document.body.setAttribute('data-scroll-director-lock', 'true')

      playbackTimeoutRef.current = window.setTimeout(() => {
        finalizeNavigation(nextSectionId, options)
      }, mode === 'exitIntent' ? PLAYBACK_DURATION : 120)

      return true
    },
    [clearTimers, finalizeNavigation, resetArming]
  )

  const startArming = useCallback(
    ({ from, to, direction, deltaMagnitude }) => {
      const current = armingRef.current
      const sameRoute =
        current.from === from &&
        current.to === to &&
        current.direction === direction

      const nextProgress = clamp(
        (sameRoute ? current.progress : 0) + deltaMagnitude / ARMING_DISTANCE,
        0,
        1
      )

      armingRef.current = {
        from,
        to,
        direction,
        progress: nextProgress,
      }

      setTransitionState({
        active: true,
        phase: 'arming',
        from,
        to,
        mode: 'exitIntent',
        direction,
        progress: nextProgress,
      })

      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current)
      }

      resetTimeoutRef.current = window.setTimeout(() => {
        resetArming()
      }, ARMING_RESET_DELAY)

      if (nextProgress >= 1) {
        navigateToSection(to, {
          mode: 'exitIntent',
          direction,
          lockDuration: NAV_LOCK_DURATION,
        })
      }
    },
    [navigateToSection, resetArming]
  )

  useEffect(() => {
    const elements = sections
      .map((section) => getSectionElement(section.id))
      .filter(Boolean)

    if (!elements.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticRef.current) {
          return
        }

        const visibleEntry = [...entries]
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleEntry?.target?.id) {
          return
        }

        setActiveSectionId(visibleEntry.target.id)
      },
      {
        threshold: [0.35, OBSERVER_THRESHOLD, 0.82],
      }
    )

    elements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
    }
  }, [sections])

  useEffect(() => {
    const handleWheel = (event) => {
      const activeId = activeSectionIdRef.current
      const activeElement = getSectionElement(activeId)

      if (!activeElement) {
        return
      }

      if (isProgrammaticRef.current) {
        event.preventDefault()
        return
      }

      const currentIndex = sections.findIndex((section) => section.id === activeId)

      if (currentIndex === -1) {
        return
      }

      const rect = activeElement.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const deltaY = event.deltaY

      const atTopEdge = rect.top >= -EDGE_TOLERANCE
      const atBottomEdge = rect.bottom <= viewportHeight + EDGE_TOLERANCE

      const hasPrevious = currentIndex > 0
      const hasNext = currentIndex < sections.length - 1

      if (deltaY > 0 && hasNext && atBottomEdge) {
        event.preventDefault()

        startArming({
          from: activeId,
          to: sections[currentIndex + 1].id,
          direction: 'forward',
          deltaMagnitude: Math.abs(deltaY),
        })

        return
      }

      if (deltaY < 0 && hasPrevious && atTopEdge) {
        event.preventDefault()

        startArming({
          from: activeId,
          to: sections[currentIndex - 1].id,
          direction: 'backward',
          deltaMagnitude: Math.abs(deltaY),
        })

        return
      }

      if (armingRef.current.progress > 0) {
        resetArming()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [resetArming, sections, startArming])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const api = useMemo(
    () => ({
      activeSectionId,
      isTransitioning: transitionState.active,
      navigateToSection,
      releaseNavigationLock,
      transitionState,
    }),
    [activeSectionId, navigateToSection, releaseNavigationLock, transitionState]
  )

  return (
    <>
      {children(api)}
      <TransitionLayer transitionState={transitionState} />
    </>
  )
}