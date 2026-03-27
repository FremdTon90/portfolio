import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TransitionLayer from './TransitionLayer'

const NAV_LOCK_DURATION = 1100
const OBSERVER_THRESHOLD = 0.62

const TOP_EDGE_TOLERANCE = 8
const BOTTOM_TRIGGER_TOLERANCE = 12

const ARMING_DISTANCE = 700
const ARMING_RESET_DELAY = 850
const PLAYBACK_DURATION = 1400

const WHEEL_SCROLL_MULTIPLIER = 2.5
const KEYBOARD_SCROLL_MULTIPLIER = 1.15

const START_SENTINEL_SELECTOR = '[data-scroll-sentinel="start"]'
const END_SENTINEL_SELECTOR = '[data-scroll-sentinel="end"]'

const DEFAULT_START_SENTINEL_TOP_OFFSET = '0px'
const DEFAULT_END_SENTINEL_BOTTOM_OFFSET = 'clamp(96px, 16vh, 220px)'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getSectionElement(id) {
  return document.getElementById(id)
}

function isEditableTarget(target) {
  if (!target) return false

  const tagName = target.tagName?.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}

function getStartSentinelOffset(sectionElement) {
  return (
    sectionElement.getAttribute('data-scroll-start-offset') ||
    DEFAULT_START_SENTINEL_TOP_OFFSET
  )
}

function getEndSentinelOffset(sectionElement) {
  return (
    sectionElement.getAttribute('data-scroll-end-offset') ||
    DEFAULT_END_SENTINEL_BOTTOM_OFFSET
  )
}

function ensureSectionSentinels(sectionElement) {
  if (!sectionElement) {
    return () => {}
  }

  const createdNodes = []
  const originalPosition = sectionElement.style.position
  const computedPosition = window.getComputedStyle(sectionElement).position

  if (computedPosition === 'static') {
    sectionElement.style.position = 'relative'
  }

  let startSentinel = sectionElement.querySelector(START_SENTINEL_SELECTOR)

  if (!startSentinel) {
    startSentinel = document.createElement('div')
    startSentinel.dataset.scrollSentinel = 'start'
    startSentinel.setAttribute('aria-hidden', 'true')
    startSentinel.style.position = 'absolute'
    startSentinel.style.left = '0'
    startSentinel.style.right = '0'
    startSentinel.style.height = '1px'
    startSentinel.style.pointerEvents = 'none'
    startSentinel.style.opacity = '0'
    startSentinel.style.zIndex = '-1'
    sectionElement.appendChild(startSentinel)
    createdNodes.push(startSentinel)
  }

  let endSentinel = sectionElement.querySelector(END_SENTINEL_SELECTOR)

  if (!endSentinel) {
    endSentinel = document.createElement('div')
    endSentinel.dataset.scrollSentinel = 'end'
    endSentinel.setAttribute('aria-hidden', 'true')
    endSentinel.style.position = 'absolute'
    endSentinel.style.left = '0'
    endSentinel.style.right = '0'
    endSentinel.style.height = '1px'
    endSentinel.style.pointerEvents = 'none'
    endSentinel.style.opacity = '0'
    endSentinel.style.zIndex = '-1'
    sectionElement.appendChild(endSentinel)
    createdNodes.push(endSentinel)
  }

  startSentinel.style.top = getStartSentinelOffset(sectionElement)
  endSentinel.style.bottom = getEndSentinelOffset(sectionElement)

  return () => {
    createdNodes.forEach((node) => node.remove())

    if (computedPosition === 'static') {
      sectionElement.style.position = originalPosition
    }
  }
}

function getKeyboardDelta(event) {
  const viewportStep = Math.round(window.innerHeight * 0.9)
  const lineStep = 120

  switch (event.key) {
    case 'ArrowDown':
      return lineStep
    case 'ArrowUp':
      return -lineStep
    case 'PageDown':
      return viewportStep
    case 'PageUp':
      return -viewportStep
    case ' ':
      return event.shiftKey ? -viewportStep : viewportStep
    default:
      return 0
  }
}

function getAbsoluteTop(element) {
  const rect = element.getBoundingClientRect()
  return window.scrollY + rect.top
}

