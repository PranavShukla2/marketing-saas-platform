"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn";
import { EASE_SPRING } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";

/**
 * A single status surface that morphs between states, in place of stacking
 * banners.
 *
 * The workspace previously showed a demo banner, an anomaly banner and a
 * success toast as three separate blocks that appeared above the content and
 * pushed the whole page down as they came and went. This is one element whose
 * shape animates instead — so status never reflows the page.
 */
export type IslandStatus =
  | { kind: "idle"; label: string }
  | { kind: "busy"; label: string }
  | { kind: "success"; label: string }
  | { kind: "alert"; label: string; action?: { label: string; onClick: () => void } }
  | { kind: "error"; label: string; action?: { label: string; onClick: () => void } };

type Ctx = {
  status: IslandStatus;
  /** Set the state the island rests in until something changes it. */
  setStatus: (s: IslandStatus) => void;
  /** Show a transient state, then fall back to whatever it was resting in. */
  flash: (s: IslandStatus, ms?: number) => void;
  /** Drop back to the plain workspace label. */
  clearStatus: () => void;
};

const StatusCtx = React.createContext<Ctx | null>(null);

export function StatusIslandProvider({
  idleLabel = "Workspace", children,
}: { idleLabel?: string; children: React.ReactNode }) {
  const idle = React.useMemo<IslandStatus>(() => ({ kind: "idle", label: idleLabel }), [idleLabel]);
  const [status, setRawStatus] = React.useState<IslandStatus>(idle);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // What the island falls back to once a flash expires. It is NOT always idle:
  // "you're on demo data, connect Google Analytics" is a standing condition,
  // and syncing shouldn't quietly erase it — before this, a Sync flashed
  // "Dashboard up to date" and then dropped to the bare workspace name, losing
  // the one prompt telling the user why their numbers were fictional.
  const resting = React.useRef<IslandStatus>(idle);

  const setStatus = React.useCallback((s: IslandStatus) => {
    if (timer.current) clearTimeout(timer.current);
    resting.current = s;
    setRawStatus(s);
  }, []);

  const clearStatus = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    resting.current = idle;
    setRawStatus(idle);
  }, [idle]);

  const flash = React.useCallback((s: IslandStatus, ms = 4000) => {
    if (timer.current) clearTimeout(timer.current);
    setRawStatus(s);
    timer.current = setTimeout(() => setRawStatus(resting.current), ms);
  }, []);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // The idle label is derived rather than stored, so renaming or switching
  // workspace re-labels the resting pill without an effect writing state back
  // into itself on every change.
  const value = React.useMemo(
    () => ({ status: status.kind === "idle" ? idle : status, setStatus, flash, clearStatus }),
    [status, idle, setStatus, flash, clearStatus]
  );

  return <StatusCtx.Provider value={value}>{children}</StatusCtx.Provider>;
}

export function useStatusIsland(): Ctx {
  const ctx = React.useContext(StatusCtx);
  if (!ctx) throw new Error("useStatusIsland must be used inside <StatusIslandProvider>");
  return ctx;
}

const TONE: Record<IslandStatus["kind"], string> = {
  idle: "text-[var(--ink-2)]",
  busy: "text-[var(--accent)]",
  success: "text-teal-600 dark:text-teal-400",
  alert: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
};

function Icon({ kind }: { kind: IslandStatus["kind"] }) {
  switch (kind) {
    case "busy": return <Loader2 className="size-3.5 animate-spin" />;
    case "success": return <Check className="size-3.5" />;
    case "alert": return <TriangleAlert className="size-3.5" />;
    case "error": return <AlertTriangle className="size-3.5" />;
    default: return <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-60" />;
  }
}

export function StatusIsland({ className }: { className?: string }) {
  const { status } = useStatusIsland();
  const reduce = useReducedMotionSafe();
  const action = "action" in status ? status.action : undefined;

  return (
    <motion.div
      // `layout` is what makes the pill grow and shrink around its contents
      // instead of swapping between two fixed-size boxes.
      layout={!reduce}
      transition={reduce ? { duration: 0 } : EASE_SPRING}
      className={cn(
        "glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-[var(--shadow-rest)]",
        "max-w-[min(92vw,36rem)] overflow-hidden",
        className
      )}
      // Transient states are announced; the resting label is not, since it
      // never changes and would be noise on every render.
      role="status"
      aria-live={status.kind === "idle" ? "off" : "polite"}
    >
      <motion.span layout={!reduce} className={cn("flex items-center", TONE[status.kind])}>
        <Icon kind={status.kind} />
      </motion.span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={status.kind + status.label}
          layout={!reduce}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="text-xs font-medium text-[var(--ink)] truncate"
        >
          {status.label}
        </motion.span>
      </AnimatePresence>

      {action && (
        <motion.button
          layout={!reduce}
          onClick={action.onClick}
          className={cn(
            "text-xs font-semibold text-[var(--accent)] hover:underline whitespace-nowrap",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
          )}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
