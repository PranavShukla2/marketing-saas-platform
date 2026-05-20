"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function IntegrationsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is logged in as soon as the page loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleConnectClick = () => {
    if (isAuthenticated) {
      // If they are signed in, send them straight to the Settings vault
      // (Since "integrations" is your default tab there, this works perfectly!)
      router.push("/settings");
    } else {
      // If they are a guest, send them to sign up so we can create a tenant for them
      router.push("/register");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] p-6 md:p-10 font-sans text-gray-900 flex flex-col items-center">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mt-10 mb-16">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Integration Directory</h1>
        <p className="text-lg text-gray-500 font-light">
          Connect your favorite marketing tools. All credentials are AES-256 encrypted at rest.
        </p>
      </motion.div>

      {/* Integrations Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Google Analytics Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between h-[300px] hover:-translate-y-1 transition-transform duration-300"
        >
          <div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
              {/* Simple GA Icon */}
              <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z"/>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Google Analytics 4</h3>
            <p className="text-gray-500 text-sm">
              Pull live time-series data, active users, and traffic metrics directly from GCP.
            </p>
          </div>
          
          <button 
            onClick={handleConnectClick}
            className="w-full py-3 mt-6 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {isAuthenticated ? "Manage Connection" : "Connect GA4"}
          </button>
        </motion.div>

        {/* Meta Ads Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between h-[300px] hover:-translate-y-1 transition-transform duration-300"
        >
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" /></svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Meta Ads</h3>
            <p className="text-gray-500 text-sm">
              Track ad spend, ROAS, and campaign performance across Facebook and Instagram.
            </p>
          </div>
          <button 
            onClick={handleConnectClick} 
            className="w-full py-3 mt-6 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {isAuthenticated ? "Manage Connection" : "Connect Meta"}
          </button>
        </motion.div>

        {/* LinkedIn Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between h-[300px] hover:-translate-y-1 transition-transform duration-300"
        >
          <div>
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </div>
            <h3 className="text-xl font-medium mb-2">LinkedIn</h3>
            <p className="text-gray-500 text-sm">
              Unify your B2B impressions, engagement rates, and professional audience demographics.
            </p>
          </div>
          <button 
            onClick={handleConnectClick} 
            className="w-full py-3 mt-6 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {isAuthenticated ? "Manage Connection" : "Connect LinkedIn"}
          </button>
        </motion.div>

      </div>
    </div>
  );
}