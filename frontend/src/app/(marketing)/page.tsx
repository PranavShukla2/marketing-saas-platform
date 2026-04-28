"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import FaqSection from "../../components/FaqSection";
import Footer from "../../components/Footer";
import BentoBox from "../../components/BentoBox";
import AppleAnalyticsDashboard from "../../components/AppleAnalyticsDashboard";

export default function HomePage() {
  const fadeUp: any = {
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

      {/* --- DASHBOARD PREVIEW SECTION --- */}
      <section className="w-full bg-[#fafafa] py-16 relative overflow-hidden flex flex-col items-center px-4">
        <div className="max-w-6xl w-full relative">
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[6px] rounded-[3rem] border border-white/50 shadow-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-4 text-center px-4">Unlock your unified workspace</h2>
            <p className="text-gray-600 mb-8 max-w-md text-center">Connect your data sources in seconds and experience real-time sync with deep analytics.</p>
            <Link href="/register">
              <button className="px-8 py-4 bg-black text-white rounded-full font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-xl">
                Create Free Workspace
              </button>
            </Link>
          </div>
          
          <div className="w-full opacity-60 pointer-events-none transform scale-[0.98] select-none rounded-[3rem] overflow-hidden">
            <AppleAnalyticsDashboard data={{
              summary: { active_users: 1240, bounce_rate: '34%', page_views: 45200, avg_duration: '45s' },
              post_level: [{source: 'organic', views: 24000}, {source: 'direct', views: 15000}, {source: 'social', views: 6200}],
              device_data: [{device: 'mobile', users: 8000}, {device: 'desktop', users: 4000}],
              pages_data: [{path: '/home', views: 12000, avg_duration: 120}, {path: '/pricing', views: 4000, avg_duration: 80}],
              ecommerce_data: [{name: 'Premium Plan', purchases: 45, revenue: 12500}]
            }} />
          </div>
        </div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <BentoBox />

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

      {/* --- FAQ SECTION --- */}
      <FaqSection />

      {/* --- NEW BOTTOM CTA --- */}
      <section id="pricing" className="w-full bg-black py-32 text-center px-6">
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
      <Footer />

    </div>
  );
}