"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from "recharts";

const MOCK_CHART_DATA = [
  { name: "Mon", users: 400, views: 2400 },
  { name: "Tue", users: 300, views: 1398 },
  { name: "Wed", users: 200, views: 9800 },
  { name: "Thu", users: 278, views: 3908 },
  { name: "Fri", users: 189, views: 4800 },
  { name: "Sat", users: 239, views: 3800 },
  { name: "Sun", users: 349, views: 4300 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSecureData = async () => {
      // 1. Grab the VIP pass from storage
      const token = localStorage.getItem("token");
      
      // If they don't have a token, kick them back to login instantly
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // 2. Send the request WITH the Authorization header
        const response = await fetch("http://localhost:8000/api/v1/analytics/dashboard", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // If the token is expired or invalid, log them out
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch analytics data");
        }

        const result = await response.json();
        setData(result.data);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSecureData();
  }, [router]);

  if (loading) return <div className="p-10 text-xl font-bold flex justify-center items-center min-h-screen text-gray-400 animate-pulse">Syncing Engine...</div>;
  if (error) return <div className="p-10 text-red-500 font-bold min-h-screen flex justify-center items-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-10 font-sans text-gray-900">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {data?.company_name ? `${data.company_name} Workspace` : "Workspace Overview"}
        </h1>
        <p className="text-gray-500">Real-time performance metrics for your connected accounts.</p>
      </motion.div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Active Users", value: data?.active_users, color: "text-blue-600" },
          { label: "Total Views", value: data?.page_views, color: "text-green-600" },
          { label: "Bounce Rate", value: data?.bounce_rate, color: "text-orange-500" }
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={kpi.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <p className={`text-4xl font-light mt-2 ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Line Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-medium mb-6">Traffic Trends</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={2000} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-medium mb-6">Weekly Engagement</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_CHART_DATA}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none' }} />
              <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                {MOCK_CHART_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#111827' : '#e5e7eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

      </div>
    </div>
  );
}