import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Skills.css";

gsap.registerPlugin(ScrollTrigger);

const skillGroups = [
  {
    title: "UI",
    label: "UI",
    text: "Entwicklung klarer, responsiver Interfaces mit sauberer Struktur und konsistenter Nutzerführung.",
    accent: "blue",
  },
  {
    title: "Logic",
    label: "Logic",
    text: "Anwendungslogik, Datenflüsse und robuste Prozesse für funktionale und nachvollziehbare Systeme.",
    accent: "violet",
  },
  {
    title: "Media",
    label: "Media",
    text: "Räumliches Denken, Gestaltung und Sound als Erweiterung digitaler Produkte und interaktiver Konzepte.",
    accent: "amber",
  },
  {
    title: "Engineering",
    label: "Engineering",
    text: "Praxis aus Mechatronik, Fahrzeugbau und eigenentwickelten technischen Systemen mit realem Funktionsbezug.",
    accent: "emerald",
  },
];

const floatingSkills = [
  { label: "React", tone: "ui", zone: "frontend", x: 0.24, y: 0.22, speed: 25, phase: 0.2 },
  { label: "UX Systems", tone: "ui", zone: "frontend", x: 0.18, y: 0.42, speed: 25, phase: 1.1 },
  { label: "HTML", tone: "ui", zone: "frontend", x: 0.32, y: 0.32, speed: 25, phase: 0.75 },
  { label: "CSS", tone: "ui", zone: "frontend", x: 0.12, y: 0.28, speed: 25, phase: 1.45 },

  { label: "Python", tone: "logic", zone: "backend", x: 0.78, y: 0.22, speed: 25, phase: 1.8 },
  { label: "SQL", tone: "logic", zone: "backend", x: 0.87, y: 0.41, speed: 25, phase: 2.7 },
  { label: "Django", tone: "logic", zone: "backend", x: 0.68, y: 0.34, speed: 25, phase: 2.2 },
  { label: "APIs", tone: "logic", zone: "backend", x: 0.82, y: 0.3, speed: 25, phase: 2.95 },

  { label: "CAD", tone: "media", zone: "media", x: 0.28, y: 0.78, speed: 25, phase: 3.4 },
  { label: "Audio", tone: "media", zone: "media", x: 0.46, y: 0.87, speed: 25, phase: 4.1 },
  { label: "Graphic", tone: "media", zone: "media", x: 0.18, y: 0.66, speed: 25, phase: 3.85 },
  { label: "Video", tone: "media", zone: "media", x: 0.38, y: 0.68, speed: 25, phase: 4.45 },

  { label: "Systems", tone: "engineering", zone: "engineering", x: 0.78, y: 0.82, speed: 25, phase: 4.9 },
  { label: "Prototyping", tone: "engineering", zone: "engineering", x: 0.63, y: 0.9, speed: 25, phase: 5.5 },
  { label: "Automation", tone: "engineering", zone: "engineering", x: 0.69, y: 0.7, speed: 25, phase: 5.05 },
  { label: "Robotics", tone: "engineering", zone: "engineering", x: 0.86, y: 0.68, speed: 25, phase: 5.75 },
];

const zoneLabels = [
  { label: "UI", tone: "ui", posClass: "top-left" },
  { label: "Logic", tone: "logic", posClass: "top-right" },
  { label: "Media", tone: "media", posClass: "bottom-left" },
  { label: "Engineering", tone: "engineering", posClass: "bottom-right" },
];

