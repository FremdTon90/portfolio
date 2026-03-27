import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

import Hero from './sections/Hero'
import QuickFacts from './sections/QuickFacts'
import Skills from './sections/Skills'
import Projects from './sections/Projects'
import Showcase from './sections/Showcase'
import Contact from './sections/Contact'

const APP_LOADER_MIN_DURATION = 950
const APP_LOADER_FAILSAFE_DURATION = 4000

function AppLoader() {
  return (
    <div className="app-loader" aria-hidden="true">
      <div className="app-loader__backdrop" />

      <div className="app-loader__content">
        <div className="app-loader__eyebrow">Initializing portfolio</div>

        <div className="app-loader__bar">
          <span className="app-loader__bar-fill" />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [sectionResetKey, setSectionResetKey] = useState(0)
  const [heroSceneReady, setHeroSceneReady] = useState(false)
  const [minLoaderElapsed, setMinLoaderElapsed] = useState(false)
  const [failsafeElapsed, setFailsafeElapsed] = useState(false)

  const historyIndexRef = useRef(0)

  const appReady = (heroSceneReady && minLoaderElapsed) || failsafeElapsed

  const getCleanBaseUrl = useCallback(() => {
    return `${window.location.pathname}${window.location.search}`
  }, [])

  const reloadToBaseUrl = useCallback(() => {
    window.location.replace(getCleanBaseUrl())
  }, [getCleanBaseUrl])

  const handleHeroSceneReady = useCallback(() => {
    setHeroSceneReady(true)
  }, [])

  const handleHeroNavigationStart = useCallback(() => {
    setSectionResetKey((current) => current + 1)

    const nextIndex = historyIndexRef.current + 1

    window.history.pushState(
      {
        __portfolioInternalHeroEntry: true,
        __portfolioHistoryIndex: nextIndex,
      },
      '',
      getCleanBaseUrl()
    )

    historyIndexRef.current = nextIndex
  }, [getCleanBaseUrl])

  useEffect(() => {
    const minLoaderTimer = window.setTimeout(() => {
      setMinLoaderElapsed(true)
    }, APP_LOADER_MIN_DURATION)

    const failsafeTimer = window.setTimeout(() => {
      setFailsafeElapsed(true)
    }, APP_LOADER_FAILSAFE_DURATION)

    return () => {
      window.clearTimeout(minLoaderTimer)
      window.clearTimeout(failsafeTimer)
    }
  }, [])

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const initialState = window.history.state || {}
    const initialIndex =
      typeof initialState.__portfolioHistoryIndex === 'number'
        ? initialState.__portfolioHistoryIndex
        : 0

    window.history.replaceState(
      {
        ...initialState,
        __portfolioHeroBase: true,
        __portfolioHistoryIndex: initialIndex,
      },
      '',
      getCleanBaseUrl()
    )

    historyIndexRef.current = initialIndex

    const handlePopState = (event) => {
      const nextIndex =
        typeof event.state?.__portfolioHistoryIndex === 'number'
          ? event.state.__portfolioHistoryIndex
          : -1

      const wasBackNavigation =
        nextIndex !== -1 && nextIndex < historyIndexRef.current

      historyIndexRef.current = nextIndex === -1 ? 0 : nextIndex

      if (!wasBackNavigation) {
        return
      }

      const isInternalPortfolioStep =
        Boolean(event.state?.__portfolioInternalHeroEntry) ||
        Boolean(event.state?.__portfolioHeroBase)

      if (!isInternalPortfolioStep) {
        return
      }

      reloadToBaseUrl()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration || 'auto'
      }
    }
  }, [getCleanBaseUrl, reloadToBaseUrl])

  return (
    <>
      {!appReady ? <AppLoader /> : null}

      <main className={`app-shell${appReady ? ' is-ready' : ''}`}>
        <Hero
          key={`hero-${sectionResetKey}`}
          onNavigationStart={handleHeroNavigationStart}
          onSceneReady={handleHeroSceneReady}
        />

        <QuickFacts key={`quickfacts-${sectionResetKey}`} />
        <Skills key={`skills-${sectionResetKey}`} />
        <Projects key={`projects-${sectionResetKey}`} />
        <Showcase key={`showcase-${sectionResetKey}`} />
        <Contact key={`contact-${sectionResetKey}`} />
      </main>
    </>
  )
}


export default App