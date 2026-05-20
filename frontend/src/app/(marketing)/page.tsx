"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import FaqSection from "../../components/FaqSection";
import Footer from "../../components/Footer";
import BentoBox from "../../components/BentoBox";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${Math.floor(v).toLocaleString()}${suffix}`);
  const [display, setDisplay] = useState(`0${suffix}`);

  useEffect(() => {
    const controls = animate(count, target, { duration: 2, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [target]);

  return <span>{display}</span>;
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0.15, 0.3, 0.15],
        scale: [0.8, 1.1, 0.8],
        y: [0, -30, 0],
        x: [0, 15, 0],
      }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${backendUrl}/api/v1/analytics/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).then(res => {
        if (res.data?.status === "active") setUserData(res.data);
      }).catch(() => {});
    }
  }, []);

  const stagger = {
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  const fadeScale = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col items-center overflow-x-hidden bg-[#fafafa]">

      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-6 pt-16 sm:pt-20 pb-24 sm:pb-32 overflow-hidden">

        {/* Animated gradient orbs */}
        <FloatingOrb className="w-[500px] h-[500px] bg-blue-200/40 blur-[100px] top-[10%] left-[15%]" delay={0} />
        <FloatingOrb className="w-[400px] h-[400px] bg-purple-200/30 blur-[120px] top-[20%] right-[10%]" delay={2} />
        <FloatingOrb className="w-[300px] h-[300px] bg-cyan-200/25 blur-[80px] bottom-[15%] left-[40%]" delay={4} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] -z-[5]" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-3xl z-10"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 text-xs font-medium uppercase tracking-widest backdrop-blur-sm">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"
            />
            v1.0 is now live
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-gray-900 mb-6 leading-tight">
            Your client&apos;s data. <br />
            <motion.span
              className="inline-block bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 bg-clip-text text-transparent bg-[length:200%_100%]"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              Beautifully unified.
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-500 mb-10 font-light max-w-xl mx-auto px-4">
            The ultimate multi-tenant infrastructure for marketing agencies. Connect Google Analytics, Meta & LinkedIn securely in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg transition-colors duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group"
              >
                <span className="relative z-10">{isLoggedIn ? "Go to Workspace" : "Get Started Free"}</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              </motion.button>
            </Link>
            <Link href="#features">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white text-gray-700 rounded-full font-medium text-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
              >
                See Features ↓
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* --- STATS TICKER --- */}
      <section className="w-full bg-white border-y border-gray-100 py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: 2500, suffix: "+", label: "Workspaces Created" },
            { value: 12, suffix: "M+", label: "Data Points Processed" },
            { value: 99, suffix: ".9%", label: "Uptime SLA" },
            { value: 3, suffix: "", label: "Platform Integrations" },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeScale} className="flex flex-col items-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- PLATFORM LOGOS MARQUEE --- */}
      <section className="w-full bg-[#fafafa] py-12 overflow-hidden">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Integrates with your stack</p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#fafafa] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#fafafa] to-transparent z-10" />
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center space-x-16 w-max"
          >
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center space-x-16">
                {[
                  { name: "Google Analytics", icon: <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
                  { name: "Meta Business", icon: <svg className="w-8 h-8" fill="#1877F2" viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg> },
                  { name: "Instagram", icon: <svg className="w-8 h-8" viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#FCAF45"/><stop offset="25%" stopColor="#F77737"/><stop offset="50%" stopColor="#FD1D1D"/><stop offset="75%" stopColor="#E1306C"/><stop offset="100%" stopColor="#833AB4"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)"/><circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="white"/></svg> },
                  { name: "LinkedIn", icon: <svg className="w-8 h-8" fill="#0A66C2" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg> },
                  { name: "GA4", icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" fill="#E37400"/><path d="M8 16V12M12 16V8M16 16V10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg> },
                  { name: "Ads Manager", icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#34A853"/><path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                ].map((brand, i) => (
                  <div key={i} className="flex items-center space-x-3 opacity-50 hover:opacity-100 transition-opacity duration-300">
                    {brand.icon}
                    <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">{brand.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
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
              { step: "01", title: "Initialize Tenant", desc: "Create a secure workspace for your agency in seconds.", icon: "🏗️" },
              { step: "02", title: "Connect Platforms", desc: "One-click OAuth for Google, Meta & LinkedIn.", icon: "🔗" },
              { step: "03", title: "View Dashboards", desc: "Watch real-time data flow into beautiful charts.", icon: "📊" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="flex flex-col items-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:shadow-lg transition-shadow duration-300"
                >
                  {item.icon}
                </motion.div>
                <div className="text-xs font-bold text-blue-500 mb-2 tracking-widest">{item.step}</div>
                <h3 className="text-xl font-medium mb-3">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-px w-24 bg-gray-200 origin-left"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <FaqSection />

      {/* --- DASHBOARD PREVIEW SECTION --- */}
      <section className="w-full bg-gray-50 py-20 sm:py-24 relative overflow-hidden border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
              {isLoggedIn ? "Your live workspace" : "See what you'll get"}
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              {isLoggedIn
                ? "Here's a quick snapshot from your connected analytics."
                : "A unified analytics workspace powered by real-time data from every platform."
              }
            </p>
          </motion.div>

          {isLoggedIn && userData ? (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Active Users", value: Number(userData.summary?.active_users || 0).toLocaleString(), color: "blue" },
                  { label: "Page Views", value: Number(userData.summary?.page_views || 0).toLocaleString(), color: "green" },
                  { label: "Bounce Rate", value: userData.summary?.bounce_rate || "–", color: "amber" },
                  { label: "Avg Duration", value: userData.summary?.avg_duration || "–", color: "purple" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={fadeScale} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow duration-300">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {userData.post_level && userData.post_level.length > 0 && (
                <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
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
                </motion.div>
              )}

              <div className="text-center">
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg shadow-xl"
                  >
                    Open Full Workspace →
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative">
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4"
                >
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mb-2 text-center px-4">Sign in to see your data</h3>
                <p className="text-gray-500 mb-6 max-w-sm text-center text-sm sm:text-base px-4">Connect your analytics platforms and watch your dashboard come alive.</p>
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3.5 bg-black text-white rounded-full font-medium shadow-xl"
                  >
                    Create Free Workspace
                  </motion.button>
                </Link>
              </div>

              {/* Mock preview cards */}
              <div className="opacity-40 pointer-events-none select-none rounded-3xl overflow-hidden p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {["Active Users", "Page Views", "Bounce Rate", "Avg Duration"].map((label, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 0.4, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-2xl p-5 border border-gray-200 text-center"
                    >
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-2xl font-bold text-gray-300">•••</p>
                    </motion.div>
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
      <section id="pricing" className="w-full bg-black py-24 sm:py-32 text-center px-6 relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[length:400%_400%] bg-gradient-to-r from-gray-900 via-blue-950 to-gray-900 opacity-80"
        />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-2xl mx-auto relative z-10">
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">Ready to deploy?</motion.h2>
          <motion.p variants={fadeUp} className="text-base sm:text-lg text-gray-400 font-light mb-10">Stop managing scattered dashboards. Centralize your analytics in one unified platform.</motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-black rounded-full font-medium text-lg transition-all duration-300"
              >
                Create your account
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}