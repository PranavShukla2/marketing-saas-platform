"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col items-center overflow-x-hidden bg-[#fafafa]">
      
      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] -z-10 opacity-60"></div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-3xl z-10">
          <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 text-xs font-medium uppercase tracking-widest">
            v1.0 is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-gray-900 mb-6 leading-tight">
            Your client's data. <br />
            <span className="text-gray-400">Beautifully unified.</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 font-light max-w-xl mx-auto">
            The ultimate multi-tenant infrastructure for marketing agencies. Connect Google Analytics securely in seconds, not hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/dashboard">
              <button className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                Go to Workspace
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">Engineered for scale.</h2>
          <p className="text-lg text-gray-500 font-light">Everything you need to run a thousand client dashboards.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="md:col-span-2 bg-white p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-2xl font-medium mb-2">Multi-Tenant Architecture</h3>
              <p className="text-gray-500 max-w-sm">Complete data isolation. Every client's API keys are AES-256 encrypted and scoped to their workspace.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-50/50 rounded-full border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
               <div className="w-40 h-40 bg-white rounded-full shadow-sm border border-white flex items-center justify-center text-blue-500 font-bold text-2xl">🔒</div>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="bg-gray-900 text-white p-10 rounded-3xl shadow-lg flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-6"><span className="text-xl">⚡️</span></div>
              <h3 className="text-xl font-medium mb-2">FastAPI Core</h3>
              <p className="text-gray-400 text-sm">Lightning-fast Python backend capable of high-frequency data extraction.</p>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="bg-white p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 font-bold text-xs">JWT</div>
              <h3 className="text-xl font-medium mb-2">Stateless Auth</h3>
              <p className="text-gray-500 text-sm">Industry-standard JWT flows ensuring your API remains entirely stateless and secure.</p>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="md:col-span-2 bg-gradient-to-r from-gray-50 to-white p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-medium mb-4">Live Google Analytics Data</h3>
            <p className="text-gray-500 mb-6 max-w-md">Our engine authenticates directly with GCP to pull live time-series data without breaking a sweat.</p>
          </motion.div>
        </div>
      </section>

      {/* --- NEW WORKFLOW SECTION --- */}
      <section className="w-full bg-white py-32 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">Three steps to clarity.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { step: "01", title: "Initialize Tenant", desc: "Create a secure workspace for your agency in seconds." },
              { step: "02", title: "Encrypt Keys", desc: "Paste your Google JSON. We lock it in our PostgreSQL vault." },
              { step: "03", title: "View Dashboards", desc: "Watch real-time traffic data flow into beautiful Recharts." }
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-bold text-blue-500 mb-6 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-medium mb-3">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- NEW BOTTOM CTA --- */}
      <section className="w-full bg-black py-32 text-center px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">Ready to deploy?</h2>
          <p className="text-lg text-gray-400 font-light mb-10">Stop managing Python scripts manually. Centralize your logic in one unified platform.</p>
          <Link href="/register">
            <button className="px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300">
              Create your account
            </button>
          </Link>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-10 text-center text-sm text-gray-400 bg-black border-t border-gray-800">
        <p>© 2026 ArbFlow Systems. Built for scale.</p>
      </footer>

    </div>
  );
}