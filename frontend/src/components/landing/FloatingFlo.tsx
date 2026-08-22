"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import { useRouter } from "next/navigation";

const LINES = [
  "Hi! I'm Flo 👋",
  "Your numbers look good today ✨",
  "Acme's up 34% — nice work!",
  "I read your GA4 so you don't have to 😌",
  "Tap 'Start free' and let's roll →",
];

const STAR_COLORS = ["#5b5bd6", "#8b5cf6", "#ff6b5e", "#f5a623", "#14b8a6"];

type Star = { id: number; bx: number; by: number; color: string; size: number; rotate: number };
let seed = 0;

export default function FloatingFlo() {
  const router = useRouter();
  const reduceMotion = useReducedMotionSafe();
  const { scrollY } = useScroll();
  const sway = useTransform(scrollY, (v) => Math.sin(v / 90) * 9);
  const uid = useId().replace(/:/g, "");
  const bodyGradId = `floWidgetBody-${uid}`;
  const tailGradId = `floWidgetTail-${uid}`;

  const [lineIndex, setLineIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [phase, setPhase] = useState<"idle" | "windup" | "spin">("idle");
  const [stars, setStars] = useState<Star[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const spawnStars = () => {
    const count = 7 + Math.floor(Math.random() * 4);
    const newStars: Star[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 40;
      seed += 1;
      return {
        id: seed,
        bx: Math.cos(angle) * distance,
        by: Math.sin(angle) * distance,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        size: 9 + Math.random() * 7,
        rotate: Math.random() * 180,
      };
    });

    newStars.forEach((star, i) => {
      setTimeout(() => {
        setStars((prev) => [...prev, star]);
        setTimeout(() => {
          setStars((prev) => prev.filter((s) => s.id !== star.id));
        }, 800);
      }, (i / Math.max(newStars.length - 1, 1)) * 150);
    });
  };

  const handleTap = () => {
    setLineIndex((i) => (i + 1) % LINES.length);
    setShowBubble(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowBubble(false), 2800);

    if (reduceMotion) {
      spawnStars();
      return;
    }

    if (spinningRef.current) return;
    spinningRef.current = true;

    setPhase("windup");
    spawnStars();
    setTimeout(() => setPhase("spin"), 80);
    setTimeout(() => {
      setPhase("idle");
      spinningRef.current = false;
    }, 80 + 1250);
  };

  const spinAnimate =
    phase === "windup"
      ? { rotateY: -15, y: -2 }
      : phase === "spin"
        ? { rotateY: 360, y: [0, -16, 0] }
        : { rotateY: 0, y: 0 };

  const spinTransition =
    phase === "windup"
      ? { duration: 0.08, ease: "easeOut" as const }
      : phase === "spin"
        ? {
            rotateY: { duration: 1.25, ease: [0.34, 1.1, 0.4, 1] as const },
            y: { duration: 1.25, ease: "easeInOut" as const },
          }
        : { duration: 0 };

  const handlePrimary = () => {
    const cta = document.getElementById("final-cta");
    if (cta) {
      cta.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      router.push("/register");
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      style={reduceMotion ? undefined : { rotate: sway }}
    >
      {showBubble && (
        <div className="absolute bottom-[calc(100%+10px)] right-0 max-w-[220px] rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-[0_10px_30px_rgba(20,18,46,0.12)] px-4 py-2.5 text-sm text-[var(--ink)]">
          {LINES[lineIndex]}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[var(--surface)] border-r border-b border-[var(--line)] rotate-45" />
        </div>
      )}

      <div className="relative">
        <motion.button
          type="button"
          aria-label="Open Flo, your ArbFlow assistant"
          onClick={() => {
            handleTap();
            handlePrimary();
          }}
          className={`relative block rounded-full drop-shadow-[0_8px_24px_rgba(91,91,214,0.35)] ${!reduceMotion ? "flo-bob" : ""}`}
          style={{ perspective: 400, transformStyle: "preserve-3d" }}
          animate={spinAnimate}
          transition={spinTransition}
        >
          <svg viewBox="0 0 140 150" width={56} height={60} aria-hidden="true">
            <defs>
              <linearGradient id={bodyGradId} x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0" stopColor="#6d6af0" />
                <stop offset="0.55" stopColor="#7c5cf0" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id={tailGradId} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#6366f1" />
                <stop offset="0.5" stopColor="#ff6b5e" />
                <stop offset="1" stopColor="#f5a623" />
              </linearGradient>
            </defs>
            <ellipse cx="56" cy="142" rx="9" ry="5" fill="#6d6af0" />
            <ellipse cx="84" cy="142" rx="9" ry="5" fill="#6d6af0" />
            <path d="M96 72C112 63 121 47 124 28" stroke={`url(#${tailGradId})`} strokeWidth="8" strokeLinecap="round" fill="none" />
            <g className={!reduceMotion ? "flo-spark" : ""}>
              <path d="M124 20l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z" fill="#f5a623" />
            </g>
            <path
              d="M70 50C96 50 110 69 110 95C110 123 93 139 70 139C47 139 30 123 30 95C30 69 44 50 70 50Z"
              fill={`url(#${bodyGradId})`}
            />
            <ellipse cx="54" cy="80" rx="15" ry="11" fill="#fff" opacity="0.18" />
            <circle cx="50" cy="104" r="7" fill="#ff8a7a" opacity="0.55" />
            <circle cx="90" cy="104" r="7" fill="#ff8a7a" opacity="0.55" />
            <g className={!reduceMotion ? "flo-eyes" : ""}>
              <ellipse cx="58" cy="92" rx="6.5" ry="8.5" fill="#fff" />
              <ellipse cx="82" cy="92" rx="6.5" ry="8.5" fill="#fff" />
              <circle cx="59.5" cy="94" r="3.4" fill="#1d1b3a" />
              <circle cx="83.5" cy="94" r="3.4" fill="#1d1b3a" />
              <circle cx="58" cy="91.5" r="1.1" fill="#fff" />
              <circle cx="82" cy="91.5" r="1.1" fill="#fff" />
            </g>
            <path d="M62 110Q70 119 78 110" stroke="#1d1b3a" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </svg>

          {stars.map((star) => (
            <span
              key={star.id}
              aria-hidden="true"
              className="flo-burst-star absolute left-1/2 top-1/2 pointer-events-none"
              style={
                {
                  "--bx": `${star.bx}px`,
                  "--by": `${star.by}px`,
                  color: star.color,
                  fontSize: `${star.size}px`,
                  transform: `rotate(${star.rotate}deg)`,
                  animationDuration: "0.8s",
                } as React.CSSProperties
              }
            >
              ✦
            </span>
          ))}
        </motion.button>
      </div>
    </motion.div>
  );
}
