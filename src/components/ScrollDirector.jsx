import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TransitionLayer from './TransitionLayer'

const NAV_LOCK_DURATION = 1100
const OBSERVER_THRESHOLD = 0.62

function getSectionElement(id) {
  return document.getElementById(id)
}

export default function ScrollDirector({ sections, children }) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null)
  const [transitionState, setTransitionState] = useState({
    active: false,
    from: null,
    to: null,
    mode: 'navLock',
    direction: 'forward',
  })

  const lockTimeoutRef = useRef(null)
  const isProgrammaticRef = useRef(false)
  const activeSectionIdRef = useRef(sections[0]?.id ?? null)

  useEffect(() => {
    activeSectionIdRef.current = activeSectionId
  }, [activeSectionId])

  const releaseNavigationLock = useCallback(() => {
    isProgrammaticRef.current = false

    if (lockTimeoutRef.current) {
      window.clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }

    setTransitionState((current) => ({
      ...current,
      active: false,
    }))

    document.documentElement.removeAttribute('data-scroll-director-lock')
    document.body.removeAttribute('data-scroll-director-lock')
  }, [])

  const navigateToSection = useCallback(
    (nextSectionId, options = {}) => {
      const target = getSectionElement(nextSectionId)

      if (!target) {
        return false
      }

      const fromSectionId = activeSectionIdRef.current
      const mode = options.mode ?? 'navLock'
      const direction = options.direction ?? 'forward'

      if (lockTimeoutRef.current) {
        window.clearTimeout(lockTimeoutRef.current)
      }

      isProgrammaticRef.current = true
      setTransitionState({
        active: true,
        from: fromSectionId,
        to: nextSectionId,
        mode,
        direction,
      })

      document.documentElement.setAttribute('data-scroll-director-lock', 'true')
      document.body.setAttribute('data-scroll-director-lock', 'true')

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
    return () => {
      if (lockTimeoutRef.current) {
        window.clearTimeout(lockTimeoutRef.current)
      }
    }
  }, [])

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