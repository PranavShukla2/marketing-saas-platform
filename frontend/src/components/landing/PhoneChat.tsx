"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Flo from "./Flo";
import Sticker from "./Sticker";
import Annotation from "./Annotation";

const FEATURES = [
  { color: "var(--teal)", text: "Daily digest, not a data dump" },
  { color: "var(--violet)", text: "Anomalies flagged in plain English" },
  { color: "var(--coral)", text: "Push the second it matters" },
];

const BUBBLES = [
  { from: "in" as const, text: <>morning ☀️ Acme sessions up <strong>34%</strong> — organic search led it.</> },
  { from: "in" as const, text: <>checkout funnel spiked: <strong>+182</strong> conversions today 🎉</> },
  { from: "out" as const, text: <>nice. what about /pricing?</> },
  { from: "in" as const, text: <>bounce rate creeping there 👀 want me to flag it weekly?</> },
];

const REST_ROTATE_Y = -14;
const REST_ROTATE_X = 6;
const HOVER_ROTATE_Y = -5;
const HOVER_ROTATE_X = 2;

export default function PhoneChat() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  const rotateY = useMotionValue(REST_ROTATE_Y);
  const rotateX = useMotionValue(REST_ROTATE_X);
  const springY = useSpring(rotateY, { stiffness: 120, damping: 16 });
  const springX = useSpring(rotateX, { stiffness: 120, damping: 16 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse" || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(REST_ROTATE_Y + px * 10);
    rotateX.set(REST_ROTATE_X - py * 8);
  };

  const handlePointerLeave = () => {
    rotateY.set(REST_ROTATE_Y);
    rotateX.set(REST_ROTATE_X);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-10 lg:gap-24">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full md:w-[420px] md:flex-shrink-0"
      >
        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-4">── straight to your phone</p>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-[var(--ink)] mb-2 leading-[1.05]">
          You build.
          <br />
          <span className="bg-gradient-to-r from-[var(--indigo)] via-[var(--violet)] to-[var(--coral)] bg-clip-text text-transparent animate-sweep">
            We do the numbers.
          </span>
        </h2>
        <p className="text-lg text-[var(--ink-2)] mt-4 mb-6 leading-relaxed max-w-md">
          Connect GA4 once and ArbFlow turns the firehose into a calm daily digest — what changed, why, and where to look. Pinged to you the moment it matters.
        </p>

        <ul className="space-y-3 mb-8">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.text}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.12, ease: "easeOut" }}
              className="flex items-center gap-3 text-[15px] text-[var(--ink)]"
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${f.color} 16%, transparent)` }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              {f.text}
            </motion.li>
          ))}
        </ul>

        <button className="px-6 py-3 rounded-xl bg-[var(--ink)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          Get the digest →
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="relative flex-shrink-0 flex justify-center"
        style={{ perspective: 1200 }}
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="hidden lg:block pointer-events-none" aria-hidden="true">
          <Sticker className="absolute -top-2 -right-2 z-30" color="var(--coral)" rotate={8} delay={0.2} solid>
            ping! 🔔
          </Sticker>
          <Sticker className="absolute top-[52%] -left-16 z-30" color="var(--teal)" rotate={-7} delay={0.45}>
            +182 today
          </Sticker>
          <Annotation
            text="real-time alerts"
            arrow="swoop-right"
            color="var(--indigo)"
            rotate={-9}
            arrowSize={58}
            className="absolute top-16 -left-24 items-end"
          />
        </div>

        <motion.div
          animate={!reduceMotion ? { y: [0, -6, 0] } : {}}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            style={{
              rotateY: reduceMotion ? 0 : springY,
              rotateX: reduceMotion ? 0 : springX,
              transformStyle: "preserve-3d",
              width: "clamp(232px, 22vw, 268px)",
              aspectRatio: "9 / 19.5",
            }}
            whileHover={
              !reduceMotion
                ? { rotateY: HOVER_ROTATE_Y, rotateX: HOVER_ROTATE_X, transition: { duration: 0.5, ease: "easeOut" } }
                : {}
            }
            className="relative rounded-[38px] bg-[#15132e] p-[7px] shadow-[24px_30px_60px_rgba(20,18,46,0.28)]"
          >
            <div className="relative w-full h-full rounded-[30px] bg-white overflow-hidden">
              {/* sheen */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background:
                    "linear-gradient(115deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.18) 100%)",
                }}
              />

              <div className="relative flex items-center justify-center py-1.5 bg-white">
                <div className="absolute top-1 w-16 h-4 rounded-full bg-[#15132e]" />
                <div className="w-full flex items-center justify-between px-4 pt-2.5 text-[11px] font-medium text-[var(--ink)]">
                  <span>9:41</span>
                  <span className="flex items-center gap-1">
                    <svg width="11" height="8" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" /><rect x="4.5" y="5" width="3" height="7" /><rect x="9" y="2" width="3" height="10" /><rect x="13.5" y="0" width="3" height="12" /></svg>
                    <svg width="11" height="8" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 2c2.8 0 5.3 1 7.2 2.7l-1.4 1.5C12.3 4.9 10.2 4 8 4S3.7 4.9 2.2 6.2L.8 4.7C2.7 3 5.2 2 8 2zM8 6.4c1.6 0 3 .6 4.1 1.5l-1.4 1.5C10 8.7 9 8.4 8 8.4s-2 .3-2.7.9L3.9 7.9C5 7 6.4 6.4 8 6.4zM8 10a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 8 10z" /></svg>
                    <svg width="16" height="8" viewBox="0 0 24 12" fill="none" stroke="currentColor" aria-hidden="true"><rect x="1" y="1" width="20" height="10" rx="2" /><rect x="22" y="4" width="1.5" height="4" fill="currentColor" /><rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor" /></svg>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--line)]">
                <Flo variant="mark" size={20} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[var(--ink)]">ArbFlow</p>
                  <p className="text-[9px] text-[var(--teal)] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[var(--teal)] inline-block animate-pulse-dot" /> active now
                  </p>
                </div>
              </div>

              <div className="px-2.5 py-3 space-y-[9px] bg-[#fbfaff]" style={{ minHeight: "calc(100% - 80px)" }}>
                {BUBBLES.map((bubble, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.18, ease: "easeOut" }}
                    className={`flex ${bubble.from === "out" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-2 py-[8px] text-[12px] leading-relaxed ${
                        bubble.from === "out"
                          ? "bg-gradient-to-r from-[var(--indigo)] to-[var(--violet)] text-white"
                          : "bg-[#efeaff] text-[var(--ink)]"
                      }`}
                    >
                      {bubble.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
