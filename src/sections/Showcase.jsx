import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShowcaseScene from "./ShowcaseScene";
import "./Showcase.css";

gsap.registerPlugin(ScrollTrigger);

const showcaseData = {
  frontend: {
    title: "Frontend Engineering",
    eyebrow: "Continent 01",
    text: "Hier liegt mein Kern: moderne Interfaces, React, Animation, responsives Verhalten und klare visuelle Dramaturgie.",
    tags: ["React", "JavaScript", "CSS", "GSAP", "UI Motion"],
  },
  fullstack: {
    title: "Fullstack & Logic",
    eyebrow: "Continent 02",
    text: "Formularlogik, Zustände, Rollen, Datenflüsse und technische Robustheit hinter dem sichtbaren Interface.",
    tags: ["Python", "Django", "SQL", "Validation", "Workflow Logic"],
  },
  cad: {
    title: "CAD / 3D Thinking",
    eyebrow: "Continent 03",
    text: "Räumliches Denken, technische Konstruktion und visuelle Tiefe. Das prägt auch, wie ich Interfaces strukturiere.",
    tags: ["Onshape", "Shapr3D", "Cinema 4D", "Spatial Systems"],
  },
  audio: {
    title: "Audio / Sonic Design",
    eyebrow: "Continent 04",
    text: "Timing, Atmosphäre, Soundgestaltung und Produktionsdenken als kreatives Erweiterungsfeld meines Profils.",
    tags: ["Sound Design", "DAWs", "Editing", "Production"],
  },
  creative: {
    title: "Creative Tech",
    eyebrow: "Continent 05",
    text: "Die Schnittstelle aus Code, Gestaltung, Bewegung und Inszenierung. Genau hier wird aus funktional oft etwas mit Charakter.",
    tags: ["Motion", "Interaction", "Experience", "Creative Coding"],
  },
};

const themeOrder = [
  ["frontend", "Frontend"],
  ["fullstack", "Fullstack"],
  ["cad", "CAD / 3D"],
  ["audio", "Audio"],
  ["creative", "Creative Tech"],
];

export default function Showcase() {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const [activeTheme, setActiveTheme] = useState("frontend");

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.from(".showcase-header > *", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ".showcase-header",
          start: "top 82%",
        },
      });

      gsap.from(".showcase-panel", {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".showcase-layout",
          start: "top 78%",
        },
      });

      gsap.from(".showcase-globe-shell", {
        x: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".showcase-layout",
          start: "top 78%",
        },
      });

      gsap.from(".showcase-theme-button", {
        y: 16,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.05,
        scrollTrigger: {
          trigger: ".showcase-theme-nav",
          start: "top 90%",
        },
      });

      if (!reduceMotion) {
        gsap.to(".showcase-panel__pulse", {
          scale: 1.12,
          opacity: 0.8,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const active = showcaseData[activeTheme];

  const handleSelect = (themeId) => {
    setActiveTheme(themeId);

    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { y: 10, opacity: 0.78 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    }
  };

  return (
    <section className="showcase section-shell" id="showcase" ref={sectionRef}>
      <div className="showcase-bg showcase-bg--one" />
      <div className="showcase-bg showcase-bg--two" />

      <div className="showcase-inner">
        <header className="showcase-header">
          <p className="section-kicker">Interactive showcase</p>
          <h2>
            Mein Profil als <span>interaktiver Themen-Globus</span>.
          </h2>
          <p className="showcase-header__text">
            Jeder Bereich steht für ein Themenfeld. Klick auf eine Fläche am Globus oder
            nutze die Themenleiste darunter, und die passende Infokarte öffnet sich.
          </p>
        </header>

        <div className="showcase-layout">
          <aside className="showcase-panel" ref={panelRef}>
            <div className="showcase-panel__top">
              <span className="showcase-panel__eyebrow">{active.eyebrow}</span>
              <span className="showcase-panel__pulse" />
            </div>

            <h3>{active.title}</h3>
            <p>{active.text}</p>

            <div className="showcase-panel__chips">
              {active.tags.map((tag) => (
                <span key={tag} className="showcase-chip">
                  {tag}
                </span>
              ))}
            </div>

            <div className="showcase-panel__footer">
              <span>Interaktive Bereiche</span>
              <span>5 Themenfelder</span>
            </div>
          </aside>

          <div className="showcase-globe-shell">
            <div className="showcase-globe-hud">
              <span>THEME GLOBE</span>
              <span>CLICK OR DRAG</span>
            </div>

            <div className="showcase-globe-canvas">
              <ShowcaseScene activeTheme={activeTheme} onSelect={handleSelect} />
            </div>
          </div>
        </div>

        <div className="showcase-theme-nav">
          {themeOrder.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`showcase-theme-button ${
                activeTheme === id ? "showcase-theme-button--active" : ""
              }`}
              onClick={() => handleSelect(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}