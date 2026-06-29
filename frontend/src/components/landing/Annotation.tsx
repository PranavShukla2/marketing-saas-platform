"use client";

import { motion, useReducedMotion } from "framer-motion";

type ArrowShape = "curl-down-right" | "curl-down-left" | "curl-up-right" | "swoop-left" | "swoop-right";

// Hand-drawn-style curved arrow paths (viewBox 0 0 100 100), each ending in an arrowhead.
const ARROWS: Record<ArrowShape, { d: string; head: string }> = {
  "curl-down-right": {
    d: "M8 12 C 8 50, 30 78, 78 84",
    head: "M78 84 L 64 82 M78 84 L 72 72",
  },
  "curl-down-left": {
    d: "M92 12 C 92 50, 70 78, 22 84",
    head: "M22 84 L 36 82 M22 84 L 28 72",
  },
  "curl-up-right": {
    d: "M8 88 C 8 50, 30 22, 78 16",
    head: "M78 16 L 64 18 M78 16 L 72 28",
  },
  "swoop-left": {
    d: "M94 30 C 60 22, 24 30, 12 62",
    head: "M12 62 L 24 54 M12 62 L 22 68",
  },
  "swoop-right": {
    d: "M6 30 C 40 22, 76 30, 88 62",
    head: "M88 62 L 76 54 M88 62 L 78 68",
  },
};

interface AnnotationProps {
  text: string;
  arrow?: ArrowShape;
  color?: string;
  rotate?: number;
  className?: string;
  /** size of the arrow box in px */
  arrowSize?: number;
  /** put the arrow above the text instead of below */
  arrowFirst?: boolean;
  textClassName?: string;
}

export default function Annotation({
  text,
  arrow = "curl-down-right",
  color = "var(--violet)",
  rotate = -4,
  className = "",
  arrowSize = 56,
  arrowFirst = false,
  textClassName = "text-xl",
}: AnnotationProps) {
  const reduceMotion = useReducedMotion();
  const shape = ARROWS[arrow];

  const arrowEl = (
    <svg
      width={arrowSize}
      height={arrowSize}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <motion.path
        d={shape.d}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <motion.path
        d={shape.head}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.25, delay: 0.7 }}
      />
    </svg>
  );

  return (
    <div
      className={`pointer-events-none select-none flex flex-col items-center gap-0.5 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {arrowFirst && arrowEl}
      <span className={`font-hand leading-none ${textClassName}`} style={{ color }}>
        {text}
      </span>
      {!arrowFirst && arrowEl}
    </div>
  );
}
