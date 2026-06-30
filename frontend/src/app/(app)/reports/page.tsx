"use client";

import { motion } from "framer-motion";
import jsPDF from "jspdf";
import { useState } from "react";
import { getApiUrl } from "../../../lib/auth";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const backendUrl = getApiUrl();

      // Fetch real dashboard data
      const res = await fetch(`${backendUrl}/api/v1/analytics/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      const d = result.data;

      // Fetch real campaign data
      const campRes = await fetch(`${backendUrl}/api/v1/workspace/campaigns`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const campResult = await campRes.json();
      const campaigns = campResult.campaigns || [];

      const doc = new jsPDF();
      doc.setFont("helvetica");

      // Header
      doc.setFontSize(22);
      doc.text("Workspace Analytics Report", 20, 30);

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
      if (d?.company_name) {
        doc.text(`Workspace: ${d.company_name}`, 20, 47);
      }

      // Executive Summary with REAL values
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text("Executive Summary", 20, 65);

      doc.setFontSize(12);
      const users = d?.summary?.active_users || "0";
      const views = d?.summary?.page_views || "0";
      const duration = d?.summary?.avg_duration || "0s";
      const bounce = d?.summary?.bounce_rate || "0%";

      doc.text(`Active Users: ${Number(users).toLocaleString()}`, 20, 80);
      doc.text(`Page Views: ${Number(views).toLocaleString()}`, 20, 90);
      doc.text(`Average Session Duration: ${duration}`, 20, 100);
      doc.text(`Bounce Rate: ${bounce}`, 20, 110);

      // Separator
      doc.setLineWidth(0.5);
      doc.line(20, 122, 190, 122);

      // Top Campaigns from real data
      doc.setFontSize(16);
      doc.text("Top Campaigns", 20, 137);
      doc.setFontSize(12);
      campaigns.slice(0, 5).forEach((camp: any, idx: number) => {
        doc.text(`${idx + 1}. ${camp.name} (ROI: ${camp.roi})`, 20, 152 + idx * 10);
      });

      // Top Traffic Sources from real data
      const postLevel = d?.post_level || [];
      if (postLevel.length > 0) {
        const startY = 152 + Math.min(campaigns.length, 5) * 10 + 15;
        doc.setFontSize(16);
        doc.text("Traffic Sources", 20, startY);
        doc.setFontSize(12);
        postLevel.slice(0, 5).forEach((src: any, idx: number) => {
          doc.text(`${src.source}: ${src.views} views, ${src.users} users`, 20, startY + 15 + idx * 10);
        });
      }

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("ArbFlow Intelligence Systems", 20, 280);

      doc.save(`ArbFlow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate report", err);
    } finally {
      setGenerating(false);
    }
  };

  const reports = [
    { name: "September 2026 Performance", date: "Oct 1, 2026", type: "PDF", size: "2.4 MB" },
    { name: "Q3 High-Level Overview", date: "Oct 1, 2026", type: "PDF", size: "1.8 MB" },
    { name: "August 2026 Performance", date: "Sep 1, 2026", type: "PDF", size: "2.5 MB" },
    { name: "Raw Data Export Q3", date: "Sep 30, 2026", type: "CSV", size: "14 MB" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">Reports Hub</h1>
          <p className="text-gray-500 font-light text-lg">Generate, schedule, and download automated reports.</p>
        </div>
        <button 
          onClick={generatePDF}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-3 rounded-xl font-medium shadow-sm flex items-center space-x-2 disabled:opacity-50"
        >
          {generating ? (
            <div className="flex space-x-2 items-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>Generate Report</span>
            </>
          )}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Automated Schedules</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">You have 2 scheduled reports running every 1st of the month.</p>
          <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium">Manage Schedules</button>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Last generation successful</p>
              <p className="text-gray-900 font-semibold mt-1">Today at 9:00 AM</p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-medium mb-6">Recent Reports</h3>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-5">Report Name</th>
              <th className="px-6 py-5">Date Generated</th>
              <th className="px-6 py-5">Type / Size</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center space-x-3">
                  <svg className={`w-5 h-5 ${report.type === 'PDF' ? 'text-red-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  <span>{report.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{report.date}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md mr-2 ${report.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{report.type}</span>
                  {report.size}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={generatePDF} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
