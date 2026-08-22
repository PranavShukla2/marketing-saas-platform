"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getApiUrl, apiFetch } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [gaStatus, setGaStatus] = useState<string>("pending_integration");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCampaigns = async () => {
    try {
      const backendUrl = getApiUrl();
      // Session rides in the httpOnly cookie — no header needed.
      const res = await apiFetch(withWorkspace(`${backendUrl}/api/v1/workspace/campaigns`));
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setGaStatus(data.ga_status || "pending_integration");
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // Menu actions that actually modify campaign state in the UI
  const handlePauseToggle = (id: number) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, status: c.status === "Active" ? "Paused" : "Active" } : c
    ));
    setOpenMenuId(null);
    showToast("Campaign status updated");
  };

  const handleDelete = (id: number) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setOpenMenuId(null);
    showToast("Channel removed from view");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-[var(--line)] border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-8 relative" onClick={() => openMenuId && setOpenMenuId(null)}>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-50 bg-[var(--ink)] text-[var(--page)] px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] mb-2">Traffic Channels</h1>
          <p className="text-[var(--ink-2)] font-light text-lg">Real-time traffic sources from your Google Analytics.</p>
        </div>
        <button 
          onClick={() => setShowDemo(true)}
          className="bg-[var(--ink)] hover:opacity-90 active:scale-95 transition-all text-[var(--page)] px-5 py-2.5 rounded-xl font-medium shadow-sm text-sm"
        >
          How it works
        </button>
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-16 text-center shadow-sm"
        >
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
          </div>
          <h3 className="text-2xl font-semibold text-[var(--ink)] mb-3">No traffic channels yet</h3>
          <p className="text-[var(--ink-2)] max-w-md mx-auto mb-8 font-light">
            {gaStatus === "pending_integration" 
              ? "Connect your Google Analytics account to see your real traffic sources here automatically."
              : "Your GA4 property doesn't have enough traffic data in the last 30 days. Once visitors start arriving, channels will appear here."
            }
          </p>
          <div className="flex justify-center space-x-3">
            {gaStatus === "pending_integration" && (
              <button onClick={() => window.location.href = "/dashboard"} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm text-sm">
                Connect Google Analytics
              </button>
            )}
            <button onClick={() => setShowDemo(true)} className="px-5 py-2.5 bg-[var(--page)] hover:bg-[var(--line)] text-[var(--ink-2)] rounded-xl font-medium transition-colors text-sm">
              See a demo
            </button>
          </div>
        </motion.div>
      )}

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp, i) => (
          <motion.div 
            key={camp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-7 shadow-sm hover:shadow-md transition-all relative group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl"></div>
            
            <div className="flex justify-between items-center mb-5 relative">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${camp.status === 'Active' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/25' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/25'}`}>
                {camp.status}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === camp.id ? null : camp.id); }}
                className="p-1.5 rounded-lg hover:bg-[var(--page)] transition-colors"
              >
                <svg className="w-4 h-4 text-[var(--ink-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
              </button>

              <AnimatePresence>
                {openMenuId === camp.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    className="absolute right-0 top-10 bg-[var(--surface)] border border-[var(--line)] shadow-2xl rounded-2xl w-36 py-1.5 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => handlePauseToggle(camp.id)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--page)] transition-colors flex items-center space-x-2">
                      <svg className="w-3.5 h-3.5 text-[var(--ink-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={camp.status === 'Active' ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"}></path></svg>
                      <span>{camp.status === 'Active' ? 'Pause' : 'Activate'}</span>
                    </button>
                    <button onClick={() => handleDelete(camp.id)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors flex items-center space-x-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      <span>Remove</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-6">{camp.name}</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[var(--page)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--ink-2)] font-semibold uppercase tracking-wider mb-1">Views</p>
                <p className="text-lg font-bold text-[var(--ink)]">{camp.views?.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--page)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--ink-2)] font-semibold uppercase tracking-wider mb-1">Users</p>
                <p className="text-lg font-bold text-[var(--ink)]">{camp.users?.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">CTR</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{camp.ctr}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Demo / How It Works Modal */}
      <AnimatePresence>
        {showDemo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 backdrop-blur-sm px-4" onClick={() => setShowDemo(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--surface)] rounded-3xl p-10 max-w-xl w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowDemo(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--page)] transition-colors">
                <svg className="w-5 h-5 text-[var(--ink-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">How Traffic Channels Work</h2>
                <p className="text-[var(--ink-2)] text-sm font-light">These cards are generated automatically from your Google Analytics data.</p>
              </div>
              
              {/* Demo Card */}
              <div className="bg-[var(--page)] border border-[var(--line)] rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/25">Active</span>
                </div>
                <h3 className="text-lg font-semibold mb-4">Google Search</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[var(--surface)] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[var(--ink-2)] font-semibold uppercase tracking-wider mb-1">Views</p>
                    <p className="text-lg font-bold">2,450</p>
                  </div>
                  <div className="bg-[var(--surface)] rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[var(--ink-2)] font-semibold uppercase tracking-wider mb-1">Users</p>
                    <p className="text-lg font-bold">890</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">CTR</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">36.3%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-[var(--ink-2)]">
                <div className="flex space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-500/15 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">1</div>
                  <p><strong>Views</strong> — Total page views from this traffic source in the last 30 days.</p>
                </div>
                <div className="flex space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-500/15 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">2</div>
                  <p><strong>Users</strong> — Unique users who visited via this source.</p>
                </div>
                <div className="flex space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-500/15 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">3</div>
                  <p><strong>CTR</strong> — Click-through rate: the ratio of users to page views.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--line)]">
                <button onClick={() => setShowDemo(false)} className="w-full py-3 bg-[var(--ink)] text-[var(--page)] rounded-xl font-medium hover:bg-[var(--ink)] transition-colors text-sm">Got it</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
