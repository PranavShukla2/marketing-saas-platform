"use client";

import { Card, Skeleton } from "../ui";
import { KpiCardSkeleton } from "./primitives";

/**
 * The loading state, shaped like the board it stands in for.
 *
 * It replaces a centred spinner reading "Loading workspace…", which told the
 * user nothing about what was coming and then shoved the entire layout into
 * place at once. Matching the final grid means the page assembles rather than
 * jumps — and it makes a slow GA4 fetch feel like the numbers are filling in,
 * which is what's actually happening.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <KpiCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padding="lg" className="rounded-[var(--radius-xl)] lg:col-span-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-56" />
          <Skeleton className="mt-5 h-[272px] w-full" />
        </Card>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
          {Array.from({ length: 4 }, (_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
