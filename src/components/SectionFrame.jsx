import { useEffect, useMemo, useRef, useState } from 'react'
import './SectionFrame.css'

const EXIT_INTENT_REQUIRED = 4
const EXIT_RESET_DELAY = 900
const EDGE_THRESHOLD = 10

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function SectionFrame({
  sectionId,
  className = '',
  children,
  isActive = false,
  exitIntentEnabled = false,
  showExitUi = false,
  previousSectionId = null,
  nextSectionId = null,
  navigateToSection = null,
}) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const resetTimeoutRef = useRef(null)

  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)
  const [topExitCount, setTopExitCount] = useState(0)
  const [bottomExitCount, setBottomExitCount] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [armedDirection, setArmedDirection] = useState(null)

  const exitProgress = useMemo(() => {
    if (!exitIntentEnabled) return 0

    const count = armedDirection === 'backward' ? topExitCount : bottomExitCount
    return clamp(count / EXIT_INTENT_REQUIRED, 0, 1)
  }, [armedDirection, bottomExitCount, exitIntentEnabled, topExitCount])

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      setTopExitCount(0)
      setBottomExitCount(0)
      setIsTransitioning(false)
      setArmedDirection(null)
      return
    }

    const scrollElement = scrollRef.current

    if (scrollElement) {
      scrollElement.scrollTop = 0
    }

    setIsAtTop(true)
    setIsAtEnd(false)
    setTopExitCount(0)
    setBottomExitCount(0)
    setIsTransitioning(false)
    setArmedDirection(null)
  }, [isActive])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const syncEdgeState = () => {
      const atTop = scrollElement.scrollTop <= EDGE_THRESHOLD
      const atEnd =
        scrollElement.scrollTop + scrollElement.clientHeight >=
        scrollElement.scrollHeight - EDGE_THRESHOLD

      setIsAtTop(atTop)
      setIsAtEnd(atEnd)

      if (!atTop && topExitCount > 0) {
        setTopExitCount(0)
        if (armedDirection === 'backward') {
          setArmedDirection(null)
        }
      }

      if (!atEnd && bottomExitCount > 0) {
        setBottomExitCount(0)
        if (armedDirection === 'forward') {
          setArmedDirection(null)
        }
      }
    }

    syncEdgeState()
    scrollElement.addEventListener('scroll', syncEdgeState, { passive: true })

    return () => {
      scrollElement.removeEventListener('scroll', syncEdgeState)
    }
  }, [armedDirection, bottomExitCount, topExitCount])

  useEffect(() => {
    const rootElement = rootRef.current
    const scrollElement = scrollRef.current

    if (!rootElement || !scrollElement || !exitIntentEnabled) {
      return undefined
    }

    const clearResetTimer = () => {
      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = null
      }
    }

    const scheduleReset = (direction) => {
      clearResetTimer()

      resetTimeoutRef.current = window.setTimeout(() => {
        if (direction === 'backward') {
          setTopExitCount(0)
        }

        if (direction === 'forward') {
          setBottomExitCount(0)
        }

        setArmedDirection(null)
      }, EXIT_RESET_DELAY)
    }

    const goToPrevious = () => {
      if (!previousSectionId || !navigateToSection) return

      setIsTransitioning(true)

      window.setTimeout(() => {
        navigateToSection(previousSectionId, {
          mode: 'exitIntent',
          lockDuration: 1350,
          direction: 'backward',
        })
      }, 120)
    }

    const goToNext = () => {
      if (!nextSectionId || !navigateToSection) return

      setIsTransitioning(true)

      window.setTimeout(() => {
        navigateToSection(nextSectionId, {
          mode: 'exitIntent',
          lockDuration: 1350,
          direction: 'forward',
        })
      }, 120)
    }

    const handleWheel = (event) => {
      if (!isActive || isTransitioning) {
        return
      }

      const deltaY = event.deltaY
      const canScrollDown =
        scrollElement.scrollTop + scrollElement.clientHeight < scrollElement.scrollHeight - EDGE_THRESHOLD
      const canScrollUp = scrollElement.scrollTop > EDGE_THRESHOLD

      if (deltaY > 0) {
        if (topExitCount > 0) {
          setTopExitCount(0)
        }

        if (canScrollDown) {
          event.preventDefault()
          scrollElement.scrollTop += deltaY
          setArmedDirection(null)
          return
        }

        event.preventDefault()

        const nextCount = clamp(bottomExitCount + 1, 0, EXIT_INTENT_REQUIRED)
        setIsAtEnd(true)
        setBottomExitCount(nextCount)
        setArmedDirection('forward')

        if (nextCount >= EXIT_INTENT_REQUIRED) {
          goToNext()
        } else {
          scheduleReset('forward')
        }

        return
      }

      if (deltaY < 0) {
        if (bottomExitCount > 0) {
          setBottomExitCount(0)
        }

        if (canScrollUp) {
          event.preventDefault()
          scrollElement.scrollTop += deltaY
          setArmedDirection(null)
          return
        }

        event.preventDefault()

        const nextCount = clamp(topExitCount + 1, 0, EXIT_INTENT_REQUIRED)
        setIsAtTop(true)
        setTopExitCount(nextCount)
        setArmedDirection('backward')

        if (nextCount >= EXIT_INTENT_REQUIRED) {
          goToPrevious()
        } else {
          scheduleReset('backward')
        }
      }
    }

    rootElement.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      clearResetTimer()
      rootElement.removeEventListener('wheel', handleWheel)
    }
  }, [
    bottomExitCount,
    exitIntentEnabled,
    isActive,
    isTransitioning,
    navigateToSection,
    nextSectionId,
    previousSectionId,
    topExitCount,
  ])

  const currentCount = armedDirection === 'backward' ? topExitCount : bottomExitCount

  const overlayVisible =
    Boolean(showExitUi) &&
    isActive &&
    (isTransitioning || topExitCount > 0 || bottomExitCount > 0)

  const directionLabel =
    armedDirection === 'backward'
      ? 'Scroll up to transition'
      : 'Scroll to transition'

  const routeLabel =
    armedDirection === 'backward'
      ? `Previous target: ${previousSectionId ?? 'none'}`
      : `Next target: ${nextSectionId ?? 'none'}`

  const stageClassName = [
    'section-frame',
    className,
    isActive ? 'is-active' : '',
    isAtTop ? 'is-at-top' : '',
    isAtEnd ? 'is-at-end' : '',
    topExitCount > 0 || bottomExitCount > 0 ? 'is-exit-arming' : '',
    isTransitioning ? 'is-exit-transitioning' : '',
    armedDirection === 'backward' ? 'is-direction-backward' : '',
    armedDirection === 'forward' ? 'is-direction-forward' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      id={sectionId}
      ref={rootRef}
      className={stageClassName}
      data-section-id={sectionId}
      data-exit-progress={exitProgress.toFixed(2)}
    >
      <div ref={scrollRef} className="section-frame__scroll">
        <div className="section-frame__content">{children}</div>
      </div>

      {showExitUi ? (
        <div
          className={`section-frame__exit-overlay${overlayVisible ? ' is-visible' : ''}`}
          aria-hidden="true"
        >
          <div className="section-frame__exit-panel">
            <span className="section-frame__exit-kicker">Content edge reached</span>
            <strong className="section-frame__exit-title">{directionLabel}</strong>

            <div className="section-frame__exit-meter">
              <span
                className="section-frame__exit-meter-fill"
                style={{
                  transform: `scaleX(${exitProgress})`,
                }}
              />
            </div>

            <div className="section-frame__exit-meta">
              <span>Intent: {currentCount}/{EXIT_INTENT_REQUIRED}</span>
              <span>{isTransitioning ? 'Transition armed' : routeLabel}</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}