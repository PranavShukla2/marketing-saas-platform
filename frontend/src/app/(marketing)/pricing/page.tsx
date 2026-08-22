"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    desc: "Perfect for solo agencies.",
    price: 49,
    popular: false,
    cta: "Get Started",
    features: ["5 Client Dashboards", "Manual API Key Entry", "Standard Support"],
  },
  {
    name: "Pro",
    desc: "For growing agencies.",
    price: 99,
    popular: true,
    cta: "Start Free Trial",
    features: ["25 Client Dashboards", "OAuth 2.0 Integration", "Priority Support", "White-Labeled Reports"],
  },
  {
    name: "Enterprise",
    desc: "For scaling SaaS platforms.",
    price: 199,
    popular: false,
    cta: "Scale Now",
    features: ["Unlimited Dashboards", "Custom Database Vault", "Dedicated Account Manager", "SLA Guarantee"],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] flex flex-col items-center px-6 py-20 sm:py-28">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="text-center mb-12 max-w-2xl"
      >
        <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold tracking-[-0.02em] mb-4">
          Simple, transparent pricing.
        </motion.h1>
        <motion.p variants={fadeUp} className="text-xl text-[var(--ink-2)] font-light">
          Scale your marketing agency with secure, multi-tenant analytics.
        </motion.p>
      </motion.div>

      {/* Monthly / Annual toggle */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex items-center gap-3 mb-16 px-1.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--page)]"
      >
        <button
          onClick={() => setAnnual(false)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            !annual ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)]"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            annual ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)]"
          }`}
        >
          Annual
          <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-semibold">
            Save 20%
          </span>
        </button>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full"
      >
        {plans.map((plan) => {
          const monthlyPrice = annual ? Math.round(plan.price * 0.8) : plan.price;
          return (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`p-10 rounded-3xl flex flex-col relative ${
                plan.popular
                  ? "border-2 border-[#0071E3] bg-[#EEF2FF] dark:bg-[var(--accent)]/12 shadow-xl md:-translate-y-2"
                  : "border border-[var(--line)] bg-[var(--surface)]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0071E3] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  MOST POPULAR
                </div>
              )}
              <h2 className="text-2xl font-medium mb-2 mt-2">{plan.name}</h2>
              <p className="text-[var(--ink-2)] mb-6">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold tracking-[-0.02em]">${monthlyPrice}</span>
                <span className="text-lg text-[var(--ink-2)]">/mo</span>
              </div>
              {annual && (
                <p className="text-xs text-[var(--ink-2)] mb-8">Billed annually at ${monthlyPrice * 12}/yr</p>
              )}
              {!annual && <div className="mb-8" />}
              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-[var(--ink)] text-sm">
                    <svg className="w-4 h-4 text-[#0071E3] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <button
                  className={`w-full py-3 rounded-full font-medium transition-colors duration-300 ${
                    plan.popular
                      ? "bg-[#0071E3] text-white hover:bg-[#0061c3]"
                      : "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--page)]"
                  }`}
                >
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
