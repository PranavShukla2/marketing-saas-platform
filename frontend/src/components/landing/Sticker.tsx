"use client";

import { motion } from "framer-motion";

interface StickerProps {
  children: React.ReactNode;
  color?: string;
  tint?: string;
  rotate?: number;
  className?: string;
  delay?: number;
  /** floats gently when true */
  float?: boolean;
  solid?: boolean;
}

/** A small rotated, vibrant pill used as a scattered decorative accent. */
export default function Sticker({
  children,
  color = "var(--violet)",
  tint = "var(--surface)",
  rotate = -5,
  className = "",
  delay = 0,
  float = true,
  solid = false,
}: StickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: rotate - 8 }}
      whileInView={{ opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay }}
      whileHover={{ scale: 1.08, rotate: 0 }}
      className={`pointer-events-auto select-none ${className}`}
      style={{ ["--rot" as string]: `${rotate}deg` }}
    >
      <div
        className={`${float ? "animate-float-soft" : ""} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap shadow-[0_8px_22px_rgba(20,18,46,0.12)] border`}
        style={
          solid
            ? { background: color, color: "#fff", borderColor: "transparent", animationDelay: `${delay}s` }
            : { background: tint, color, borderColor: "color-mix(in srgb, " + color + " 28%, transparent)", animationDelay: `${delay}s` }
        }
      >
        {children}
      </div>
    </motion.div>
  );
}
