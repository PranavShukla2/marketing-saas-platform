"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  /** Supply to make the column sortable. Return a string or a number. */
  sortBy?: (row: T) => string | number;
};

type Sort = { key: string; direction: "asc" | "desc" };

/**
 * The workspace's table.
 *
 * Every page had hand-written `<table>` markup with its own header casing, row
 * borders and "no data" text, and none of them sorted — so reading "which page
 * earns most" meant scanning by eye. One component instead, with three details
 * the hand-rolled versions all missed:
 *
 * - Sorting is driven from a real `<button>` in the header cell with
 *   `aria-sort` on the column, so it's reachable and announced, not a click
 *   handler bolted onto a `<th>`.
 * - Numeric columns are right-aligned and tabular, so digits line up.
 * - Wide tables scroll inside their own container rather than making the page
 *   scroll sideways on a phone.
 */
export function DataTable<T>({
  rows,
  columns,
  getKey,
  defaultSort,
  emptyMessage = "Nothing to show yet.",
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T, index: number) => string;
  defaultSort?: Sort;
  emptyMessage?: string;
  className?: string;
}) {
  const [sort, setSort] = React.useState<Sort | null>(defaultSort ?? null);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortBy) return rows;
    const dir = sort.direction === "asc" ? 1 : -1;
    // Copy first: sorting `rows` in place would mutate the caller's data, and
    // the same array is handed to charts elsewhere on the page.
    return [...rows].sort((a, b) => {
      const av = col.sortBy!(a);
      const bv = col.sortBy!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, columns, sort]);

  if (rows.length === 0) {
    return <p className={cn("text-sm text-[var(--ink-3)]", className)}>{emptyMessage}</p>;
  }

  const toggle = (key: string) =>
    setSort((s) =>
      s?.key === key
        ? { key, direction: s.direction === "asc" ? "desc" : "asc" }
        // First click on a numeric column almost always means "biggest first".
        : { key, direction: "desc" }
    );

  return (
    <div className={cn("-mx-1 overflow-x-auto px-1", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "pb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]",
                    c.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {c.sortBy ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded outline-none transition-colors",
                        "hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                        active && "text-[var(--ink)]"
                      )}
                    >
                      {c.header}
                      {active ? (
                        sort!.direction === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={getKey(row, i)} className="border-t border-[var(--line)]">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "py-2.5 text-[var(--ink-2)]",
                    c.align === "right" ? "text-right tabular-nums" : "text-left"
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
