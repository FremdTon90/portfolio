import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const badgeRowRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const copyRef = useRef(null)
  const actionsRef = useRef(null)
  const scrollRef = useRef(null)
  const orbOneRef = useRef(null)
  const orbTwoRef = useRef(null)
  const orbThreeRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(
        [
          badgeRowRef.current,
          titleRef.current,
          subtitleRef.current,
          copyRef.current,
          actionsRef.current,
          scrollRef.current,
        ],
        {
          opacity: 0,
          y: 40,
        }
      )

      gsap.set([orbOneRef.current, orbTwoRef.current, orbThreeRef.current], {
        opacity: 0,
        scale: 0.8,
      })

      const introTimeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      introTimeline
        .to([orbOneRef.current, orbTwoRef.current, orbThreeRef.current], {
          opacity: 0.9,
          scale: 1,
          duration: 1.2,
          stagger: 0.12,
        })
        .to(
          badgeRowRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          '-=0.9'
        )
        .to(
          titleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
          },
          '-=0.4'
        )
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          '-=0.45'
        )
        .to(
          copyRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          '-=0.45'
        )
        .to(
          actionsRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          '-=0.45'
        )
        .to(
          scrollRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          '-=0.4'
        )

      gsap.to(orbOneRef.current, {
        y: -30,
        x: 20,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(orbTwoRef.current, {
        y: 24,
        x: -18,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(orbThreeRef.current, {
        y: -18,
        x: -12,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(scrollRef.current, {
        y: 10,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(contentRef.current, {
        y: -120,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.to(orbOneRef.current, {
        y: -90,
        x: 60,
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.to(orbTwoRef.current, {
        y: 90,
        x: -50,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.to(orbThreeRef.current, {
        y: -60,
        x: -30,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      ScrollTrigger.refresh()
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="hero">
      <div ref={orbOneRef} className="hero-orb one" />
      <div ref={orbTwoRef} className="hero-orb two" />
      <div ref={orbThreeRef} className="hero-orb three" />

      <div ref={contentRef}>
        <div ref={badgeRowRef} className="hero-badge-row">
          <span className="hero-badge">Available for work</span>
          <span className="hero-badge">Frontend + Fullstack</span>
          <span className="hero-badge">CAD + Creative Tech</span>
        </div>

        <h1 ref={titleRef} className="hero-title">
          <span>Dustin</span>
          <span className="hero-gradient-text">builds digital experiences.</span>
        </h1>

        <p ref={subtitleRef} className="hero-subtitle">
          Frontend Developer · CAD Designer · Creative Technologist
        </p>

        <p ref={copyRef} className="hero-copy">
          Ich baue digitale Erlebnisse zwischen Code, Design und Raum — mit Fokus auf
          starke Interfaces, visuelle Wirkung und technische Vielseitigkeit.
        </p>

        <div ref={actionsRef} className="hero-actions">
          <a className="hero-button primary" href="#projects">
            Projekte ansehen
          </a>
          <a className="hero-button" href="#contact">
            Kontakt
          </a>
        </div>
      </div>

      <div ref={scrollRef} className="hero-scroll">
        <span>Scroll to explore</span>
        <div className="hero-scroll-line" />
      </div>
    </section>
  )
}