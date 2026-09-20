"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Badge, Button, Card, Tabs, TabsList, TabsTrigger } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { DURATION, EASE_OUT, fadeUp, stagger } from "../../../lib/motion";
import { useReducedMotionSafe } from "../../../lib/useReducedMotionSafe";

const PLANS = [
  {
    name: "Starter",
    desc: "For a solo agency finding its feet.",
    price: 49,
    popular: false,
    features: ["5 client dashboards", "Google Analytics 4", "Plain-English alerts", "Email support"],
  },
  {
    name: "Pro",
    desc: "For an agency with a roster.",
    price: 99,
    popular: true,
    features: [
      "25 client dashboards",
      "Every integration",
      "White-labelled reports",
      "Scheduled client emails",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    desc: "For agencies running at volume.",
    price: 199,
    popular: false,
    features: [
      "Unlimited dashboards",
      "Unlimited team members",
      "Custom branding on everything",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const reduce = useReducedMotionSafe();

  return (
    <div className="min-h-screen bg-[var(--page)] px-6 py-16 text-[var(--ink)] sm:py-24">
      <motion.div
        variants={reduce ? undefined : stagger(0.08)}
        initial={reduce ? undefined : "hidden"}
        animate={reduce ? undefined : "show"}
        className="mx-auto mb-10 max-w-2xl text-center"
      >
        <motion.h1
          variants={reduce ? undefined : fadeUp}
          className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl"
        >
          Simple, transparent pricing.
        </motion.h1>
        <motion.p
          variants={reduce ? undefined : fadeUp}
          className="mt-4 text-lg font-light text-[var(--ink-2)] sm:text-xl"
        >
          One price per agency, however many clients you report on.
        </motion.p>
      </motion.div>

      {/* The product is in open beta and nothing is billed — the in-app billing
          page says exactly this. A pricing page that quietly implied otherwise
          would be the first thing a new user found to be untrue. */}
      <div className="mx-auto mb-10 flex max-w-2xl items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-5 py-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
        <p className="text-sm leading-relaxed text-[var(--ink-2)]">
          <strong className="text-[var(--ink)]">Everything is free while we&apos;re in beta.</strong>{" "}
          These are the plans we&apos;ll launch with. Until then every account gets the full product,
          no card required — and we&apos;ll give you plenty of notice before that changes.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <Tabs group="billing-period" value={annual ? "annual" : "monthly"} onValueChange={(v) => setAnnual(v === "annual")}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual
              <span className="ml-2 rounded-full bg-[var(--surface)]/25 px-1.5 py-0.5 text-[10px] font-semibold">
                −20%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 md:grid-cols-3">
        {PLANS.map((plan, i) => {
          const monthly = annual ? Math.round(plan.price * 0.8) : plan.price;
          return (
            <motion.div
              key={plan.name}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={reduce ? { duration: 0 } : { duration: DURATION.base, delay: i * 0.08, ease: EASE_OUT }}
              className={cn("relative h-full", plan.popular && "md:-mt-3")}
            >
              {plan.popular && (
                <Badge
                  tone="accent"
                  className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 bg-[var(--surface)] shadow-[var(--shadow-rest)]"
                >
                  Most popular
                </Badge>
              )}
              <Card
                padding="lg"
                variant={plan.popular ? "feature" : "solid"}
                className="flex h-full flex-col rounded-[var(--radius-xl)] p-8"
              >
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-[-0.03em] tabular-nums">${monthly}</span>
                  <span className="text-[var(--ink-2)]">/mo</span>
                </div>
                {/* Reserve the line in both states so the three cards' feature
                    lists stay on one baseline as you toggle. */}
                <p className="mt-1 min-h-[1.25rem] text-xs text-[var(--ink-3)]">
                  {annual ? `Billed annually at $${monthly * 12}` : "Billed monthly"}
                </p>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.popular ? "primary" : "outline"}
                  size="lg"
                  className="mt-8 w-full"
                >
                  <Link href="/register">Start free</Link>
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-sm text-[var(--ink-3)]">
        Questions about a plan?{" "}
        <Link href="/about" className="text-[var(--accent)] hover:underline">
          Get in touch
        </Link>{" "}
        — we&apos;d rather talk than have you guess.
      </p>
    </div>
  );
}
