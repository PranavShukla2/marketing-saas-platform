"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getApiUrl, apiFetch } from "../../../lib/auth";

export default function BillingPage() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const backendUrl = getApiUrl();
        // Session rides in the httpOnly cookie — no header needed.
        const res = await apiFetch(`${backendUrl}/api/v1/workspace/billing`);
        if (res.ok) {
          const data = await res.json();
          setBilling(data);
        }
      } catch (err) {
        console.error("Failed to fetch billing", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  if (loading || !billing) return <div className="p-10 font-light text-gray-400">Loading billing info...</div>;
  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">Billing & Usage</h1>
        <p className="text-gray-500 font-light text-lg">Manage your subscription and monitor workspace limits.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Plan</p>
              <h2 className="text-2xl font-semibold">{billing.plan}</h2>
            </div>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">{billing.billing_cycle}</span>
          </div>
          
          <div className="flex items-end space-x-2 mb-2">
            <span className="text-5xl font-bold tracking-tighter text-gray-900">{billing.price}</span>
            <span className="text-gray-500 mb-1">/ mo</span>
          </div>
          <p className="text-sm font-medium text-blue-600 mb-8 bg-blue-50 w-fit px-3 py-1 rounded-md">Normally $99/mo — Waived for Beta Users</p>

          <div className="flex space-x-4">
            <button className="bg-black text-white px-6 py-3 rounded-xl font-medium shadow-md hover:scale-105 transition-transform active:scale-95">Upgrade Plan</button>
            <button className="bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-100 transition-colors active:bg-gray-200">Cancel</button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Workspace Usage</p>
          <h3 className="text-3xl font-semibold mb-2">{Math.floor(billing.usage.current / 1000)}k <span className="text-lg font-normal text-blue-200">/ {Math.floor(billing.usage.limit / 1000)}k</span></h3>
          <p className="text-sm text-blue-100 mb-6">Pageviews tracked this cycle</p>
          
          <div className="w-full bg-black/20 rounded-full h-2 mb-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${billing.usage.percentage}%` }}></div>
          </div>
          <p className="text-xs text-blue-200 text-right">{billing.usage.percentage}% used</p>
        </div>
      </div>

      <h3 className="text-xl font-medium mb-6">Billing History</h3>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {billing.invoices.map((invoice: any, i: number) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-6 py-4 text-sm font-medium">{invoice.date}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{invoice.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${invoice.status.includes('Waived') ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-700'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-500 hover:underline text-sm font-medium">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
