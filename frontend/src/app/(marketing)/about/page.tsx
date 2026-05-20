"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
  };

  return (
    <div className="flex flex-col items-center bg-[#fafafa] min-h-screen">

      {/* Hero */}
      <section className="w-full relative py-24 sm:py-32 text-center px-6 overflow-hidden">
        {/* Background orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[120px] -z-10"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-purple-200/20 rounded-full blur-[100px] -z-10"
        />

        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto">

          {/* Emoji wave */}
          <motion.div variants={fadeUp} className="mb-6">
            <motion.span
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              className="inline-block text-5xl sm:text-6xl"
            >
              👋
            </motion.span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter text-gray-900 mb-4 leading-tight">
            Hey, I&apos;m{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Pranav Shukla
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-500 font-light max-w-xl mx-auto mb-8">
            Builder, tinkerer, and the person behind ArbFlow — the marketing analytics platform you&apos;re looking at right now. ✨
          </motion.p>

          {/* Contact pill */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
            <motion.a
              href="mailto:pranavmshukla"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-700 group"
            >
              <span className="text-lg group-hover:animate-bounce">📧</span>
              <span>pranavmshukla</span>
            </motion.a>

            <motion.a
              href="https://github.com/PranavShukla2"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-900 rounded-full text-white shadow-sm hover:shadow-md transition-shadow text-sm font-medium group"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span>GitHub</span>
            </motion.a>

            <motion.a
              href="https://www.linkedin.com/in/pranav-shukla-softwaredeveloper"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0A66C2] rounded-full text-white shadow-sm hover:shadow-md transition-shadow text-sm font-medium group"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              <span>LinkedIn</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* About Cards */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Card 1 - The Mission */}
          <motion.div variants={fadeUp} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group">
            <motion.div whileHover={{ rotate: 10 }} className="text-4xl mb-5">🎯</motion.div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">The Mission</h3>
            <p className="text-gray-500 leading-relaxed">
              ArbFlow was born from a simple frustration — marketing agencies juggling dozens of disconnected analytics dashboards. I wanted to build one beautiful, unified hub that makes data feel effortless.
            </p>
          </motion.div>

          {/* Card 2 - The Stack */}
          <motion.div variants={fadeUp} className="bg-gray-900 text-white p-8 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
              initial={{ x: "-200%" }}
              whileInView={{ x: "200%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
            />
            <motion.div whileHover={{ rotate: -10 }} className="text-4xl mb-5 relative z-10">⚡</motion.div>
            <h3 className="text-xl font-semibold mb-3 relative z-10">The Stack</h3>
            <p className="text-gray-400 leading-relaxed relative z-10">
              Next.js 16 · FastAPI · PostgreSQL · Recharts · Framer Motion · Google Analytics API · Meta Graph API · LinkedIn Marketing API — all woven together into a seamless experience.
            </p>
          </motion.div>

          {/* Card 3 - The Vision */}
          <motion.div variants={fadeUp} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group">
            <motion.div whileHover={{ scale: 1.2 }} className="text-4xl mb-5">🚀</motion.div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">The Vision</h3>
            <p className="text-gray-500 leading-relaxed">
              Every marketing team deserves enterprise-grade analytics without the enterprise price tag. ArbFlow aims to democratize data intelligence for agencies of all sizes.
            </p>
          </motion.div>

          {/* Card 4 - Get in Touch */}
          <motion.div variants={fadeUp} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group flex flex-col justify-between">
            <div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl mb-5"
              >
                💬
              </motion.div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Let&apos;s Connect</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Have feedback, ideas, or just want to say hi? I&apos;d love to hear from you. Drop me a line anytime.
              </p>
            </div>
            <motion.a
              href="mailto:pranavmshukla"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center space-x-2 w-full px-6 py-3 bg-black text-white rounded-full font-medium shadow-sm hover:shadow-md transition-all text-sm"
            >
              <span>📧</span>
              <span>Send me an email</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
