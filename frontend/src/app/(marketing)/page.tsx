"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import FaqSection from "../../components/FaqSection";
import Footer from "../../components/Footer";
import BentoBox from "../../components/BentoBox";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // Fetch real snippet data
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${backendUrl}/api/v1/analytics/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).then(res => {
        if (res.data?.status === "active") setUserData(res.data);
      }).catch(() => {});
    }
  }, []);

  const fadeUp: any = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col items-center overflow-x-hidden bg-[#fafafa]">

      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-6 pt-16 sm:pt-20 pb-24 sm:pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-blue-50 rounded-full blur-[120px] -z-10 opacity-60"></div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-3xl z-10">
          <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 text-xs font-medium uppercase tracking-widest">
            v1.0 is now live
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-gray-900 mb-6 leading-tight">
            Your client's data. <br />
            <span className="text-gray-400">Beautifully unified.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 font-light max-w-xl mx-auto px-4">
            The ultimate multi-tenant infrastructure for marketing agencies. Connect Google Analytics securely in seconds, not hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <button className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg hover:scale-105 active:scale-95 transition-transform duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                {isLoggedIn ? "Go to Workspace" : "Get Started Free"}
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <BentoBox />

      {/* --- WORKFLOW SECTION --- */}
      <section className="w-full bg-white py-20 sm:py-32 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">Three steps to clarity.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-center">
            {[
              { step: "01", title: "Initialize Tenant", desc: "Create a secure workspace for your agency in seconds." },
              { step: "02", title: "Connect Google", desc: "One-click OAuth to pull your GA4 data automatically." },
              { step: "03", title: "View Dashboards", desc: "Watch real-time traffic data flow into beautiful charts." }
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

      {/* --- FAQ SECTION --- */}
      <FaqSection />

      {/* --- DASHBOARD PREVIEW SECTION (near bottom, after FAQ) --- */}
      <section className="w-full bg-gray-50 py-20 sm:py-24 relative overflow-hidden border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
              {isLoggedIn ? "Your live workspace" : "See what you'll get"}
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              {isLoggedIn 
                ? "Here's a quick snapshot from your connected analytics."
                : "A unified analytics workspace powered by real-time Google Analytics data."
              }
            </p>
          </motion.div>

          {isLoggedIn && userData ? (
            /* --- LOGGED IN: Real data snippets --- */
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Active Users", value: Number(userData.summary?.active_users || 0).toLocaleString(), color: "blue" },
                  { label: "Page Views", value: Number(userData.summary?.page_views || 0).toLocaleString(), color: "green" },
                  { label: "Bounce Rate", value: userData.summary?.bounce_rate || "–", color: "amber" },
                  { label: "Avg Duration", value: userData.summary?.avg_duration || "–", color: "purple" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
              
              {userData.post_level && userData.post_level.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Traffic Sources</h3>
                  <div className="space-y-3">
                    {userData.post_level.slice(0, 4).map((src: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{src.source}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{src.views} views</span>
                          <span className="text-sm text-blue-600 font-semibold">{src.users} users</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <Link href="/dashboard">
                  <button className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg hover:scale-105 active:scale-95 transition-transform duration-300 shadow-xl">
                    Open Full Workspace →
                  </button>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* --- NOT LOGGED IN: Blurred preview --- */
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative">
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mb-2 text-center px-4">Sign in to see your data</h3>
                <p className="text-gray-500 mb-6 max-w-sm text-center text-sm sm:text-base px-4">Connect your Google Analytics and watch your dashboard come alive.</p>
                <Link href="/register">
                  <button className="px-8 py-3.5 bg-black text-white rounded-full font-medium hover:scale-105 active:scale-95 transition-transform duration-300 shadow-xl">
                    Create Free Workspace
                  </button>
                </Link>
              </div>
              
              {/* Mock preview cards (blurred behind overlay) */}
              <div className="opacity-40 pointer-events-none select-none rounded-3xl overflow-hidden p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {["Active Users", "Page Views", "Bounce Rate", "Avg Duration"].map((label, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 text-center">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-2xl font-bold text-gray-300">•••</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 h-48"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 h-32"></div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 h-32"></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section id="pricing" className="w-full bg-black py-24 sm:py-32 text-center px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">Ready to deploy?</h2>
          <p className="text-base sm:text-lg text-gray-400 font-light mb-10">Stop managing Python scripts manually. Centralize your logic in one unified platform.</p>
          <Link href="/register">
            <button className="px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:scale-105 active:scale-95 transition-transform duration-300">
              Create your account
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}