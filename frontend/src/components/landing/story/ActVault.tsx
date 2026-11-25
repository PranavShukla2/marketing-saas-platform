"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { KeyRound, Lock } from "lucide-react";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";
import { Act } from "./Act";

/*
 * What's stored when a client connects: their Google OAuth token never sits in
 * the database as-is — it's sealed with Fernet first. Both strings below are
 * illustrative, but each has its real shape: Google access tokens start
 * "ya29.", and every Fernet token starts "gAAAAA" (its version byte, 0x80, and
 * a timestamp, base64url-encoded).
 */
const PLAIN = "ya29.a0AfB_byC7kLm2Qx9vT4nWzR8pHs1eJd6uYgN3oKcVbFi0Ml5aEtXrUq";
const SEALED = "gAAAAABnR4kX2pVd8sQzL0mYwE7tHcN5uJbK1oFa9iGx3eRvT6lMn2yPqU8hWd";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function Sealing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotionSafe();
  // How many leading characters have settled into the sealed value.
  const [progress, setSettled] = useState(-1);
  // Under reduced motion it's simply shown sealed — derived, not set.
  const settled = reduce ? SEALED.length : progress;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    let n = 0;
    const id = setInterval(() => {
      n += 2;
      setSettled(n);
      setTick((t) => t + 1);
      if (n >= SEALED.length) clearInterval(id);
    }, 34);
    const start = setTimeout(() => setSettled(0), 0);
    return () => { clearInterval(id); clearTimeout(start); };
  }, [inView, reduce]);

  const sealed = settled >= SEALED.length;
  const shown =
    settled < 0
      ? PLAIN
      : SEALED.split("")
          .map((c, i) => (i < settled ? c : i < settled + 6 ? GLYPHS[(i * 7 + tick * 13) % GLYPHS.length] : PLAIN[i] ?? ""))
          .join("");

  return (
    <div ref={ref} className="rounded-[var(--radius-lg)] bg-[var(--deep)] p-5 text-[#eef1f8] shadow-[var(--shadow-overlay)] ring-1 ring-white/5">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className="flex items-center gap-1.5 text-[#8f98b3]">
          <KeyRound className="size-3" /> {sealed ? "stored as" : "google oauth token"}
        </span>
        <span className={sealed ? "text-[#2dd4bf]" : "text-[#8f98b3]"}>{sealed ? "fernet · sealed" : "in transit"}</span>
      </div>
      <p className="mt-3 break-all font-mono text-[13px] leading-relaxed text-[#b3bad0]" aria-hidden="true">
        {shown}
      </p>
      <p className="sr-only">An OAuth token is encrypted with Fernet before it is stored.</p>
    </div>
  );
}

function Lanes() {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {["Northwind Co.", "Harbor Health", "Globex Retail"].map((w) => (
        <div key={w} className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">workspace</span>
            <Lock className="size-3.5 text-[var(--ink-3)]" />
          </div>
          <p className="mt-2 truncate text-sm font-medium text-[var(--ink)]">{w}</p>
          <p className="mt-0.5 text-xs text-[var(--ink-3)]">Its own data, members and connections</p>
        </div>
      ))}
    </div>
  );
}

export default function ActVault() {
  return (
    <Act
      index={4}
      flip
      title={<>Your clients&apos; access, <span className="accent-serif">kept sealed.</span></>}
      body={
        <p>
          The keys a client grants you are the most sensitive thing in an agency&apos;s stack. ArbFlow encrypts them before
          they&apos;re stored and keeps every client&apos;s data inside its own workspace.
        </p>
      }
      facts={[
        "OAuth tokens encrypted at rest with Fernet (AES-128 + HMAC-SHA256)",
        "Sessions in httpOnly cookies — never readable by page scripts",
        "Roles per workspace, and an audit log of sign-ins, resets and exports",
      ]}
      visual={
        <div>
          <Sealing />
          <Lanes />
        </div>
      }
    />
  );
}
