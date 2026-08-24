"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

/**
 * Where you are, in the top chrome.
 *
 * The rail already shows the active page, so this earns its place mainly on
 * the sub-routes -- /settings/notifications, /team/invite -- where the rail
 * highlight stops at the section and the page itself gives no other clue.
 * Labels come from a table rather than title-casing the segment, because
 * "Ga4" and "Faq" are what that produces.
 */
const LABELS: Record<string, string> = {
  dashboard: "Workspace",
  campaigns: "Campaigns",
  reports: "Reports",
  integrations: "Integrations",
  team: "Team",
  billing: "Billing",
  settings: "Settings",
  notifications: "Notifications",
  branding: "Branding",
};

function label(segment: string): string {
  return LABELS[segment] ?? segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1 text-xs">
        {segments.map((segment, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const last = i === segments.length - 1;
          return (
            <li key={href} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-[var(--ink-3)]" />}
              {last ? (
                // The current page is text, not a link to itself.
                <span aria-current="page" className="truncate font-medium text-[var(--ink-2)]">
                  {label(segment)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="truncate rounded text-[var(--ink-3)] outline-none transition-colors hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {label(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
