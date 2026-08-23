"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, CreditCard, FileText, LayoutDashboard, Link2, Moon, Search,
  Settings, Sun, Monitor, Users,
} from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { cn } from "../../lib/cn";
import { applyTheme } from "../../lib/theme";

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords?: string;
};

/**
 * ⌘K / Ctrl-K navigation. Built on our Dialog (so it inherits the focus trap
 * and dismiss behaviour) with a hand-rolled list, because a combobox here needs
 * only three things — filter, arrow keys, Enter — and pulling in `cmdk` for
 * that would duplicate the Radix dialog we already have.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const items = React.useMemo<Item[]>(() => {
    const go = (href: string) => () => { setOpen(false); router.push(href); };
    return [
      { id: "dash", label: "Dashboard", hint: "Workspace overview", icon: <LayoutDashboard />, run: go("/dashboard"), keywords: "home analytics overview" },
      { id: "camp", label: "Campaigns", hint: "Traffic channels", icon: <BarChart3 />, run: go("/campaigns"), keywords: "traffic sources channels" },
      { id: "rep", label: "Reports", hint: "Generate and schedule", icon: <FileText />, run: go("/reports"), keywords: "pdf export schedule" },
      { id: "team", label: "Team", hint: "Invite and manage access", icon: <Users />, run: go("/team"), keywords: "invite members roles" },
      { id: "int", label: "Integrations", hint: "Connect data sources", icon: <Link2 />, run: go("/integrations"), keywords: "google analytics meta linkedin connect" },
      { id: "bill", label: "Billing", hint: "Plan and usage", icon: <CreditCard />, run: go("/billing"), keywords: "plan invoice subscription" },
      { id: "set", label: "Settings", hint: "Profile, branding, notifications", icon: <Settings />, run: go("/settings"), keywords: "branding logo webhook profile" },
      { id: "t-light", label: "Switch to light theme", icon: <Sun />, run: () => { applyTheme("light"); setOpen(false); }, keywords: "theme appearance" },
      { id: "t-dark", label: "Switch to dark theme", icon: <Moon />, run: () => { applyTheme("dark"); setOpen(false); }, keywords: "theme appearance" },
      { id: "t-sys", label: "Match system theme", icon: <Monitor />, run: () => { applyTheme("system"); setOpen(false); }, keywords: "theme appearance auto" },
    ];
  }, [router]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  // Reset the highlight whenever the result set changes, or it can point past
  // the end of a shorter list.
  React.useEffect(() => { setActive(0); }, [query]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => { if (open) setQuery(""); }, [open]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); results[active]?.run(); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showClose={false} className="p-0 max-w-xl top-[20%] translate-y-0" aria-label="Command palette">
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4">
          <Search className="size-4 text-[var(--ink-3)] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            className="h-14 w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-3)]"
          />
          <kbd className="hidden sm:block text-[10px] text-[var(--ink-3)] border border-[var(--line)] rounded px-1.5 py-0.5">esc</kbd>
        </div>

        <div ref={listRef} role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-[var(--ink-3)]">No matches for “{query}”.</p>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              id={`cmd-${item.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={item.run}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                i === active ? "bg-[var(--accent)]/12 text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--page)]"
              )}
            >
              <span className={cn("[&_svg]:size-4", i === active ? "text-[var(--accent)]" : "text-[var(--ink-3)]")}>
                {item.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">{item.label}</span>
                {item.hint && <span className="block text-xs text-[var(--ink-3)] truncate">{item.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
