"use client";

import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-10 font-sans">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-4">Simple, transparent pricing.</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
          Scale your marketing agency with secure, multi-tenant analytics.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Starter Plan */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-10 rounded-3xl border border-gray-200 bg-gray-50 flex flex-col"
        >
          <h2 className="text-2xl font-medium mb-2">Starter</h2>
          <p className="text-gray-500 mb-6">Perfect for solo agencies.</p>
          <div className="text-5xl font-light tracking-tight mb-8">$49<span className="text-lg text-gray-400 tracking-normal">/mo</span></div>
          <ul className="space-y-4 mb-10 flex-grow text-gray-600">
            <li className="flex items-center">✓ 5 Client Dashboards</li>
            <li className="flex items-center">✓ Manual API Key Entry</li>
            <li className="flex items-center">✓ Standard Support</li>
          </ul>
          <button className="w-full py-3 rounded-full bg-white text-black border border-gray-200 font-medium hover:bg-gray-100 transition-colors">
            Get Started
          </button>
        </motion.div>

        {/* Pro Plan (Highlighted) */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-10 rounded-3xl bg-black text-white shadow-2xl flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">POPULAR</div>
          <h2 className="text-2xl font-medium mb-2">Enterprise</h2>
          <p className="text-gray-400 mb-6">For scaling SaaS platforms.</p>
          <div className="text-5xl font-light tracking-tight mb-8">$199<span className="text-lg text-gray-500 tracking-normal">/mo</span></div>
          <ul className="space-y-4 mb-10 flex-grow text-gray-300">
            <li className="flex items-center">✓ Unlimited Dashboards</li>
            <li className="flex items-center">✓ OAuth 2.0 Integration</li>
            <li className="flex items-center">✓ Custom Database Vault</li>
          </ul>
          <button className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors">
            Scale Now
          </button>
        </motion.div>
      </div>
    </div>
  );
}