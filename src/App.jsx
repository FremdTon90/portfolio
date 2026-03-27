import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import './components/AppLoader.css'

import ScrollDirector from './components/ScrollDirector'
import Hero from './sections/Hero'
import QuickFacts from './sections/QuickFacts'
import Skills from './sections/Skills'
import Projects from './sections/Projects'
import Showcase from './sections/Showcase'
import Contact from './sections/Contact'

const LOADER_WAIT_DURATION = 1000
const LOADER_PLAY_DURATION = 2000
const LOADER_FRAME_COUNT = 120

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  const right = x + width
  const bottom = y + height
  const centerTopX = x + width * 0.5

  ctx.beginPath()
  ctx.moveTo(centerTopX, y)
  ctx.lineTo(right - radius, y)
  ctx.arcTo(right, y, right, y + radius, radius)
  ctx.lineTo(right, bottom - radius)
  ctx.arcTo(right, bottom, right - radius, bottom, radius)
  ctx.lineTo(x + radius, bottom)
  ctx.arcTo(x, bottom, x, bottom - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.lineTo(centerTopX, y)
}

function getRoundedRectPerimeter(width, height, radius) {
  return 2 * (width - 2 * radius) + 2 * (height - 2 * radius) + 2 * Math.PI * radius
}

function drawLoaderFrame(ctx, width, height, progress) {
  const strokeWidth = 3
  const inset = strokeWidth * 0.5 + 0.5
  const rectX = inset
  const rectY = inset
  const rectWidth = width - inset * 2
  const rectHeight = height - inset * 2
  const radius = 28
  const perimeter = getRoundedRectPerimeter(rectWidth, rectHeight, radius)

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.lineWidth = strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  drawRoundedRectPath(ctx, rectX, rectY, rectWidth, rectHeight, radius)
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.08)'
  ctx.shadowBlur = 0
  ctx.stroke()

  if (progress > 0) {
    const progressLength = perimeter * progress
    const headLength = Math.min(26, Math.max(10, progressLength * 0.15))

    drawRoundedRectPath(ctx, rectX, rectY, rectWidth, rectHeight, radius)
    ctx.setLineDash([progressLength, perimeter])
    ctx.lineDashOffset = 0
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.54)'
    ctx.shadowColor = 'rgba(103, 232, 249, 0.14)'
    ctx.shadowBlur = 12
    ctx.stroke()

    drawRoundedRectPath(ctx, rectX, rectY, rectWidth, rectHeight, radius)
    ctx.setLineDash([progressLength, perimeter])
    ctx.lineDashOffset = 0
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.92)'
    ctx.shadowBlur = 0
    ctx.stroke()

    drawRoundedRectPath(ctx, rectX, rectY, rectWidth, rectHeight, radius)
    ctx.setLineDash([headLength, perimeter])
    ctx.lineDashOffset = -(progressLength - headLength)
    ctx.strokeStyle = '#ffffff'
    ctx.shadowColor = 'rgba(170, 240, 255, 0.82)'
    ctx.shadowBlur = 14
    ctx.stroke()
  }

  ctx.restore()
}

function buildLoaderFramesChunked(cssWidth, cssHeight, dpr, onDone) {
  const pixelWidth = Math.round(cssWidth * dpr)
  const pixelHeight = Math.round(cssHeight * dpr)
  const frames = new Array(LOADER_FRAME_COUNT)
  let index = 0
  let cancelled = false
  let rafId = null

  const step = () => {
    const startedAt = performance.now()

    while (index < LOADER_FRAME_COUNT && performance.now() - startedAt < 6) {
      const progress = index / (LOADER_FRAME_COUNT - 1)
      const frameCanvas = document.createElement('canvas')
      frameCanvas.width = pixelWidth
      frameCanvas.height = pixelHeight

      const frameCtx = frameCanvas.getContext('2d')
      frameCtx.scale(dpr, dpr)
      drawLoaderFrame(frameCtx, cssWidth, cssHeight, progress)

      frames[index] = frameCanvas
      index += 1
    }

    if (cancelled) return

    if (index < LOADER_FRAME_COUNT) {
      rafId = window.requestAnimationFrame(step)
      return
    }

    onDone({
      frames,
      pixelWidth,
      pixelHeight,
    })
  }

  rafId = window.requestAnimationFrame(step)

  return () => {
    cancelled = true

    if (rafId) {
      window.cancelAnimationFrame(rafId)
    }
  }
}

