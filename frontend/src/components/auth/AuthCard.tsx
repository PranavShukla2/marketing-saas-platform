"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, Mail } from "lucide-react";
import { Card } from "../ui";
import { cn } from "../../lib/cn";
import { DURATION, EASE_OUT } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import ConfluenceScene from "../confluence/ConfluenceScene";
import Flo from "../landing/Flo";

/**
 * The frame every auth page sits in.
 *
 * Six pages each carried their own copy of the same centred card — the same
 * max-w-md, the same rounded-3xl and shadow literal, the same gradient "A"
 * tile, the same motion values — and they had already drifted: three used
 * `text-3xl` for the heading and three `text-2xl`, and reset-password had
 * grown a local `shell()` helper to stop repeating it a fourth time within one
 * file.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  centered = false,
  icon,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** For result screens, where the body is a sentence rather than a form. */
  centered?: boolean;
  /** Shown above the title. Defaults to the brand tile; pass `null` for none. */
  icon?: React.ReactNode | null;
}) {
  const reduce = useReducedMotionSafe();
  return (
    // Split on wide screens: the Confluence beside the form, so signing in
    // feels like the same product as the landing. Below lg, just the card.
    <div className="grid min-h-[calc(100vh-6rem)] gap-6 bg-[var(--page)] p-4 sm:p-6 lg:grid-cols-[1.05fr_1fr]">
      <aside className="deep-water relative hidden overflow-hidden rounded-[var(--radius-xl)] lg:block" aria-hidden="true">
        <ConfluenceScene className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--deep)] via-[var(--deep)]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hero-ink-3)]">arbflow</p>
          <p className="mt-4 max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-[#eef1f8]">
            Every client. <span className="accent-serif text-[#b9a8ff]">One calm current.</span>
          </p>
          <p className="mt-4 max-w-sm text-[var(--hero-ink-2)]">
            Each client&apos;s analytics in one white-labeled workspace, and a sentence when something changes.
          </p>
        </div>
      </aside>

      <div className="flex items-center justify-center py-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_OUT }}
        className="w-full max-w-md"
      >
        <Card padding="lg" className="rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-raised)] sm:p-10">
          <div className={cn("mb-7", centered && "text-center")}>
            {icon !== null && (
              <div className={cn("mb-5 flex", centered && "justify-center")}>
                {icon ?? <Flo variant="mark" size={40} />}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-3xl">{title}</h1>
            {description && <p className="mt-2 text-sm text-[var(--ink-2)]">{description}</p>}
          </div>

          {children}

          {footer && (
            <div className="mt-7 border-t border-[var(--line)] pt-5 text-center text-sm text-[var(--ink-2)]">
              {footer}
            </div>
          )}
        </Card>
      </motion.div>
      </div>
    </div>
  );
}

/**
 * A result screen: the outcome of verifying an email, accepting an invite,
 * finishing a reset. Four pages hand-rolled three of these each, with the tone
 * colours written out inline every time.
 */
export function AuthResult({
  tone,
  title,
  description,
  children,
}: {
  tone: "pending" | "success" | "error" | "info";
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ICONS: Record<string, React.ReactNode> = {
    pending: <Loader2 className="size-6 animate-spin" />,
    success: <Check className="size-6" strokeWidth={2.5} />,
    error: <AlertTriangle className="size-6" />,
    info: <Mail className="size-6" />,
  };
  const TONES: Record<string, string> = {
    pending: "bg-[var(--accent)]/10 text-[var(--accent)]",
    success: "bg-[var(--success)]/12 text-[var(--success)]",
    error: "bg-[var(--danger)]/12 text-[var(--danger)]",
    info: "bg-[var(--accent)]/10 text-[var(--accent)]",
  };

  return (
    <AuthCard
      title={title}
      description={description}
      centered
      icon={
        <span
          aria-hidden="true"
          className={cn("flex size-14 items-center justify-center rounded-[var(--radius-lg)]", TONES[tone])}
        >
          {ICONS[tone]}
        </span>
      }
    >
      {children && <div className="mt-7 space-y-3">{children}</div>}
    </AuthCard>
  );
}

/**
 * A form-level message. Success uses role="status" and failure role="alert",
 * so a screen reader hears the outcome without the user hunting for it —
 * these pages previously announced neither.
 */
export function AuthAlert({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        tone === "error"
          ? "border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]"
          : "border-[var(--success)]/25 bg-[var(--success)]/10 text-[var(--success)]"
      )}
    >
      {children}
    </p>
  );
}

/** A plain text link in the auth footer — used by every page. */
export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded font-medium text-[var(--accent)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {children}
    </Link>
  );
}
