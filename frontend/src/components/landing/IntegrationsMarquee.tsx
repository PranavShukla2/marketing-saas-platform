"use client";

import { useReducedMotion } from "framer-motion";

function Icon({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "ga":
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 16l4-5 4 3 5-8" />
        </svg>
      );
    case "ga4":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M6 8v4M18 8v4M12 16v-2M8 12h8" />
        </svg>
      );
    case "meta":
      return (
        <svg {...common}>
          <path d="M7 21c-2.5 0-4-3-4-7s2-9 5-9 4 5 4 5 1-5 4-5 5 5 5 9-1.5 7-4 7-4-4-5-7c-1 3-2 7-5 7z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M7 10v7M7 7v.01M11 17v-4.5a2.5 2.5 0 0 1 5 0V17M11 10v7" />
        </svg>
      );
    case "ads":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M8 11h8M8 14h5" />
        </svg>
      );
    default:
      return null;
  }
}

const ITEMS = [
  { label: "Google Analytics", icon: "ga" },
  { label: "GA4", icon: "ga4" },
  { label: "Meta Business", icon: "meta" },
  { label: "Instagram", icon: "instagram" },
  { label: "LinkedIn", icon: "linkedin" },
  { label: "Ads Manager", icon: "ads" },
];

export default function IntegrationsMarquee() {
  const reduceMotion = useReducedMotion();
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden">
      <div className="text-center mb-8">
        <p className="font-mono text-xs text-[var(--ink-3)] tracking-wide">── integrates with your stack</p>
      </div>
      <div className="group relative overflow-hidden">
        <div
          className={`flex items-center gap-4 w-max ${!reduceMotion ? "animate-marquee group-hover:[animation-play-state:paused]" : ""}`}
        >
          {track.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--ink-2)] whitespace-nowrap"
            >
              <Icon name={item.icon} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
