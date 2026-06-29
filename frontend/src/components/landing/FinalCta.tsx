"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Flo from "./Flo";

export default function FinalCta() {
  return (
    <div id="final-cta" className="relative max-w-3xl mx-auto px-6 text-center">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none -z-10"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.16), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Flo size={72} className="mx-auto mb-6" />

        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide mb-4">── 2-minute setup</p>

        <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[var(--ink)] mb-4">
          Ready to{" "}
          <span className="bg-gradient-to-r from-[var(--indigo)] via-[var(--violet)] to-[var(--coral)] bg-clip-text text-transparent animate-sweep">
            deploy?
          </span>
        </h2>

        <p className="text-[var(--ink-2)] mb-8 max-w-md mx-auto leading-relaxed">
          Stop managing scattered dashboards. Centralize everything in one unified platform.
        </p>

        <Link href="/register">
          <button className="px-7 py-3.5 rounded-[11px] text-white font-medium shadow-[0_10px_30px_rgba(139,92,246,0.35)] bg-[linear-gradient(100deg,var(--indigo),var(--violet),var(--coral))] animate-shimmer">
            Create your account →
          </button>
        </Link>

        <p className="text-xs text-[var(--ink-3)] mt-12">
          © 2026 ArbFlow Systems · built by Pranav Shukla
        </p>
      </motion.div>
    </div>
  );
}
