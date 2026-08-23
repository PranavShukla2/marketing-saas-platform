"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { StatusIsland, StatusIslandProvider } from "./StatusIsland";
import { cn } from "../../lib/cn";

const COLLAPSE_KEY = "arbflow_sidebar_collapsed";

/**
 * The workspace frame: rail, top chrome and content column.
 *
 * The content column's left offset has to track the rail's width, and the rail
 * stores that in localStorage. Rather than duplicate the state, this listens
 * for the change so both stay in step without a router round-trip.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const read = () => {
      try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch {}
    };
    read();
    // `storage` only fires cross-tab, so the rail also dispatches a local event.
    window.addEventListener("storage", read);
    window.addEventListener("arbflow:sidebar", read as EventListener);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("arbflow:sidebar", read as EventListener);
    };
  }, []);

  return (
    <StatusIslandProvider>
      <div className="min-h-screen bg-[var(--page)]">
        <a href="#main" className="skip-link">Skip to content</a>
        <Sidebar />
        <CommandPalette />

        <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]")}>
          {/* Top chrome: the status island lives here so transient state never
              pushes page content around. */}
          <div className="sticky top-16 z-20 flex justify-center px-4 pt-4 lg:top-0 lg:justify-start lg:px-10 lg:pt-6">
            <StatusIsland />
          </div>

          <main id="main" className="px-4 pb-16 pt-4 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </StatusIslandProvider>
  );
}
