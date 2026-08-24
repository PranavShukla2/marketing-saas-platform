"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { useReducedMotionSafe } from "../../lib/useReducedMotionSafe";
import { indexByAtlasName } from "./geoNames";

export type GeoRow = { country: string; users: number; sessions?: number };

type Shape = { name: string; d: string };

const WIDTH = 900;
const HEIGHT = 460;

/** Keep the centred tooltip inside the card rather than off its edge. */
function clampX(x: number, containerWidth: number): number {
  return Math.min(Math.max(x, 80), Math.max(80, containerWidth - 80));
}

/**
 * "Where your users are" — a choropleth of visitors by country.
 *
 * Rendered as our own SVG rather than through a mapping library: at 1:110m
 * these are ~177 static polygons, so a tile-based map (Mapbox, Leaflet) would
 * mean an API key, a per-load bill and a WebGL runtime to shade shapes that
 * never move. See DECISIONS.md. The pay-off is that each country is a real
 * SVG element, so it takes our theme tokens, our focus ring and our motion —
 * and in dark mode it's a dark map, not a bright rectangle pasted on.
 *
 * Shading is opacity over the accent token rather than a fixed colour ramp,
 * for the same reason: one definition that reads correctly in both themes.
 */
export function GeoMap({
  rows,
  selected,
  onSelect,
  className,
}: {
  rows: GeoRow[];
  selected?: string | null;
  onSelect?: (country: string | null) => void;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  const [shapes, setShapes] = React.useState<Shape[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [hover, setHover] = React.useState<{ name: string; x: number; y: number } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // d3-geo and topojson only load when someone actually opens this
        // section, and the atlas is a plain static asset (see public/geo).
        const [{ geoNaturalEarth1, geoPath }, { feature }, res] = await Promise.all([
          import("d3-geo"),
          import("topojson-client"),
          fetch("/geo/countries-ind-110m.json"),
        ]);
        if (!res.ok) throw new Error(`atlas ${res.status}`);
        const topology = await res.json();
        const collection = feature(topology, topology.objects.countries) as unknown as {
          type: string;
          features: { properties: { name: string } }[];
        };

        // Antarctica is dropped before the projection is fitted, not after.
        // Fitting with it included reserves a band across the bottom of the
        // box for a continent that carries no traffic and is then not drawn —
        // which squeezes the populated world into the top two thirds and
        // leaves a strip of dead space under the map.
        const drawn = {
          type: "FeatureCollection",
          features: collection.features.filter((f) => f.properties.name !== "Antarctica"),
        };

        // Natural Earth 1 keeps continents recognisable without Mercator's
        // habit of making Greenland the size of Africa — which matters when
        // area is doing the visual work of "how much traffic".
        const projection = geoNaturalEarth1().fitExtent(
          [[4, 4], [WIDTH - 4, HEIGHT - 4]],
          drawn as never
        );
        const path = geoPath(projection);

        const built: Shape[] = [];
        for (const f of drawn.features) {
          const d = path(f as never);
          if (!d) continue;
          built.push({ name: f.properties.name, d });
        }
        if (!cancelled) setShapes(built);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const byCountry = React.useMemo(
    () => indexByAtlasName(rows ?? [], (r) => r.country, (shapes ?? []).map((s) => s.name)),
    [rows, shapes]
  );
  const max = React.useMemo(
    () => Math.max(1, ...(rows ?? []).map((r) => r.users || 0)),
    [rows]
  );

  // The caller keeps selection in GA4's vocabulary; the map speaks Natural
  // Earth's. Resolve once so highlight and click agree.
  const selectedAtlasName = React.useMemo(() => {
    if (!selected || !shapes) return null;
    const hit = indexByAtlasName([{ country: selected, users: 0 }], (r) => r.country, shapes.map((s) => s.name));
    return [...hit.keys()][0] ?? null;
  }, [selected, shapes]);

  if (failed) return null;

  if (!shapes) {
    return (
      <div
        className={cn("w-full animate-pulse rounded-[var(--radius-lg)] bg-[var(--line)]", className)}
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        aria-hidden="true"
      />
    );
  }

  const hovered = hover ? byCountry.get(hover.name) : undefined;

  return (
    <div className={cn("relative w-full", className)}>
      <motion.svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Visitors by country. ${rows.length} countries with traffic; ${rows[0]?.country ?? "none"} leads.`}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.5 }}
        onMouseLeave={() => setHover(null)}
      >
        {shapes.map((s) => {
          const row = byCountry.get(s.name);
          const share = row ? (row.users || 0) / max : 0;
          // Square root, not linear: one dominant market would otherwise flatten
          // every other country to the same near-invisible tint.
          const intensity = share > 0 ? 0.16 + Math.sqrt(share) * 0.74 : 0;
          const isSelected = selectedAtlasName === s.name;
          const isHovered = hover?.name === s.name;
          const interactive = !!row && !!onSelect;

          return (
            <path
              key={s.name}
              d={s.d}
              fill={row ? "var(--accent)" : "var(--line)"}
              // fill-opacity and stroke-width are SVG paint properties, not
              // Tailwind utilities — hover and focus have to move real values.
              fillOpacity={row ? (isHovered ? 1 : intensity) : 1}
              stroke={isSelected || isHovered ? "var(--ink)" : "var(--surface)"}
              strokeWidth={isSelected ? 1.6 : isHovered ? 1.2 : 0.5}
              className={cn(
                "transition-[fill-opacity,stroke-width] duration-150 outline-none",
                interactive && "cursor-pointer"
              )}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? "button" : undefined}
              aria-label={row ? `${row.country}: ${row.users.toLocaleString()} users` : undefined}
              onMouseMove={(e) => {
                if (!row) return setHover(null);
                const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!box) return;
                setHover({ name: s.name, x: clampX(e.clientX - box.left, box.width), y: e.clientY - box.top });
              }}
              onFocus={(e) => {
                if (!row) return;
                const box = e.currentTarget.getBoundingClientRect();
                const svg = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!svg) return;
                setHover({ name: s.name, x: clampX(box.left - svg.left + box.width / 2, svg.width), y: box.top - svg.top });
              }}
              onBlur={() => setHover(null)}
              onClick={() => {
                if (!row || !onSelect) return;
                onSelect(selected === row.country ? null : row.country);
              }}
              onKeyDown={(e) => {
                if (!row || !onSelect) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(selected === row.country ? null : row.country);
                }
              }}
            />
          );
        })}
      </motion.svg>

      {hovered && hover && (
        <div
          // Positioned by the pointer, clamped by translate so it never runs
          // off the left or right edge of the card.
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-overlay)]"
          style={{ left: hover.x, top: hover.y }}
        >
          <p className="text-xs font-semibold text-[var(--ink)]">{hovered.country}</p>
          <p className="mt-0.5 text-xs tabular-nums text-[var(--ink-2)]">
            {hovered.users.toLocaleString()} users
            {hovered.sessions !== undefined && (
              <span className="text-[var(--ink-3)]"> · {hovered.sessions.toLocaleString()} sessions</span>
            )}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--ink-3)]">
          {onSelect ? "Click a country to filter." : "Shaded by share of visitors."}
        </p>
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="text-[10px] text-[var(--ink-3)]">Fewer</span>
          <div className="flex">
            {[0.16, 0.35, 0.53, 0.72, 0.9].map((o) => (
              <span key={o} className="size-3 first:rounded-l-sm last:rounded-r-sm" style={{ background: "var(--accent)", opacity: o }} />
            ))}
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">More</span>
        </div>
      </div>
    </div>
  );
}

export default GeoMap;
