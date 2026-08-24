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

        {/* pt-16 clears the fixed mobile top bar. Without it the content column
            starts at y=0 underneath the bar, and the sticky status strip --
            whose `top-16` then pins it *below* its own flow position -- lands
            on top of the page title. */}
        <div className={cn(
          "pt-16 transition-[padding] duration-300 lg:pt-0",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"
        )}>
          {/* Top chrome: the status island lives here so transient state never
              pushes page content around.

              The strip needs its own backdrop. The island is glass, so without
              one the page content scrolls *through* it — tabs and headings
              showing straight out the back of the pill. A page-coloured band
              fading to transparent hides what passes underneath while keeping
              the island itself looking like it floats. */}
          <div className="pointer-events-none sticky top-16 z-20 lg:top-0">
            <div className="bg-gradient-to-b from-[var(--page)] via-[var(--page)] to-transparent px-4 pb-5 pt-4 lg:px-10 lg:pt-6">
              <div className="pointer-events-auto flex justify-center lg:justify-start">
                <StatusIsland />
              </div>
            </div>
          </div>

          <main id="main" className="px-4 pb-16 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </StatusIslandProvider>
  );
}
