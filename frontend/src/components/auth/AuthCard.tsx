"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, Mail } from "lucide-react";
import { Card } from "../ui";
import { cn } from "../../lib/cn";
import { DURATION, EASE_OUT } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--page)] p-6">
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
                {icon ?? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-11 items-center justify-center rounded-[var(--radius-md)]",
                      "bg-[linear-gradient(135deg,var(--indigo),var(--violet))] text-lg font-bold text-white",
                      "shadow-[var(--shadow-rest)]"
                    )}
                  >
                    A
                  </span>
                )}
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
    success: "bg-green-500/12 text-green-600 dark:text-green-400",
    error: "bg-red-500/12 text-red-600 dark:text-red-400",
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
