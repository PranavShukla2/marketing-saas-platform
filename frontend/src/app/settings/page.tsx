"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("integrations");
  
  // State for the API Keys
  const [ga4PropertyId, setGa4PropertyId] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  
  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setIsSaved(false);

    // 1. Get the VIP pass from local storage
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // 2. Send the sensitive data to the secure backend vault
      const response = await fetch("http://localhost:8000/api/v1/integrations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Provide the VIP pass!
        },
        body: JSON.stringify({
          provider: "google_analytics",
          property_id: ga4PropertyId,
          service_account_json: serviceAccountKey
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save credentials");
      }

      // Success! Show the green checkmark
      setIsSaved(true);
      setGa4PropertyId(""); // Clear the fields for security
      setServiceAccountKey("");
      
      // Hide the checkmark after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Content for each sub-page
  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="profile">
            <h2 className="text-xl font-medium mb-6">Profile Settings</h2>
            <p className="text-gray-500 text-sm">Profile configuration goes here.</p>
          </motion.div>
        );

      case "workspace":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="workspace">
            <h2 className="text-xl font-medium mb-6">Workspace Configuration</h2>
            <p className="text-gray-500 text-sm">Workspace settings go here.</p>
          </motion.div>
        );

      case "billing":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="billing">
            <h2 className="text-xl font-medium mb-6">Subscription & Billing</h2>
            <p className="text-gray-500 text-sm">Billing details go here.</p>
          </motion.div>
        );

      case "integrations":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="integrations">
            <h2 className="text-xl font-medium mb-1">API Integrations</h2>
            <p className="text-gray-500 text-sm mb-8">Securely connect your GA4 credentials. They will be AES-256 encrypted at rest.</p>
            
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveIntegrations} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GA4 Property ID</label>
                <input 
                  type="text" 
                  required
                  value={ga4PropertyId}
                  onChange={(e) => setGa4PropertyId(e.target.value)}
                  placeholder="e.g. 123456789" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-black transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Account Key (JSON)</label>
                <textarea 
                  required
                  value={serviceAccountKey}
                  onChange={(e) => setServiceAccountKey(e.target.value)}
                  rows={6} 
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key": "..."\n}`} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:border-black resize-none transition-all text-gray-600" 
                />
              </div>
              
              <div className="pt-2 flex items-center space-x-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Encrypting..." : "Save Credentials"}
                </button>

                {isSaved && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-medium text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Keys Secured!
                  </motion.span>
                )}
              </div>
            </form>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-10 font-sans text-gray-900 flex justify-center">
      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-10">
        
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-64 flex-shrink-0">
          <h1 className="text-3xl font-semibold tracking-tight mb-8">Settings</h1>
          <nav className="space-y-1">
            {["profile", "workspace", "integrations", "billing"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(""); setIsSaved(false); }}
                className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab ? "bg-white text-black shadow-sm border border-gray-200" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Dynamic Content Area */}
        <div className="flex-grow max-w-3xl">
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-gray-100 min-h-[500px]">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>
        
      </div>
    </div>
  );
}