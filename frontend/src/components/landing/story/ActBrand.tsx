"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../../../lib/cn";
import BrandPreview from "../../brand/BrandPreview";
import { Act } from "./Act";

const SWATCHES = [
  { name: "Indigo", value: "#5b45f0" },
  { name: "Ocean", value: "#1d4ed8" },
  { name: "Pine", value: "#0f766e" },
  { name: "Garnet", value: "#b4232f" },
  { name: "Plum", value: "#7e22ce" },
  { name: "Graphite", value: "#1f2937" },
];

function BrandVisual() {
  const [accent, setAccent] = useState(SWATCHES[0].value);
  const [agency, setAgency] = useState("Fieldnote Agency");
  const nameId = useId();

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[1fr_1.15fr]">
      <div className="space-y-6 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-rest)]">
        <div>
          <label htmlFor={nameId} className="text-xs font-medium text-[var(--ink-2)]">Agency name</label>
          <input
            id={nameId}
            value={agency}
            maxLength={40}
            onChange={(e) => setAgency(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--page)] px-3 text-sm text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          />
        </div>
        <fieldset>
          <legend className="text-xs font-medium text-[var(--ink-2)]">Accent colour</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SWATCHES.map((s) => {
              const on = s.value === accent;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setAccent(s.value)}
                  aria-pressed={on}
                  aria-label={s.name}
                  title={s.name}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-[box-shadow] duration-[var(--dur-hover)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                    on && "ring-2 ring-[var(--ink)]"
                  )}
                  style={{ background: s.value }}
                >
                  {on && <Check className="size-4 text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="text-xs leading-relaxed text-[var(--ink-3)]">
          Set once per workspace in Settings → Branding, with your own logo and footer.
        </p>
      </div>
      <BrandPreview accent={accent} agencyName={agency.trim() || "Your agency"} />
    </div>
  );
}

export default function ActBrand() {
  return (
    <Act
      index={3}
      title={<>Your name on it. <span className="accent-serif">Not ours.</span></>}
      body={
        <p>
          Clients see your logo on the dashboard and your colours and footer on every report — sent on a schedule, or
          exported as a PDF whenever you need one.
        </p>
      }
      facts={[
        "Logo, accent colour and report footer, set once per workspace",
        "Scheduled client reports, plus one-click PDF export",
        "Invite your team as admins, members or read-only viewers",
      ]}
      visual={<BrandVisual />}
    />
  );
}
