"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem("token");
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/v1/workspace/campaigns`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loading) return <div className="p-10 font-light text-gray-400">Loading campaigns...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">Campaigns</h1>
          <p className="text-gray-500 font-light text-lg">Manage and monitor your active marketing channels.</p>
        </div>
        <button className="bg-black hover:scale-105 transition-transform text-white px-6 py-3 rounded-xl font-medium shadow-md">
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp, i) => (
          <motion.div 
            key={camp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-center mb-6">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${camp.status === 'Active' ? 'bg-green-50 text-green-600' : camp.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-600'}`}>
                {camp.status}
              </span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 mb-8">{camp.name}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Budget</p>
                <p className="text-lg font-medium">{camp.budget}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Spent</p>
                <p className="text-lg font-medium">{camp.spent}</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Est. ROI</span>
              <span className={`font-semibold text-lg ${camp.roi.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>{camp.roi}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