function AppLoader({ canvasRef, contentRef, barFillRef, isFinishing = false }) {
  return (
    <div className={`app-loader${isFinishing ? ' is-finishing' : ''}`} aria-hidden="true">
      <div className="app-loader__backdrop" />

      <div ref={contentRef} className="app-loader__content">
        <canvas ref={canvasRef} className="app-loader__border-canvas" />

        <div className="app-loader__eyebrow">Initializing portfolio</div>

        <div className="app-loader__bar">
          <span ref={barFillRef} className="app-loader__bar-fill" />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [sectionResetKey, setSectionResetKey] = useState(0)
  const [isLoaderFinishing, setIsLoaderFinishing] = useState(false)
  const [isLoaderVisible, setIsLoaderVisible] = useState(true)

  const historyIndexRef = useRef(0)
  const loaderCanvasRef = useRef(null)
  const loaderContentRef = useRef(null)
  const loaderBarFillRef = useRef(null)
  const loaderAnimationFrameRef = useRef(null)
  const loaderHideTimeoutRef = useRef(null)
  const loaderStartTimeoutRef = useRef(null)

  const appReady = !isLoaderVisible

  const getCleanBaseUrl = useCallback(() => {
    return `${window.location.pathname}${window.location.search}`
  }, [])

  const reloadToBaseUrl = useCallback(() => {
    window.location.replace(getCleanBaseUrl())
  }, [getCleanBaseUrl])

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
    const canvas = loaderCanvasRef.current
    const content = loaderContentRef.current
    const barFill = loaderBarFillRef.current

    if (!canvas || !content || !barFill) return

    const rect = content.getBoundingClientRect()
    const cssWidth = Math.round(rect.width)
    const cssHeight = Math.round(rect.height)
    const dpr = 1

    canvas.width = cssWidth
    canvas.height = cssHeight
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    const ctx = canvas.getContext('2d')
    let preparedFrames = null
    let cancelFrameBuild = null

    const drawFrameIndex = (index) => {
      if (!preparedFrames) return
      const safeIndex = Math.max(0, Math.min(index, preparedFrames.frames.length - 1))
      ctx.clearRect(0, 0, preparedFrames.pixelWidth, preparedFrames.pixelHeight)
      ctx.drawImage(preparedFrames.frames[safeIndex], 0, 0)
    }

    drawLoaderFrame(ctx, cssWidth, cssHeight, 0)
    barFill.style.transform = 'scaleX(0)'

    cancelFrameBuild = buildLoaderFramesChunked(cssWidth, cssHeight, dpr, (result) => {
      preparedFrames = result

      canvas.width = preparedFrames.pixelWidth
      canvas.height = preparedFrames.pixelHeight
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`

      drawFrameIndex(0)
      barFill.style.transform = 'scaleX(0)'
    })

    loaderStartTimeoutRef.current = window.setTimeout(() => {
      const waitUntilReady = () => {
        if (!preparedFrames) {
          loaderAnimationFrameRef.current = window.requestAnimationFrame(waitUntilReady)
          return
        }

        drawFrameIndex(0)
        barFill.style.transform = 'scaleX(0)'

        loaderAnimationFrameRef.current = window.requestAnimationFrame((startTimestamp) => {
          const playbackStartedAt = startTimestamp

          const animate = (now) => {
            const elapsed = now - playbackStartedAt
            const progress = Math.min(elapsed / LOADER_PLAY_DURATION, 1)
            const frameIndex = Math.floor(progress * (preparedFrames.frames.length - 1))

            drawFrameIndex(frameIndex)
            barFill.style.transform = `scaleX(${progress})`

            if (progress < 1) {
              loaderAnimationFrameRef.current = window.requestAnimationFrame(animate)
              return
            }

            drawFrameIndex(preparedFrames.frames.length - 1)
            barFill.style.transform = 'scaleX(1)'
            setIsLoaderFinishing(true)

            loaderHideTimeoutRef.current = window.setTimeout(() => {
              setIsLoaderVisible(false)
            }, 1)
          }

          drawFrameIndex(0)
          barFill.style.transform = 'scaleX(0)'
          loaderAnimationFrameRef.current = window.requestAnimationFrame(animate)
        })
      }

      waitUntilReady()
    }, LOADER_WAIT_DURATION)

    return () => {
      if (cancelFrameBuild) {
        cancelFrameBuild()
      }

      if (loaderStartTimeoutRef.current) {
        window.clearTimeout(loaderStartTimeoutRef.current)
      }

      if (loaderAnimationFrameRef.current) {
        window.cancelAnimationFrame(loaderAnimationFrameRef.current)
      }

      if (loaderHideTimeoutRef.current) {
        window.clearTimeout(loaderHideTimeoutRef.current)
      }
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

  const sections = [
    { id: 'hero' },
    { id: 'quickfacts' },
    { id: 'skills' },
    { id: 'projects' },
    { id: 'showcase' },
    { id: 'contact' },
  ]

  return (
    <>
      {isLoaderVisible ? (
        <AppLoader
          canvasRef={loaderCanvasRef}
          contentRef={loaderContentRef}
          barFillRef={loaderBarFillRef}
          isFinishing={isLoaderFinishing}
        />
      ) : null}

      <ScrollDirector sections={sections}>
        {({ activeSectionId, navigateToSection }) => (
          <main className={`app-shell${appReady ? ' is-ready' : ''}`}>
            <Hero
              key={`hero-${sectionResetKey}`}
              onNavigationStart={handleHeroNavigationStart}
              navigateToSection={navigateToSection}
            />

            <QuickFacts
              key={`quickfacts-${sectionResetKey}`}
              isActive={activeSectionId === 'quickfacts'}
              navigateToSection={navigateToSection}
            />

            <Skills key={`skills-${sectionResetKey}`} />
            <Projects key={`projects-${sectionResetKey}`} />
            <Showcase key={`showcase-${sectionResetKey}`} />
            <Contact key={`contact-${sectionResetKey}`} />
          </main>
        )}
      </ScrollDirector>
    </>
  )
}

export default App