"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb'];

  const fetchData = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/analytics/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      setData(result.data);
    } catch (err) { 
      console.error("Fetch error:", err); 
    } finally { 
      setLoading(false);
      if (isManualSync) setTimeout(() => setSyncing(false), 1000);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    doc.text(`ArbFlow Report: ${data.company_name}`, 14, 15);
    autoTable(doc, {
      head: [['Source', 'Users', 'Views']],
      body: data.post_level.map((r: any) => [r.source, r.users, r.views]),
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: '#3b82f6' }
    });
    doc.save(`ArbFlow_Report_${data.company_name}.pdf`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-light text-gray-400">Loading ArbFlow Workspace...</div>;

  const combinedData = data?.post_level ? [...data.post_level, ...(data.forecast || [])] : [];

  return (
    <div className="min-h-screen bg-[#fafafa] p-8 md:p-12 font-sans text-gray-900 overflow-x-hidden">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{data?.company_name} Workspace</h1>
            <p className="text-gray-400 font-light mt-1">Intelligence Layer v1.0</p>
          </div>
          <button 
            onClick={() => fetchData(true)}
            disabled={syncing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${syncing ? "bg-gray-50 text-gray-400" : "bg-white text-blue-600 border-gray-200 hover:shadow-sm"}`}
          >
            <motion.svg animate={syncing ? { rotate: 360 } : { rotate: 0 }} transition={syncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}} className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.72 2.24" strokeLinecap="round" /><path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
            <span className="text-xs font-medium">{syncing ? "Syncing..." : "Sync Now"}</span>
          </button>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
          {["overview", "tracking", "insights"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "bg-white shadow-sm text-black" : "text-gray-500"}`}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[{ l: "Users", v: data.summary?.active_users }, { l: "Views", v: data.summary?.page_views }, { l: "Bounce", v: data.summary?.bounce_rate }, { l: "Duration", v: data.summary?.avg_duration }].map((k, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"><p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{k.l}</p><p className="text-4xl font-semibold">{k.v || "0"}</p></div>
                ))}
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-[400px]">
                <h3 className="text-xl font-medium mb-8">Traffic Velocity & Forecast</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="source" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fill="#3b82f610" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-[380px]"><h3 className="text-xl font-medium mb-6">Users by Channel</h3><ResponsiveContainer><BarChart data={data.post_level}><XAxis dataKey="source" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} /><Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-[380px]"><h3 className="text-xl font-medium mb-6">Reach Distribution</h3><ResponsiveContainer><PieChart><Pie data={data.post_level} dataKey="views" nameKey="source" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>{(data.post_level || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: '10px' }} /></PieChart></ResponsiveContainer></div>
              </div>
            </motion.div>
          )}

          {activeTab === "tracking" && (
            <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end space-x-4"><button onClick={downloadCSV} className="text-sm font-medium text-gray-500 hover:text-black">↓ Download CSV</button><button onClick={downloadPDF} className="text-sm font-medium text-blue-600 hover:underline">↓ Export PDF</button></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-left">
                <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest"><tr><th className="px-10 py-6">Source</th><th className="px-10 py-6 text-center">Users</th><th className="px-10 py-6 text-right">Views</th></tr></thead>
                <tbody>{data.post_level?.map((row: any, i: number) => (<tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm"><td className="px-10 py-6 font-semibold">{row.source}</td><td className="px-10 py-6 text-center text-gray-500">{row.users}</td><td className="px-10 py-6 text-right font-bold text-blue-600">{row.views}</td></tr>))}</tbody>
              </table></div>
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div key="insights" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
              <div className="w-full max-w-4xl bg-white p-16 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-[80px]"></div>
                <div className="relative z-10"><h2 className="text-gray-400 text-2xl font-light italic">Optimal Strategy:</h2><h3 className="text-6xl font-bold mt-4 mb-12 tracking-tighter">{data?.suggestions?.primary_focus}</h3><div className="grid md:grid-cols-2 gap-12 border-t pt-12"><div><p className="text-xs font-bold text-gray-400 uppercase mb-4">Logic</p><p className="text-xl text-gray-600 italic">"{data?.suggestions?.reason}"</p></div><div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100"><p className="text-blue-600 text-xs font-bold uppercase mb-4">Tactical Move</p><p className="text-xl font-medium">{data?.suggestions?.action_item}</p></div></div></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}