"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
    <div className="w-full max-w-6xl mx-auto py-8 relative">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-10 left-1/2 z-50 bg-black text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">Campaigns</h1>
          <p className="text-gray-500 font-light text-lg">Manage and monitor your active marketing channels.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-black hover:bg-gray-800 active:scale-95 transition-all text-white px-6 py-3 rounded-xl font-medium shadow-md"
        >
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {campaigns.map((camp, i) => (
          <motion.div 
            key={camp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-center mb-6 relative">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${camp.status === 'Active' ? 'bg-green-50 text-green-600' : camp.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-600'}`}>
                {camp.status}
              </span>
              <button 
                onClick={() => setOpenMenuId(openMenuId === camp.id ? null : camp.id)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
              </button>

              <AnimatePresence>
                {openMenuId === camp.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-8 bg-white border border-gray-100 shadow-xl rounded-xl w-32 py-2 z-10"
                  >
                    <button onClick={() => { setOpenMenuId(null); showToast("Campaign edited"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Edit</button>
                    <button onClick={() => { setOpenMenuId(null); showToast(`Campaign ${camp.status === 'Active' ? 'paused' : 'activated'}`); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">{camp.status === 'Active' ? 'Pause' : 'Activate'}</button>
                    <button onClick={() => { setOpenMenuId(null); showToast("Campaign deleted"); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors">Delete</button>
                  </motion.div>
                )}
              </AnimatePresence>
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
            >
              <h2 className="text-2xl font-semibold mb-6">Create New Campaign</h2>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. Q4 Push" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="$5,000" />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
                <button onClick={() => { setShowModal(false); showToast("Draft saved as new campaign!"); }} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm">Save Draft</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