export default function Skills() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const fieldRef = useRef(null);
  const coreRef = useRef(null);
  const badgeRefs = useRef([]);
  const zoneLabelRefs = useRef([]);

  const hasPlayedRef = useRef(false);
  const isSequenceLockedRef = useRef(false);
  const sequenceTlRef = useRef(null);
  const sequenceStartTimeoutRef = useRef(null);
  const skipWheelCountRef = useRef(0);
  const skipWheelResetTimeoutRef = useRef(null);

  useLayoutEffect(() => {
    let removeBadgeTicker = null;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = () => window.matchMedia("(min-width: 1081px)").matches;
      const HEADER_SNAP_OFFSET = 10;
      const SKIP_SCROLL_COUNT = 4;
      const ACTIVATION_ZONE_PX = 80;
      const ACTIVATION_NEGATIVE_TOLERANCE = -40;

      const setHiddenState = () => {
        gsap.set(".skill-cluster", {
          autoAlpha: 0,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 0.9,
          filter: "blur(14px)",
        });

        gsap.set(".skills-visual", {
          autoAlpha: 0,
          y: 24,
          filter: "blur(10px)",
        });
      };

      const setFinishedState = () => {
        gsap.set(".skill-cluster", {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          filter: "blur(0px)",
        });

        gsap.set(".skills-visual", {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
        });
      };

      const resetSkipCounter = () => {
        skipWheelCountRef.current = 0;
        window.clearTimeout(skipWheelResetTimeoutRef.current);
      };

      const registerSkipIntent = () => {
        skipWheelCountRef.current += 1;

        window.clearTimeout(skipWheelResetTimeoutRef.current);
        skipWheelResetTimeoutRef.current = window.setTimeout(() => {
          skipWheelCountRef.current = 0;
        }, 700);

        return skipWheelCountRef.current >= SKIP_SCROLL_COUNT;
      };

      const unlockSequenceScroll = () => {
        isSequenceLockedRef.current = false;
        resetSkipCounter();
      };

      const lockSequenceScroll = () => {
        isSequenceLockedRef.current = true;
        resetSkipCounter();
      };

      const snapToSkillsTop = () => {
        if (!headerRef.current) return;

        const targetY = Math.round(
          window.scrollY + headerRef.current.getBoundingClientRect().top - HEADER_SNAP_OFFSET
        );

        window.scrollTo(0, targetY);

        requestAnimationFrame(() => {
          window.scrollTo(0, targetY);
        });
      };

      const finishSequenceImmediately = () => {
        window.clearTimeout(sequenceStartTimeoutRef.current);

        if (sequenceTlRef.current) {
          sequenceTlRef.current.pause();
          sequenceTlRef.current.progress(1);
        } else {
          setFinishedState();
        }

        unlockSequenceScroll();
      };

      const resetSequence = () => {
        window.clearTimeout(sequenceStartTimeoutRef.current);
        window.clearTimeout(skipWheelResetTimeoutRef.current);
        unlockSequenceScroll();
        hasPlayedRef.current = false;

        if (sequenceTlRef.current) {
          sequenceTlRef.current.pause(0);
        }

        setHiddenState();
      };

      const playSequence = () => {
        if (!sequenceTlRef.current || hasPlayedRef.current) return;

        hasPlayedRef.current = true;
        lockSequenceScroll();

        window.clearTimeout(sequenceStartTimeoutRef.current);

        snapToSkillsTop();

        requestAnimationFrame(() => {
          snapToSkillsTop();
        });

        sequenceStartTimeoutRef.current = window.setTimeout(() => {
          sequenceTlRef.current.play(0);
        }, 460);
      };

      const wheelLockHandler = (event) => {
        if (!isDesktop()) return;

        const rect = sectionRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (isSequenceLockedRef.current) {
          const wantsSkip = event.deltaY > 0 && registerSkipIntent();

          event.preventDefault();
          event.stopPropagation();

          if (wantsSkip) {
            finishSequenceImmediately();
            return;
          }

          snapToSkillsTop();
          return;
        }

        const isAtActivationEdge =
          rect.top <= ACTIVATION_ZONE_PX &&
          rect.top >= ACTIVATION_NEGATIVE_TOLERANCE;

        const enteringFromStory =
          !hasPlayedRef.current &&
          event.deltaY > 0 &&
          isAtActivationEdge;

        if (enteringFromStory) {
          event.preventDefault();
          event.stopPropagation();
          playSequence();
        }
      };

      const touchMoveLockHandler = (event) => {
        if (!isDesktop()) return;

        if (isSequenceLockedRef.current) {
          event.preventDefault();
          event.stopPropagation();
          snapToSkillsTop();
        }
      };

      const keyLockHandler = (event) => {
        if (!isDesktop()) return;
        if (!isSequenceLockedRef.current) return;

        const blockedKeys = [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ];

        if (blockedKeys.includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          snapToSkillsTop();
        }
      };

      window.addEventListener("wheel", wheelLockHandler, { passive: false });
      window.addEventListener("touchmove", touchMoveLockHandler, { passive: false });
      window.addEventListener("keydown", keyLockHandler, { passive: false });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 22%",
        end: "top top",
        onEnter: () => {
          if (!isDesktop() || hasPlayedRef.current) return;
          playSequence();
        },
        onEnterBack: () => {
          if (!isDesktop() || hasPlayedRef.current) return;
          playSequence();
        },
        onUpdate: (self) => {
          if (!isDesktop() || hasPlayedRef.current) return;
          if (self.direction !== 1) return;

          const rect = sectionRef.current?.getBoundingClientRect();
          if (!rect) return;

          const isCloseEnough = rect.top <= 72;

          if (isCloseEnough) {
            playSequence();
          }
        },
        onLeaveBack: () => {
          if (!isDesktop()) return;
          resetSequence();
        },
      });

      gsap.from(".skills-header > *", {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ".skills-header",
          start: "top 82%",
          toggleActions: "play none none reset",
        },
      });

      setHiddenState();

      const cardTl = gsap.timeline();

      cardTl
        .fromTo(
          ".skill-cluster:nth-child(1)",
          {
            x: -190,
            y: -190,
            rotate: -9,
            scale: 0.9,
            autoAlpha: 0,
            filter: "blur(14px)",
          },
          {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.58,
            ease: "power3.out",
          }
        )
        .to({}, { duration: 0.12 })

        .fromTo(
          ".skill-cluster:nth-child(4)",
          {
            x: 190,
            y: 190,
            rotate: 9,
            scale: 0.9,
            autoAlpha: 0,
            filter: "blur(14px)",
          },
          {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.58,
            ease: "power3.out",
          }
        )
        .to({}, { duration: 0.12 })

        .fromTo(
          ".skill-cluster:nth-child(2)",
          {
            x: 190,
            y: -190,
            rotate: 9,
            scale: 0.9,
            autoAlpha: 0,
            filter: "blur(14px)",
          },
          {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.58,
            ease: "power3.out",
          }
        )
        .to({}, { duration: 0.12 })

        .fromTo(
          ".skill-cluster:nth-child(3)",
          {
            x: -190,
            y: 190,
            rotate: -9,
            scale: 0.9,
            autoAlpha: 0,
            filter: "blur(14px)",
          },
          {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.58,
            ease: "power3.out",
          }
        )
        .to({}, { duration: 0.16 });

      const sequenceTl = gsap.timeline({
        paused: true,
        defaults: {
          overwrite: "auto",
        },
        onComplete: () => {
          unlockSequenceScroll();
        },
      });

      sequenceTl
        .to({}, { duration: 0.18 })
        .add("sequenceStart")

        .fromTo(
          ".skills-visual",
          {
            autoAlpha: 0,
            y: 24,
            filter: "blur(10px)",
          },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: cardTl.duration(),
            ease: "power2.out",
          },
          "sequenceStart"
        )

        .add(cardTl, "sequenceStart");

      sequenceTlRef.current = sequenceTl;

      if (reduceMotion || !fieldRef.current || !coreRef.current) {
        return () => {
          window.removeEventListener("wheel", wheelLockHandler);
          window.removeEventListener("touchmove", touchMoveLockHandler);
          window.removeEventListener("keydown", keyLockHandler);
          window.clearTimeout(sequenceStartTimeoutRef.current);
          window.clearTimeout(skipWheelResetTimeoutRef.current);
        };
      }

      const field = fieldRef.current;
      const core = coreRef.current;

      const layout = {
        width: 0,
        height: 0,
        centerX: 0,
        centerY: 0,
        coreRadius: 0,
      };

      const zoneBounds = {
        frontend: { left: 0, right: 0, top: 0, bottom: 0 },
        backend: { left: 0, right: 0, top: 0, bottom: 0 },
        media: { left: 0, right: 0, top: 0, bottom: 0 },
        engineering: { left: 0, right: 0, top: 0, bottom: 0 },
      };

      const labelBounds = [];

      const state = floatingSkills.map((skill, index) => ({
        ...skill,
        anchorX: skill.x,
        anchorY: skill.y,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        width: 0,
        height: 0,
        initialized: false,
        el: badgeRefs.current[index],
      }));

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      const keepSpeed = (item) => {
        const length = Math.hypot(item.vx, item.vy) || 1;
        item.vx = (item.vx / length) * item.speed;
        item.vy = (item.vy / length) * item.speed;
      };

      const reflectAgainstNormal = (item, nx, ny, restitution = 1) => {
        const dot = item.vx * nx + item.vy * ny;
        if (dot >= 0) return;

        item.vx = item.vx - (1 + restitution) * dot * nx;
        item.vy = item.vy - (1 + restitution) * dot * ny;
        keepSpeed(item);
      };

      const updateZoneBounds = () => {
        const gutter = 24;
        const dividerGap = 16;
        const centerX = layout.centerX;
        const centerY = layout.centerY;

        zoneBounds.frontend = {
          left: gutter,
          right: centerX - dividerGap,
          top: gutter,
          bottom: centerY - dividerGap,
        };

        zoneBounds.backend = {
          left: centerX + dividerGap,
          right: layout.width - gutter,
          top: gutter,
          bottom: centerY - dividerGap,
        };

        zoneBounds.media = {
          left: gutter,
          right: centerX - dividerGap,
          top: centerY + dividerGap,
          bottom: layout.height - gutter,
        };

        zoneBounds.engineering = {
          left: centerX + dividerGap,
          right: layout.width - gutter,
          top: centerY + dividerGap,
          bottom: layout.height - gutter,
        };
      };

      const refreshLabelBounds = () => {
        labelBounds.length = 0;

        zoneLabelRefs.current.forEach((el) => {
          if (!el) return;

          const fieldRect = field.getBoundingClientRect();
          const rect = el.getBoundingClientRect();

          labelBounds.push({
            left: rect.left - fieldRect.left,
            right: rect.right - fieldRect.left,
            top: rect.top - fieldRect.top,
            bottom: rect.bottom - fieldRect.top,
          });
        });
      };

      const refreshLayout = () => {
        const fieldRect = field.getBoundingClientRect();
        const coreRect = core.getBoundingClientRect();
        const coreLeft = coreRect.left - fieldRect.left;
        const coreTop = coreRect.top - fieldRect.top;

        layout.width = fieldRect.width;
        layout.height = fieldRect.height;
        layout.centerX = coreLeft + coreRect.width / 2;
        layout.centerY = coreTop + coreRect.height / 2;
        layout.coreRadius = coreRect.width / 2 + 16;

        updateZoneBounds();
        refreshLabelBounds();

        state.forEach((item) => {
          if (!item.el) return;

          const bounds = item.el.getBoundingClientRect();
          item.width = bounds.width;
          item.height = bounds.height;

          const nextX = layout.width * item.anchorX;
          const nextY = layout.height * item.anchorY;

          if (!item.initialized) {
            item.x = nextX;
            item.y = nextY;

            const angle = item.phase * 1.37;
            item.vx = Math.cos(angle) * item.speed;
            item.vy = Math.sin(angle) * item.speed;
            keepSpeed(item);
            item.initialized = true;
          }
        });
      };

      const applyBadgePositions = () => {
        state.forEach((item) => {
          if (!item.el) return;

          gsap.set(item.el, {
            x: item.x - item.width / 2,
            y: item.y - item.height / 2,
          });
        });
      };

      const collideWithZoneWalls = (item) => {
        const bounds = zoneBounds[item.zone];
        const halfW = item.width / 2;
        const halfH = item.height / 2;

        const minX = bounds.left + halfW;
        const maxX = bounds.right - halfW;
        const minY = bounds.top + halfH;
        const maxY = bounds.bottom - halfH;

        if (item.x < minX) {
          item.x = minX;
          reflectAgainstNormal(item, 1, 0, 1);
        }

        if (item.x > maxX) {
          item.x = maxX;
          reflectAgainstNormal(item, -1, 0, 1);
        }

        if (item.y < minY) {
          item.y = minY;
          reflectAgainstNormal(item, 0, 1, 1);
        }

        if (item.y > maxY) {
          item.y = maxY;
          reflectAgainstNormal(item, 0, -1, 1);
        }
      };

      const collideWithCore = (item) => {
        const dx = item.x - layout.centerX;
        const dy = item.y - layout.centerY;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const minDistance = layout.coreRadius + Math.max(item.width, item.height) * 0.35;

        if (distance >= minDistance) return;

        const nx = dx / distance;
        const ny = dy / distance;

        item.x = layout.centerX + nx * minDistance;
        item.y = layout.centerY + ny * minDistance;

        reflectAgainstNormal(item, nx, ny, 1);
      };

      const getRect = (item) => ({
        left: item.x - item.width / 2,
        right: item.x + item.width / 2,
        top: item.y - item.height / 2,
        bottom: item.y + item.height / 2,
      });

      const separateRects = (a, b, ax, ay, overlap) => {
        a.x -= ax * overlap * 0.5;
        a.y -= ay * overlap * 0.5;
        b.x += ax * overlap * 0.5;
        b.y += ay * overlap * 0.5;
      };

      const collideBadgePair = (a, b) => {
        const ra = getRect(a);
        const rb = getRect(b);

        const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        if (overlapX <= 0) return;

        const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (overlapY <= 0) return;

        let nx = 0;
        let ny = 0;
        let overlap = 0;

        if (overlapX < overlapY) {
          nx = a.x < b.x ? -1 : 1;
          ny = 0;
          overlap = overlapX;
        } else {
          nx = 0;
          ny = a.y < b.y ? -1 : 1;
          overlap = overlapY;
        }

        separateRects(a, b, -nx, -ny, overlap);

        const aDot = a.vx * nx + a.vy * ny;
        const bDot = b.vx * nx + b.vy * ny;

        a.vx += (bDot - aDot) * nx;
        a.vy += (bDot - aDot) * ny;

        b.vx += (aDot - bDot) * nx;
        b.vy += (aDot - bDot) * ny;

        keepSpeed(a);
        keepSpeed(b);

        collideWithZoneWalls(a);
        collideWithZoneWalls(b);
        collideWithCore(a);
        collideWithCore(b);
      };

      const collideWithFixedLabel = (item, box) => {
        const r = getRect(item);

        const overlapX = Math.min(r.right, box.right) - Math.max(r.left, box.left);
        if (overlapX <= 0) return;

        const overlapY = Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top);
        if (overlapY <= 0) return;

        if (overlapX < overlapY) {
          if (item.x < (box.left + box.right) / 2) {
            item.x -= overlapX;
            reflectAgainstNormal(item, -1, 0, 1);
          } else {
            item.x += overlapX;
            reflectAgainstNormal(item, 1, 0, 1);
          }
        } else {
          if (item.y < (box.top + box.bottom) / 2) {
            item.y -= overlapY;
            reflectAgainstNormal(item, 0, -1, 1);
          } else {
            item.y += overlapY;
            reflectAgainstNormal(item, 0, 1, 1);
          }
        }
      };

      const collideBadges = () => {
        for (let i = 0; i < state.length; i += 1) {
          for (let j = i + 1; j < state.length; j += 1) {
            collideBadgePair(state[i], state[j]);
          }
        }
      };

      const collideWithFixedLabels = () => {
        state.forEach((item) => {
          labelBounds.forEach((box) => {
            collideWithFixedLabel(item, box);
          });
        });
      };

      const updateBadges = (_, deltaTime = 16.67) => {
        const dt = deltaTime / 1000;

        state.forEach((item) => {
          keepSpeed(item);
          item.x += item.vx * dt;
          item.y += item.vy * dt;
        });

        state.forEach((item) => {
          collideWithZoneWalls(item);
          collideWithCore(item);
        });

        collideWithFixedLabels();
        collideBadges();

        state.forEach((item) => {
          keepSpeed(item);
        });

        applyBadgePositions();
      };

      refreshLayout();

      for (let pass = 0; pass < 4; pass += 1) {
        collideBadges();
        collideWithFixedLabels();
        state.forEach((item) => {
          collideWithZoneWalls(item);
          collideWithCore(item);
          keepSpeed(item);
        });
      }

      applyBadgePositions();

      const onResize = () => {
        refreshLayout();

        state.forEach((item) => {
          const bounds = zoneBounds[item.zone];
          item.x = clamp(item.x, bounds.left + item.width / 2, bounds.right - item.width / 2);
          item.y = clamp(item.y, bounds.top + item.height / 2, bounds.bottom - item.height / 2);
          keepSpeed(item);
        });

        for (let pass = 0; pass < 4; pass += 1) {
          collideBadges();
          collideWithFixedLabels();
          state.forEach((item) => {
            collideWithZoneWalls(item);
            collideWithCore(item);
            keepSpeed(item);
          });
        }

        applyBadgePositions();
      };

      window.addEventListener("resize", onResize);
      ScrollTrigger.addEventListener("refreshInit", onResize);
      gsap.ticker.add(updateBadges);

      removeBadgeTicker = () => {
        gsap.ticker.remove(updateBadges);
        window.removeEventListener("resize", onResize);
        ScrollTrigger.removeEventListener("refreshInit", onResize);
        window.removeEventListener("wheel", wheelLockHandler);
        window.removeEventListener("touchmove", touchMoveLockHandler);
        window.removeEventListener("keydown", keyLockHandler);
        window.clearTimeout(sequenceStartTimeoutRef.current);
        window.clearTimeout(skipWheelResetTimeoutRef.current);
      };
    }, sectionRef);

    return () => {
      if (removeBadgeTicker) removeBadgeTicker();
      window.clearTimeout(sequenceStartTimeoutRef.current);
      window.clearTimeout(skipWheelResetTimeoutRef.current);
      sequenceTlRef.current?.kill();
      ctx.revert();
    };
  }, []);

  return (
    <section className="skills section-shell" id="skills" ref={sectionRef}>
      <div className="skills-bg skills-bg--one" />
      <div className="skills-bg skills-bg--two" />

      <div className="skills-pin">
        <div className="skills-inner">
          <header className="skills-header" ref={headerRef}>
            <p className="section-kicker">Core Areas</p>
            <h2>
              Mein Profil verbindet <span>Software, Gestaltung und technische Praxis</span>.
            </h2>
            <p className="skills-header__text">
              Von UI und Logic bis Media und realen technischen Systemen.
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
                </article>
              ))}
            </div>

            <div className="skills-visual">
              <div className="skills-visual__noise" />
              <div className="skills-visual__grid" />

              <div className="skills-field" ref={fieldRef}>
                <div className="skills-field__divider skills-field__divider--vertical" />
                <div className="skills-field__divider skills-field__divider--horizontal" />

                <div className="skills-core" ref={coreRef}>
                  <div className="skills-core__inner">
                    <span className="skills-core__eyebrow">Profile</span>
                    <strong>Systemic builder</strong>
                    <small>Code, design and technical execution</small>
                  </div>
                </div>

                <div className="skills-core-pulse" />

                {zoneLabels.map((zone, index) => (
                  <span
                    key={zone.label}
                    ref={(el) => {
                      zoneLabelRefs.current[index] = el;
                    }}
                    className={`skills-zone-label skills-zone-label--${zone.tone} ${zone.posClass}`}
                  >
                    {zone.label}
                  </span>
                ))}

                {floatingSkills.map((skill, index) => (
                  <span
                    key={skill.label}
                    ref={(el) => {
                      badgeRefs.current[index] = el;
                    }}
                    className={`skills-float-tag skills-float-tag--${skill.tone}`}
                  >
                    {skill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}