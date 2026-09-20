"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Flo from "../landing/Flo";
import ThemeToggle from "../ThemeToggle";
import { Button } from "../ui";
import { cn } from "../../lib/cn";
import { EASE_SPRING } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import { fetchSession, logout } from "../../lib/auth";

/**
 * Public routes only. The old nav listed Workspaces and Integrations, which
 * are behind AuthGuard — a signed-out visitor clicking either was bounced
 * straight to /login, which reads as the site being broken rather than as a
 * sign-in prompt.
 */
const LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const reduce = useReducedMotionSafe();
  return (
    <>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              active ? "text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            )}
          >
            {/* One shared element, so it slides between items rather than
                cross-fading in place. */}
            {active &&
              (reduce ? (
                <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[var(--accent)]/12" />
              ) : (
                <motion.span
                  aria-hidden="true"
                  layoutId="nav-active"
                  transition={EASE_SPRING}
                  className="absolute inset-0 rounded-full bg-[var(--accent)]/12"
                />
              ))}
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </>
  );
}

/**
 * The marketing navigation: a floating glass pill that shrinks as you scroll,
 * with the active link marked by a `layoutId` indicator that slides between
 * items.
 *
 * On phones it becomes a bottom-anchored pill instead of a hamburger sheet —
 * thumb-reachable, and it replaces having no mobile navigation at all. The old
 * bar hid its links behind `hidden md:flex` with nothing in their place, so a
 * phone visitor could reach the logo and "Start free" and nothing else.
 */
export function NavPill() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const reduce = useReducedMotionSafe();
  const [authed, setAuthed] = React.useState(false);
  const [shrunk, setShrunk] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    // Hysteresis: a single threshold makes the pill flicker when you hover
    // near it with a trackpad.
    setShrunk((was) => (was ? y > 40 : y > 80));
  });

  React.useEffect(() => {
    let cancelled = false;
    fetchSession().then((ok) => { if (!cancelled) setAuthed(ok); });
    return () => { cancelled = true; };
  }, [pathname]);

  const signOut = async () => {
    await logout();
    setAuthed(false);
    router.push("/login");
  };

  return (
    <>
      {/* ---------------- Desktop / tablet: floating top pill ---------------- */}
      <motion.header
        initial={reduce ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
      >
        <motion.nav
          aria-label="Main"
          layout={!reduce}
          transition={reduce ? { duration: 0 } : EASE_SPRING}
          className={cn(
            "glass-strong flex items-center gap-2 rounded-full shadow-[var(--shadow-raised)]",
            "transition-[padding] duration-300",
            shrunk ? "px-2.5 py-1.5" : "px-4 py-2.5"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full pl-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <motion.span whileHover={reduce ? undefined : { rotate: 8, scale: 1.08 }} transition={EASE_SPRING}>
              <Flo variant="mark" size={shrunk ? 22 : 26} />
            </motion.span>
            <span
              className={cn(
                "font-bold tracking-tight text-[var(--ink)] transition-all",
                shrunk ? "text-base" : "text-lg"
              )}
            >
              ArbFlow<span className="text-[var(--accent)]">.</span>
            </span>
          </Link>

          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-[var(--line)] sm:block" />

          <div className="hidden items-center gap-0.5 sm:flex">
            <NavLinks pathname={pathname} />
          </div>

          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-[var(--line)] sm:block" />

          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            {authed ? (
              <>
                <Button asChild variant="ghost" size="sm" pill className="hidden sm:inline-flex">
                  <Link href="/dashboard">Workspace</Link>
                </Button>
                <Button variant="outline" size="sm" pill onClick={signOut}>Sign out</Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" pill className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild variant="solid" size="sm" pill>
                  <Link href="/register">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </motion.nav>
      </motion.header>

      {/* ---------------- Phones: bottom-anchored pill ---------------- */}
      <motion.nav
        aria-label="Main"
        initial={reduce ? false : { y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        // pb keeps it clear of the iOS home indicator.
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
      >
        <div className="glass-strong flex items-center gap-0.5 rounded-full px-2 py-1.5 shadow-[var(--shadow-overlay)]">
          <NavLinks pathname={pathname} />
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--line)]" />
          <Button asChild variant="solid" size="sm" pill>
            <Link href={authed ? "/dashboard" : "/login"}>{authed ? "Workspace" : "Sign in"}</Link>
          </Button>
        </div>
      </motion.nav>
    </>
  );
}

export default NavPill;
