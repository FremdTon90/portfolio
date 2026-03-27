import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Projects.css";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    id: "01",
    eyebrow: "Frontend / UX",
    title: "Immersive Portfolio Experience",
    teaser:
      "Ein cineastischer Onepager mit klarer Story-Führung, visuellem Impact und recruiter-tauglicher Informationsarchitektur.",
    contribution:
      "Konzept, UI-System, Scroll-Dramaturgie, Animation, Komponentenstruktur und Frontend-Umsetzung.",
    stack: ["React", "Vite", "GSAP", "ScrollTrigger", "CSS"],
    metrics: ["Story-driven UX", "Smooth reveal flow", "High visual impact"],
    demo: "#",
    github: "https://github.com/FremdTon90/portfolio",
    theme: "cyan",
  },
  {
    id: "02",
    eyebrow: "Fullstack / Systemdenken",
    title: "Form & Workflow Platform",
    teaser:
      "Ein praxisnahes System für strukturierte Eingaben, Review-Prozesse, Statuslogik und saubere Datenflüsse im Portal-Kontext.",
    contribution:
      "Frontend-Logik, UX-Optimierung, Formularverhalten, Rollenverständnis, Zustandslogik und Feature-Konzeption.",
    stack: ["JavaScript", "HTML", "CSS", "Python", "Django"],
    metrics: ["Workflow focus", "Structured data", "Role-aware UX"],
    demo: "#",
    github: "#",
    theme: "violet",
  },
  {
    id: "03",
    eyebrow: "Creative Tech / CAD",
    title: "Spatial Design Showcase",
    teaser:
      "Schnittstelle aus Gestaltung, technischem Denken und digitalem Raum – ideal für Projekte mit visueller Tiefe und Systembezug.",
    contribution:
      "Konzeptarbeit, räumliches Denken, Design-Perspektive, technische Übersetzung und visuelle Präsentation.",
    stack: ["CAD", "Cinema 4D", "Onshape", "Shapr3D", "Design Systems"],
    metrics: ["3D mindset", "Visual systems", "Technical aesthetics"],
    demo: "#",
    github: "#",
    theme: "amber",
  },
];

function ProjectMockup({ theme, title, index }) {
  return (
    <div className={`project-mockup project-mockup--${theme}`}>
      <div className="project-mockup__noise" />
      <div className="project-mockup__glow" />
      <div className="project-mockup__frame">
        <div className="project-mockup__topbar">
          <span />
          <span />
          <span />
        </div>

        <div className="project-mockup__screen">
          <div className="project-mockup__hud">
            <div className="project-mockup__label">SHOWCASE_{index + 1}</div>
            <div className="project-mockup__status">ACTIVE</div>
          </div>

          <div className="project-mockup__grid" />

          <div className="project-mockup__content">
            <div className="project-mockup__headline">{title}</div>

            <div className="project-mockup__bars">
              <span />
              <span />
              <span />
            </div>

            <div className="project-mockup__cards">
              <div className="project-mockup__card" />
              <div className="project-mockup__card" />
              <div className="project-mockup__card project-mockup__card--large" />
            </div>
          </div>

          <div className="project-mockup__ring project-mockup__ring--one" />
          <div className="project-mockup__ring project-mockup__ring--two" />
          <div className="project-mockup__scanline" />
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) return;

      gsap.from(".projects-header > *", {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".projects-header",
          start: "top 80%",
        },
      });

      gsap.utils.toArray(".project-showcase").forEach((card, index) => {
        const isEven = index % 2 === 0;

        gsap.from(card, {
          y: 80,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 82%",
          },
        });

        gsap.from(card.querySelector(".project-showcase__visual"), {
          x: isEven ? -60 : 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 82%",
          },
        });

        gsap.from(card.querySelector(".project-showcase__content"), {
          x: isEven ? 60 : -60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 82%",
          },
        });

        gsap.from(card.querySelectorAll(".project-chip, .project-metric"), {
          y: 18,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.05,
          scrollTrigger: {
            trigger: card,
            start: "top 75%",
          },
        });
      });

      gsap.to(".project-mockup__ring--one", {
        rotate: 360,
        duration: 18,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".project-mockup__ring--two", {
        rotate: -360,
        duration: 24,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".project-mockup", {
        yPercent: -4,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.25,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="projects section-shell"
      id="projects"
      ref={sectionRef}
      data-scroll-end-offset="clamp(180px, 28vh, 420px)"
    >
      <div className="projects-bg projects-bg--one" />
      <div className="projects-bg projects-bg--two" />

      <div className="projects-inner">
        <header className="projects-header">
          <p className="section-kicker">Selected Projects</p>
          <h2>
            Projekte, die nicht nur <span>funktionieren</span>, sondern eine Bühne haben.
          </h2>
          <p className="projects-header__text">
            Der Fokus liegt auf Frontend, visueller Qualität, klarer UX und technischem
            Systemverständnis. Genau die Mischung, die aus normalen Interfaces stärkere
            digitale Erlebnisse macht.
          </p>
        </header>

        <div className="projects-list">
          {projects.map((project, index) => (
            <article
              key={project.id}
              className={`project-showcase ${index % 2 !== 0 ? "project-showcase--reverse" : ""}`}
            >
              <div className="project-showcase__visual">
                <div className="project-showcase__index">{project.id}</div>
                <ProjectMockup theme={project.theme} title={project.title} index={index} />
              </div>

              <div className="project-showcase__content">
                <div className="project-showcase__eyebrow">{project.eyebrow}</div>

                <h3>{project.title}</h3>

                <p className="project-showcase__teaser">{project.teaser}</p>

                <div className="project-info-block">
                  <span className="project-info-block__label">Mein Beitrag</span>
                  <p>{project.contribution}</p>
                </div>

                <div className="project-info-block">
                  <span className="project-info-block__label">Stack</span>
                  <div className="project-chips">
                    {project.stack.map((item) => (
                      <span className="project-chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="project-info-block">
                  <span className="project-info-block__label">Stärke</span>
                  <div className="project-metrics">
                    {project.metrics.map((metric) => (
                      <span className="project-metric" key={metric}>
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="project-actions">
                  <a
                    href={project.demo}
                    className="project-btn project-btn--primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live Demo
                  </a>

                  <a
                    href={project.github}
                    className="project-btn project-btn--ghost"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}