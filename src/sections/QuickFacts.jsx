import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function QuickFacts() {
  const sectionRef = useRef(null)
  const labelRef = useRef(null)
  const titleRef = useRef(null)
  const copyRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([labelRef.current, titleRef.current, copyRef.current], {
        opacity: 0,
        y: 40,
      })

      gsap.set(cardsRef.current, {
        opacity: 0,
        y: 60,
        scale: 0.96,
      })

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      })

      timeline
        .to(labelRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
        })
        .to(
          titleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.35'
        )
        .to(
          copyRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
          },
          '-=0.45'
        )
        .to(
          cardsRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
          },
          '-=0.3'
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef}>
      <span ref={labelRef} className="section-label">
        Quick Facts
      </span>

      <div className="section-copy">
        <h2 ref={titleRef}>Erst Eindruck. Dann Substanz.</h2>
        <p ref={copyRef}>
          Mein Fokus liegt auf Frontend und starken Nutzererlebnissen. Gleichzeitig
          bringe ich Designverständnis, CAD-Erfahrung und technisches Breitenwissen
          mit — also nicht nur Pixel schubsen, sondern Denken in Systemen.
        </p>
      </div>

      <div className="quickfacts-grid">
        {[
          {
            title: 'Fokus',
            text: 'Frontend Development, visuelle Interfaces und moderne Web-Erlebnisse.',
          },
          {
            title: 'Zusatzstärke',
            text: 'CAD, Design, Audio und technische Vielseitigkeit über mehrere Disziplinen.',
          },
          {
            title: 'Ziel',
            text: 'Portfolio-Showcase mit klarer Story, starkem Eindruck und recruiter-tauglicher Struktur.',
          },
          {
            title: 'Status',
            text: 'Available for work · Deutschland heute, Dänemark perspektivisch.',
          },
        ].map((item, index) => (
          <article
            key={item.title}
            ref={(element) => {
              cardsRef.current[index] = element
            }}
            className="quickfact-card"
          >
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}