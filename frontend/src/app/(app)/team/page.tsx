"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getApiUrl, apiFetch } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";

type Member = { member_id: number; name: string; email: string; role: string; status: string; avatar: string; removable: boolean };
type Invite = { email: string; role: string; status: string };

const ROLES = ["admin", "member", "viewer"];

export default function TeamPage() {
  const [team, setTeam] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/team`));
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
        setInvites(data.invites || []);
        setCanManage(!!data.can_manage);
      }
    } catch {
      /* leave empty; UI shows nothing rather than crashing */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/team/invite`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't send the invite.");
      setMsg({ kind: "ok", text: data.detail || "Invite sent." });
      setEmail("");
      load();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Couldn't send the invite." });
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (id: number) => {
    await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/team/member/${id}`), { method: "DELETE" });
    load();
  };

  const revokeInvite = async (inviteEmail: string) => {
    const base = `${getApiUrl()}/api/v1/workspace/team/invite?email=${encodeURIComponent(inviteEmail)}`;
    await apiFetch(withWorkspace(base), { method: "DELETE" });
    load();
  };

  if (loading) return <div className="p-10 font-light text-gray-400">Loading team…</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-2">Team</h1>
        <p className="text-gray-500 font-light text-lg">
          {canManage ? "Invite people to this workspace and manage their access." : "People with access to this workspace."}
        </p>
      </div>

      {canManage && (
        <motion.form
          onSubmit={invite}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none cursor-pointer bg-white">
            {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
          </select>
          <button type="submit" disabled={busy}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {busy ? "Sending…" : "Send invite"}
          </button>
        </motion.form>
      )}

      {msg && (
        <div className={`mb-6 text-sm px-4 py-3 rounded-xl ${msg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-8 py-5">Member</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.member_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold">{m.avatar}</div>
                    <div>
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-sm text-gray-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-gray-700">{m.role}</td>
                <td className="px-8 py-5">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span>{m.status}</span>
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {m.removable
                    ? <button onClick={() => removeMember(m.member_id)} className="text-sm font-medium text-gray-400 hover:text-red-500 transition">Remove</button>
                    : <span className="text-xs text-gray-300">—</span>}
                </td>
              </tr>
            ))}

            {invites.map((inv) => (
              <tr key={`inv-${inv.email}`} className="border-b border-gray-50 last:border-0 bg-amber-50/30">
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold">✉</div>
                    <div>
                      <p className="font-medium text-gray-900">{inv.email}</p>
                      <p className="text-sm text-gray-400">Invitation sent</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-gray-700">{inv.role}</td>
                <td className="px-8 py-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                </td>
                <td className="px-8 py-5 text-right">
                  {canManage && <button onClick={() => revokeInvite(inv.email)} className="text-sm font-medium text-gray-400 hover:text-red-500 transition">Revoke</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