export default function ScrollDirector({ sections, children }) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null)
  const [sectionEnterVersions, setSectionEnterVersions] = useState(() =>
    Object.fromEntries(sections.map((section) => [section.id, 0]))
  )
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

      const targetTop = Math.max(0, Math.round(getAbsoluteTop(target)))

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
          setSectionEnterVersions((current) => ({
            ...current,
            [nextSectionId]: (current[nextSectionId] ?? 0) + 1,
          }))
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

  const getActiveGeometry = useCallback(() => {
    const activeId = activeSectionIdRef.current
    const activeElement = getSectionElement(activeId)

    if (!activeElement) {
      return null
    }

    const currentIndex = sections.findIndex((section) => section.id === activeId)

    if (currentIndex === -1) {
      return null
    }

    const startSentinel = activeElement.querySelector(START_SENTINEL_SELECTOR)
    const endSentinel = activeElement.querySelector(END_SENTINEL_SELECTOR)

    const activeTop = getAbsoluteTop(activeElement)
    const activeHeight = activeElement.offsetHeight
    const maxScrollTop = Math.max(activeTop, activeTop + activeHeight - window.innerHeight)

    const startTop = startSentinel ? getAbsoluteTop(startSentinel) : activeTop
    const endTop = endSentinel ? getAbsoluteTop(endSentinel) : maxScrollTop

    const atTopEdge = window.scrollY <= startTop + TOP_EDGE_TOLERANCE
    const atBottomEdge = endTop - window.scrollY <= window.innerHeight - BOTTOM_TRIGGER_TOLERANCE

    return {
      activeId,
      currentIndex,
      activeTop,
      maxScrollTop,
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < sections.length - 1,
      atTopEdge,
      atBottomEdge,
    }
  }, [sections])

  const processDirectionalInput = useCallback(
    (deltaY, inputType = 'wheel') => {
      const geometry = getActiveGeometry()

      if (!geometry) {
        return false
      }

      const {
        activeId,
        currentIndex,
        activeTop,
        maxScrollTop,
        hasPrevious,
        hasNext,
        atTopEdge,
        atBottomEdge,
      } = geometry

      const multiplier = inputType === 'keyboard'
        ? KEYBOARD_SCROLL_MULTIPLIER
        : WHEEL_SCROLL_MULTIPLIER

      const scaledDelta = deltaY * multiplier

      if (scaledDelta > 0) {
        if (atBottomEdge && hasNext) {
          window.scrollTo({
            top: maxScrollTop,
            behavior: 'auto',
          })

          startArming({
            from: activeId,
            to: sections[currentIndex + 1].id,
            direction: 'forward',
            deltaMagnitude: Math.abs(scaledDelta),
          })

          return true
        }

        const nextTop = clamp(window.scrollY + scaledDelta, activeTop, maxScrollTop)

        window.scrollTo({
          top: nextTop,
          behavior: 'auto',
        })

        if (armingRef.current.progress > 0) {
          resetArming()
        }

        return true
      }

      if (scaledDelta < 0) {
        if (atTopEdge && hasPrevious) {
          window.scrollTo({
            top: activeTop,
            behavior: 'auto',
          })

          startArming({
            from: activeId,
            to: sections[currentIndex - 1].id,
            direction: 'backward',
            deltaMagnitude: Math.abs(scaledDelta),
          })

          return true
        }

        const nextTop = clamp(window.scrollY + scaledDelta, activeTop, maxScrollTop)

        window.scrollTo({
          top: nextTop,
          behavior: 'auto',
        })

        if (armingRef.current.progress > 0) {
          resetArming()
        }

        return true
      }

      return false
    },
    [getActiveGeometry, resetArming, sections, startArming]
  )

  useEffect(() => {
    const elements = sections
      .map((section) => getSectionElement(section.id))
      .filter(Boolean)

    if (!elements.length) {
      return undefined
    }

    const cleanupFns = elements.map((element) => ensureSectionSentinels(element))

    return () => {
      cleanupFns.forEach((cleanup) => cleanup())
    }
  }, [sections])

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
      if (isProgrammaticRef.current) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      processDirectionalInput(event.deltaY, 'wheel')
    }

    const handleKeyDown = (event) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'PageDown' &&
        event.key !== 'PageUp' &&
        event.key !== ' '
      ) {
        return
      }

      const deltaY = getKeyboardDelta(event)

      if (!deltaY) {
        return
      }

      event.preventDefault()

      if (isProgrammaticRef.current) {
        return
      }

      processDirectionalInput(deltaY, 'keyboard')
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [processDirectionalInput])

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
      getSectionEnterKey: (sectionId) => sectionEnterVersions[sectionId] ?? 0,
    }),
    [activeSectionId, navigateToSection, releaseNavigationLock, sectionEnterVersions, transitionState]
  )

  return (
    <>
      {children(api)}
      <TransitionLayer transitionState={transitionState} />
    </>
  )
}