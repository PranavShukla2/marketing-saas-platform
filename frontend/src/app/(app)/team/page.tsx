"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getApiUrl, apiFetch } from "../../../lib/auth";

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const backendUrl = getApiUrl();
        // Session rides in the httpOnly cookie — no header needed.
        const res = await apiFetch(`${backendUrl}/api/v1/workspace/team`);
        if (res.ok) {
          const data = await res.json();
          setTeam(data.team);
        }
      } catch (err) {
        console.error("Failed to fetch team", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) return <div className="p-10 font-light text-gray-400">Loading team members...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">Team Members</h1>
          <p className="text-gray-500 font-light text-lg">Manage access and roles for your workspace.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          <input type="email" placeholder="Email address" className="px-4 py-2 outline-none w-64 bg-transparent text-sm" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">Invite</button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm"
      >
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-8 py-6">Member</th>
              <th className="px-8 py-6">Role</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <select className="bg-transparent text-sm font-medium outline-none cursor-pointer hover:bg-gray-200 px-2 py-1 rounded-lg transition" defaultValue={member.role}>
                    <option>Admin</option>
                    <option>Editor</option>
                    <option>Viewer</option>
                  </select>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {member.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                    <span>{member.status}</span>
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="text-sm font-medium text-gray-400 hover:text-red-500 transition">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
