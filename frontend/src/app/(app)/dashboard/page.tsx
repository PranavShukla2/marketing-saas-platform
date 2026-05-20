"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AppleAnalyticsDashboard from "../../../components/AppleAnalyticsDashboard";
import MetaDashboard from "../../../components/MetaDashboard";
import LinkedInDashboard from "../../../components/LinkedInDashboard";
import PlatformLoader from "../../../components/PlatformLoader";

export default function Dashboard() {
  const [activePlatform, setActivePlatform] = useState("google");
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isPlatformLoading, setIsPlatformLoading] = useState(false);

  const handlePlatformChange = (platformId: string) => {
    if (platformId === activePlatform) return;
    setIsPlatformLoading(true);
    setTimeout(() => {
      setActivePlatform(platformId);
      setIsPlatformLoading(false);
    }, 1200); // 1.2s loading animation
  };

  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb'];

  const fetchData = async (isManualSync = false, propId = selectedProperty) => {
    if (isManualSync) setSyncing(true);
    const token = localStorage.getItem("token");
    try {
      // --- THE FIX: Dynamically fetching the backend URL for production ---
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = new URL(`${backendUrl}/api/v1/analytics/dashboard`);

      if (propId) url.searchParams.append("property_id", propId);

      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      setData(result.data);
      if (result.data?.active_property_id) {
        setSelectedProperty(result.data.active_property_id);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      if (isManualSync) setTimeout(() => setSyncing(false), 800);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      // Handle token from Google OAuth redirect
      const urlToken = params.get("token");
      if (urlToken) {
        localStorage.setItem("token", urlToken);
      }

      if (params.get("integration") === "success") {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchData();

    const savedLogo = localStorage.getItem("arbflow_agency_logo");
    if (savedLogo) setAgencyLogo(savedLogo);
  }, []);

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPropertyId = e.target.value;
    setSelectedProperty(newPropertyId);
    setLoading(true);
    fetchData(false, newPropertyId);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAgencyLogo(base64String);
        localStorage.setItem("arbflow_agency_logo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${backendUrl}/api/v1/integrations/google/link`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        console.error("No URL returned from backend:", result);
      }
    } catch (err) {
      console.error("Failed to generate Google login link", err);
    }
  };

  const downloadCSV = () => {
    if (!data?.post_level) return;
    const headers = "Source,Campaign,Users,Views\n";
    const rows = data.post_level.map((r: any) => `${r.source},${r.campaign},${r.users},${r.views}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ArbFlow_Data_${data.company_name}.csv`;
    a.click();
  };

  const downloadPDF = () => {
    if (!data?.post_level) return;
    const doc = new jsPDF();
    let currentY = 20;

    if (agencyLogo) {
      try {
        const imgProps = doc.getImageProperties(agencyLogo);
        const imgWidth = 40;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(agencyLogo, 14, 10, imgWidth, imgHeight);
        currentY = 10 + imgHeight + 15;
      } catch (e) {
        console.error("Error adding image to PDF", e);
      }
    }

    doc.setTextColor(59, 130, 246);
    doc.setFontSize(22);
    doc.text("Agency Performance Report", 14, currentY);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.text(`Client Workspace: ${data.company_name}`, 14, currentY + 8);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, currentY + 14);

    autoTable(doc, {
      head: [['Source', 'Users', 'Views']],
      body: data.post_level.map((r: any) => [r.source, r.users, r.views]),
      startY: currentY + 25,
      theme: 'grid',
      headStyles: { fillColor: '#3b82f6' }
    });

    doc.save(`${data.company_name}_Performance_Report.pdf`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-light text-gray-400">Loading Workspace...</div>;
  if (!data && activePlatform === "google") return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]"><p className="text-gray-500 mb-4">Session expired.</p><button onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Log In Again</button></div>;

  if (activePlatform === "google" && (data?.status === "pending" || data?.status === "pending_integration")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 max-w-md text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3">Welcome to ArbFlow</h2>
          <p className="text-gray-500 mb-8 font-light">To generate your dashboard, you need to connect your Google Analytics account securely.</p>
          <button onClick={handleConnectGoogle} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium rounded-xl w-full shadow-sm">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const combinedData = data?.post_level ? [...data.post_level, ...(data.forecast || [])] : [];

  return (
    <div className="w-full font-sans text-gray-900 relative">
      <AnimatePresence>
        {isPlatformLoading && <PlatformLoader platform={activePlatform} />}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-full shadow-lg flex items-center space-x-3"
          >
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            <span className="font-medium text-sm">Google Analytics connected successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center space-x-6">
          <div className="relative group cursor-pointer">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
            <label htmlFor="logo-upload" className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all overflow-hidden">
              {agencyLogo ? <img src={agencyLogo} alt="Agency Logo" className="w-full h-full object-contain p-1" /> : <span className="text-gray-400 text-sm font-medium">Logo</span>}
            </label>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{data?.company_name || 'My'} Workspace</h1>
            {activePlatform === "google" && data?.properties && data.properties.length > 0 && (
              <select
                value={selectedProperty}
                onChange={handlePropertyChange}
                className="mt-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 shadow-sm"
              >
                {data.properties.map((prop: any) => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
            )}
          </div>

          <button onClick={() => fetchData(true)} disabled={syncing} className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${syncing ? "bg-gray-50 text-gray-400" : "bg-white text-blue-600 border-gray-200 hover:shadow-sm"}`}>
            <motion.svg animate={syncing ? { rotate: 360 } : { rotate: 0 }} transition={syncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}} className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.72 2.24" strokeLinecap="round" /><path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
            <span className="text-xs font-medium">{syncing ? "Syncing..." : "Sync Now"}</span>
          </button>

          <button onClick={handleConnectGoogle} className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:shadow-sm transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            <span className="text-xs font-medium">Switch Account</span>
          </button>
        </div>
      </header>

      {/* Platform Selector & Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Vertical Platform Selector */}
          <div className="flex md:flex-col gap-2 bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-gray-200/60 shadow-sm md:w-56 h-max">
            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 hidden md:block">
              Data Sources
            </div>
            {[
              { id: "google", label: "Google Analytics", color: "text-blue-600", bg: "bg-blue-50", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z" },
              { id: "meta", label: "Meta Business", color: "text-[#1877F2]", bg: "bg-blue-50", icon: "M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" },
              { id: "linkedin", label: "LinkedIn Analytics", color: "text-[#0A66C2]", bg: "bg-sky-50", icon: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.16-3.51c-1.2 0-1.8.66-2.11 1.16v-1h-2.3v8.65h2.3v-4.83c0-1.27.24-2.5 1.82-2.5 1.55 0 1.58 1.45 1.58 2.58v4.75h2.37zM6.9 8.24A1.33 1.33 0 1 0 5.57 6.9 1.33 1.33 0 0 0 6.9 8.24M5.7 18.5h2.37V9.85H5.7v8.65z" }
            ].map(platform => {
              const isActive = activePlatform === platform.id || (isPlatformLoading && activePlatform === platform.id); // highlight during load too
              return (
                <button 
                  key={platform.id} 
                  onClick={() => handlePlatformChange(platform.id)} 
                  className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 w-full text-left overflow-hidden group ${isActive ? "text-gray-900 shadow-sm bg-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  {isActive && (
                    <motion.div layoutId="active-platform" className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                  )}
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? platform.bg : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <svg className={`w-4 h-4 ${isActive ? platform.color : 'text-gray-400 group-hover:text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d={platform.icon} /></svg>
                  </div>
                  <span className="flex-grow">{platform.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">

      {/* Google Analytics Sub-Tabs */}
      <AnimatePresence>
        {activePlatform === "google" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-max">
              {[
                { id: "overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                { id: "tracking", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                { id: "insights", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                { id: "analytics", icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-800"}`}>
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
                  <span>{tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pb-32">
        <AnimatePresence>
          {data?.anomaly?.is_anomaly && (
            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center space-x-3 shadow-sm">
                <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
                <p className="text-red-700 text-sm font-medium">{data.anomaly.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* META DASHBOARD */}
          {activePlatform === "meta" && (
             <motion.div key="meta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <MetaDashboard />
             </motion.div>
          )}

          {/* LINKEDIN DASHBOARD */}
          {activePlatform === "linkedin" && (
             <motion.div key="linkedin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <LinkedInDashboard />
             </motion.div>
          )}

          {/* GOOGLE ANALYTICS DASHBOARD */}
          {activePlatform === "google" && activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[{ l: "Users", v: data.summary?.active_users }, { l: "Views", v: data.summary?.page_views }, { l: "Bounce", v: data.summary?.bounce_rate }, { l: "Duration", v: data.summary?.avg_duration }].map((k, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"><p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{k.l}</p><p className="text-4xl font-semibold">{k.v || "0"}</p></div>
                ))}
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-[400px]">
                <h3 className="text-xl font-medium mb-8">Traffic Velocity & Forecast</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="source" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fill="#3b82f610" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-[380px]">
                  <h3 className="text-xl font-medium mb-6">Users by Channel</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.post_level} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="source" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                      <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-[380px]">
                  <h3 className="text-xl font-medium mb-6">Reach Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 30 }}>
                      <Pie data={data.post_level} dataKey="views" nameKey="source" cx="50%" cy="45%" innerRadius={60} outerRadius={90}>
                        {(data.post_level || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </motion.div>
          )}

          {activePlatform === "google" && activeTab === "tracking" && (
            <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end space-x-4"><button onClick={downloadCSV} className="text-sm font-medium text-gray-500 hover:text-black">↓ Download CSV</button><button onClick={downloadPDF} className="text-sm font-medium text-blue-600 hover:underline">↓ Export PDF</button></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-left">
                <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest"><tr><th className="px-10 py-6">Source</th><th className="px-10 py-6 text-center">Users</th><th className="px-10 py-6 text-right">Views</th></tr></thead>
                <tbody>{data.post_level?.map((row: any, i: number) => (<tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm"><td className="px-10 py-6 font-semibold">{row.source}</td><td className="px-10 py-6 text-center text-gray-500">{row.users}</td><td className="px-10 py-6 text-right font-bold text-blue-600">{row.views}</td></tr>))}</tbody>
              </table></div>
            </motion.div>
          )}

          {activePlatform === "google" && activeTab === "insights" && (
            <motion.div key="insights" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
              <div className="w-full max-w-4xl bg-white p-16 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-[80px]"></div>
                <div className="relative z-10"><h2 className="text-gray-400 text-2xl font-light italic">Optimal Strategy:</h2><h3 className="text-6xl font-bold mt-4 mb-12 tracking-tighter">{data?.suggestions?.primary_focus}</h3><div className="grid md:grid-cols-2 gap-12 border-t pt-12"><div><p className="text-xs font-bold text-gray-400 uppercase mb-4">Logic</p><p className="text-xl text-gray-600 italic">"{data?.suggestions?.reason}"</p></div><div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100"><p className="text-blue-600 text-xs font-bold uppercase mb-4">Tactical Move</p><p className="text-xl font-medium">{data?.suggestions?.action_item}</p></div></div></div>
              </div>
            </motion.div>
          )}

          {activePlatform === "google" && activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <AppleAnalyticsDashboard data={data} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      </div>
      </div>
      </div>
    </div>
  );
}