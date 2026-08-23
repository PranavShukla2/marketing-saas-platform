"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3, ChevronsLeft, CreditCard, FileText, LayoutDashboard, Link2,
  LogOut, Menu, Search, Settings, Users,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { EASE_SPRING } from "../../lib/motion";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import { getApiUrl, logout, apiFetch } from "../../lib/auth";
import { withWorkspace, getActiveWorkspace, setActiveWorkspace } from "../../lib/workspace";
import { Dialog, DialogContent } from "../ui/dialog";
import { Hint } from "../ui/tooltip";
import ThemeToggle from "../ThemeToggle";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Integrations", href: "/integrations", icon: Link2 },
  { name: "Team", href: "/team", icon: Users },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

type Workspace = { id: number; name: string; role: string; is_own: boolean };
const COLLAPSE_KEY = "arbflow_sidebar_collapsed";

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 px-2 hover:opacity-80 transition-opacity">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="10" fill="url(#af-sb)" />
        <path d="M9 21V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 21V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M23 21V13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="10" r="2.5" fill="white" />
        <defs>
          <linearGradient id="af-sb" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--indigo)" /><stop offset="1" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
      </svg>
      {!collapsed && (
        <span className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">ArbFlow</span>
      )}
    </Link>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();

  return (
    <nav className="flex-1 space-y-1" aria-label="Main">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const link = (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 outline-none",
              "transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              collapsed && "justify-center px-0",
              active ? "text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            )}
          >
            {/* One shared element slides between items instead of each one
                fading its own background in and out. */}
            {active &&
              (reduce ? (
                <span aria-hidden="true" className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--accent)]/12" />
              ) : (
                <motion.span
                  aria-hidden="true"
                  layoutId="sidebar-active"
                  transition={EASE_SPRING}
                  className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--accent)]/12"
                />
              ))}
            <Icon className="relative z-10 size-[18px] shrink-0" />
            {!collapsed && <span className="relative z-10 text-sm font-medium">{item.name}</span>}
          </Link>
        );
        return collapsed ? (
          <Hint key={item.name} label={item.name} side="right">{link}</Hint>
        ) : link;
      })}
    </nav>
  );
}

function SidebarBody({
  collapsed, setCollapsed, onNavigate, showCollapseToggle = true,
}: {
  collapsed: boolean;
  setCollapsed?: (v: boolean) => void;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}) {
  const pathname = usePathname();
  const [usage, setUsage] = React.useState({ current: 0, limit: 100000, percentage: 0 });
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [activeWs, setActiveWs] = React.useState("");

  React.useEffect(() => {
    setActiveWs(getActiveWorkspace() || "");
    (async () => {
      try {
        const res = await apiFetch(`${getApiUrl()}/api/v1/workspace/workspaces`);
        if (!res.ok) return;
        const list: Workspace[] = (await res.json()).workspaces || [];
        setWorkspaces(list);
        const current = getActiveWorkspace();
        if (current && !list.some((w) => String(w.id) === current && !w.is_own)) {
          setActiveWorkspace(null);
          setActiveWs("");
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/billing`));
        if (res.ok) setUsage((await res.json()).usage);
      } catch {}
    })();
  }, [pathname]);

  const switchWorkspace = (value: string) => {
    const own = workspaces.find((w) => w.is_own);
    setActiveWorkspace(value && (!own || String(own.id) !== value) ? value : null);
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <Logo collapsed={collapsed} />
        {showCollapseToggle && !collapsed && setCollapsed && (
          <Hint label="Collapse sidebar" side="right">
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="rounded-md p-1.5 text-[var(--ink-3)] hover:bg-[var(--page)] hover:text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ChevronsLeft className="size-4" />
            </button>
          </Hint>
        )}
      </div>

      {workspaces.length > 1 && !collapsed && (
        <div>
          <label htmlFor="ws-switch" className="mb-1.5 block px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            Workspace
          </label>
          <select
            id="ws-switch"
            value={activeWs}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--page)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.is_own ? "" : String(w.id)}>
                {w.name}{w.is_own ? " (You)" : ` · ${w.role}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <NavList collapsed={collapsed} onNavigate={onNavigate} />

      <div className="space-y-3">
        {!collapsed && (
          <Link href="/billing" className="block rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--page)] p-3.5 transition-transform hover:scale-[1.02]">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Workspace limit</p>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div className="h-full rounded-full bg-[linear-gradient(100deg,var(--indigo),var(--violet))]" style={{ width: `${usage.percentage}%` }} />
            </div>
            <p className="text-xs text-[var(--ink-2)]">
              {Math.floor(usage.current).toLocaleString()} / {Math.floor(usage.limit / 1000)}k views
            </p>
          </Link>
        )}

        {collapsed && setCollapsed && (
          <Hint label="Expand sidebar" side="right">
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="mx-auto flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--ink-3)] hover:bg-[var(--page)] hover:text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ChevronsLeft className="size-4 rotate-180" />
            </button>
          </Hint>
        )}

        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && <span className="text-xs font-medium text-[var(--ink-3)]">Theme</span>}
          <ThemeToggle compact />
        </div>

        <button
          onClick={async () => { await logout(); window.location.href = "/login"; }}
          className={cn(
            "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium",
            "text-[var(--ink-2)] transition-colors hover:bg-[var(--page)] hover:text-[var(--ink)]",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch {}
  }, []);
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapsed = (v: boolean) => {
    setCollapsed(v);
    try { localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0"); } catch {}
    // `storage` doesn't fire in the tab that wrote it, so tell the shell directly.
    window.dispatchEvent(new Event("arbflow:sidebar"));
  };

  return (
    <>
      {/* Mobile chrome */}
      <div className="glass fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="-ml-2 rounded-md p-2 text-[var(--ink-2)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Menu className="size-5" />
        </button>
        <Logo collapsed={false} />
        <span className="w-9" />
      </div>

      {/* Radix Dialog gives the drawer a focus trap, Escape and scroll lock —
          all of which the previous hand-rolled drawer lacked. */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showClose={false}
          aria-label="Navigation"
          className="left-0 top-0 h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none rounded-r-[var(--radius-xl)] p-0"
        >
          <SidebarBody collapsed={false} onNavigate={() => setMobileOpen(false)} showCollapseToggle={false} />
        </DialogContent>
      </Dialog>

      {/* Desktop rail */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 260 }}
        transition={EASE_SPRING}
        className="glass fixed left-0 top-0 z-30 hidden h-screen border-r lg:block"
      >
        <SidebarBody collapsed={collapsed} setCollapsed={toggleCollapsed} />
      </motion.aside>
    </>
  );
}
