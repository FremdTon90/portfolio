import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Skills.css";

gsap.registerPlugin(ScrollTrigger);

const skillGroups = [
  {
    title: "Frontend Engineering",
    label: "Core",
    text: "Moderne Interfaces mit Fokus auf Struktur, UX, Animation, Responsiveness und sauberer Komponentenlogik.",
    items: ["React", "JavaScript", "HTML", "CSS", "Responsive UI", "GSAP"],
    accent: "cyan",
  },
  {
    title: "Fullstack & Logic",
    label: "System",
    text: "Formulare, Zustände, Datenflüsse, Rollenlogik und robuste Prozesse für echte Anwendungsfälle statt reiner Demo-Apps.",
    items: ["Python", "Django", "SQL", "API Thinking", "Validation", "Workflow Logic"],
    accent: "violet",
  },
  {
    title: "Design & Spatial Thinking",
    label: "Visual",
    text: "Visuelles Denken, räumliches Verständnis und gestalterische Klarheit für Interfaces mit Tiefe und Richtung.",
    items: ["UI Design", "UX Thinking", "CAD", "Cinema 4D", "Onshape", "Shapr3D"],
    accent: "amber",
  },
  {
    title: "Creative Tech",
    label: "Edge",
    text: "Technik trifft Gestaltung: Motion, Audio, digitale Inszenierung und interaktive Konzepte mit Charakter.",
    items: ["Audio Design", "DAWs", "Motion", "Creative Coding", "Showcase Thinking", "Interactive Concepts"],
    accent: "emerald",
  },
];

const orbitSkills = [
  "React",
  "GSAP",
  "Python",
  "SQL",
  "CAD",
  "Design",
  "Audio",
  "Systems",
];

export default function Skills() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) return;

      gsap.from(".skills-header > *", {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ".skills-header",
          start: "top 82%",
        },
      });

      gsap.from(".skill-cluster", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".skills-grid",
          start: "top 78%",
        },
      });

      gsap.from(".skills-visual", {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".skills-stage",
          start: "top 78%",
        },
      });

      gsap.to(".skills-orbit--one", {
        rotate: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });

      gsap.to(".skills-orbit--two", {
        rotate: -360,
        duration: 28,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });

      gsap.to(".skills-core", {
        yPercent: -4,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".skills-float-tag", {
        y: -10,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.18,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="skills section-shell" id="skills" ref={sectionRef}>
      <div className="skills-bg skills-bg--one" />
      <div className="skills-bg skills-bg--two" />

      <div className="skills-inner">
        <header className="skills-header">
          <p className="section-kicker">Capabilities</p>
          <h2>
            Ich denke nicht in isolierten Tools, sondern in <span>starken Systemen</span>.
          </h2>
          <p className="skills-header__text">
            Mein Schwerpunkt liegt auf Frontend und digitaler Experience. Dazu kommen
            Fullstack-Verständnis, visuelles Denken, CAD und Creative Tech — also genau
            die Mischung aus Code, Gestaltung und Systemlogik, die aus normalen Interfaces
            stärkere Produkte macht.
          </p>
        </header>

        <div className="skills-stage">
          <div className="skills-grid">
            {skillGroups.map((group) => (
              <article
                key={group.title}
                className={`skill-cluster skill-cluster--${group.accent}`}
              >
                <div className="skill-cluster__top">
                  <span className="skill-cluster__label">{group.label}</span>
                  <span className="skill-cluster__signal" />
                </div>

                <h3>{group.title}</h3>
                <p>{group.text}</p>

                <div className="skill-cluster__chips">
                  {group.items.map((item) => (
                    <span className="skill-chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="skills-visual">
            <div className="skills-visual__noise" />
            <div className="skills-visual__grid" />

            <div className="skills-hud">
              <span>PROFILE MATRIX</span>
              <span>ACTIVE</span>
            </div>

            <div className="skills-core-wrap">
              <div className="skills-orbit skills-orbit--one" />
              <div className="skills-orbit skills-orbit--two" />

              <div className="skills-core">
                <div className="skills-core__inner">
                  <span className="skills-core__eyebrow">Primary Focus</span>
                  <strong>Frontend + Experience</strong>
                  <small>Code / Design / System Thinking</small>
                </div>
              </div>

              {orbitSkills.map((skill, index) => (
                <span
                  key={skill}
                  className={`skills-float-tag skills-float-tag--${index + 1}`}
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="skills-stats">
              <div className="skills-stat">
                <span className="skills-stat__label">Focus</span>
                <strong>Frontend</strong>
              </div>
              <div className="skills-stat">
                <span className="skills-stat__label">Mindset</span>
                <strong>Systemic</strong>
              </div>
              <div className="skills-stat">
                <span className="skills-stat__label">Edge</span>
                <strong>Creative Tech</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}