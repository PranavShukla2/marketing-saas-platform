"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl, logout, apiFetch } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  // Real profile, loaded from the backend.
  const [profile, setProfile] = useState<{ email: string; company_name: string } | null>(null);

  // Account-deletion flow.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  // Branding (white-label) — logo / accent colour / report footer.
  const [brand, setBrand] = useState<{ logo_url: string | null; accent_color: string; report_footer: string }>(
    { logo_url: null, accent_color: "#5b5bd6", report_footer: "" }
  );
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMsg, setBrandMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/branding`));
        if (res.ok) {
          const b = await res.json();
          setBrand({ logo_url: b.logo_url, accent_color: b.accent_color || "#5b5bd6", report_footer: b.report_footer || "" });
        }
      } catch {}
    })();
  }, []);

  // Notifications — Slack/Discord webhook + weekly digest toggle.
  const [notif, setNotif] = useState<{ slack_webhook_url: string; digest_enabled: boolean }>(
    { slack_webhook_url: "", digest_enabled: true }
  );
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/notifications`));
        if (res.ok) {
          const n = await res.json();
          setNotif({ slack_webhook_url: n.slack_webhook_url || "", digest_enabled: !!n.digest_enabled });
        }
      } catch {}
    })();
  }, []);

  const saveNotifications = async () => {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/notifications`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notif),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't save notification settings.");
      setNotifMsg({ kind: "ok", text: "Saved. Alerts will also go to your webhook; the digest lands weekly." });
    } catch (err) {
      setNotifMsg({ kind: "err", text: err instanceof Error ? err.message : "Couldn't save notification settings." });
    } finally {
      setNotifSaving(false);
    }
  };

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { setBrandMsg({ kind: "err", text: "Please choose an image under 500KB." }); return; }
    const reader = new FileReader();
    reader.onloadend = () => setBrand((b) => ({ ...b, logo_url: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    setBrandSaving(true);
    setBrandMsg(null);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/branding`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't save branding.");
      setBrandMsg({ kind: "ok", text: "Branding saved. It'll show on your dashboards and exported reports." });
    } catch (err) {
      setBrandMsg({ kind: "err", text: err instanceof Error ? err.message : "Couldn't save branding." });
    } finally {
      setBrandSaving(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Session rides in the httpOnly cookie — no header needed.
        const res = await apiFetch(`${getApiUrl()}/api/v1/auth/me`);
        if (res.ok) setProfile(await res.json());
      } catch {
        /* leave profile null; UI shows a graceful fallback */
      }
    })();
  }, []);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await apiFetch(`${getApiUrl()}/api/v1/auth/me/export`);
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "arbflow-data-export.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      /* non-critical; the button simply re-enables */
    } finally {
      setExporting(false);
    }
  };

  const handleLogoutAll = async () => {
    setSigningOutAll(true);
    try {
      // Revokes every refresh-token family server-side, including this one.
      await apiFetch(`${getApiUrl()}/api/v1/auth/logout-all`, { method: "POST" });
    } catch {
      /* fall through — cookies are cleared on the redirect either way */
    }
    try {
      localStorage.removeItem("token");
    } catch {}
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await apiFetch(`${getApiUrl()}/api/v1/auth/me`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete account.");
      await logout(); // clear the (now-orphaned) session cookie + legacy storage
      router.push("/?deleted=1");
    } catch {
      setDeleteError("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="profile">
            <h2 className="text-2xl font-medium mb-1 tracking-tight">Personal Information</h2>
            <p className="text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">Your account details.</p>

            <div className="space-y-6 max-w-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company / Agency</label>
                <input type="text" readOnly value={profile?.company_name ?? "—"} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" readOnly value={profile?.email ?? "—"} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed" />
              </div>
            </div>

            {/* Your data — GDPR/CCPA portability: download everything we hold. */}
            <div className="mt-12 border border-gray-200 rounded-2xl overflow-hidden max-w-lg">
              <div className="px-6 py-4 bg-gray-50/60 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Your data</h3>
              </div>
              <div className="p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Export my data</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Download a JSON copy of your profile, connections, activity log and cached dashboards. Credentials are never included.</p>
                </div>
                <button onClick={handleExportData} disabled={exporting} className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                  {exporting ? "Preparing…" : "Export"}
                </button>
              </div>
            </div>

            {/* Sessions — revoke every refresh token (all devices). */}
            <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden max-w-lg">
              <div className="px-6 py-4 bg-gray-50/60 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Sessions</h3>
              </div>
              <div className="p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sign out all devices</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Revokes every active session, including this one. Use it if you think a device you&apos;re signed in on was lost or compromised.</p>
                </div>
                <button onClick={handleLogoutAll} disabled={signingOutAll} className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                  {signingOutAll ? "Signing out…" : "Sign out all"}
                </button>
              </div>
            </div>

            {/* Danger zone — real, irreversible account deletion (GDPR erasure). */}
            <div className="mt-6 border border-red-200 rounded-2xl overflow-hidden max-w-lg">
              <div className="px-6 py-4 bg-red-50/60 border-b border-red-100">
                <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
              </div>
              <div className="p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Delete account</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Permanently removes your account and disconnects every integration. This can&apos;t be undone.</p>
                </div>
                <button onClick={() => { setShowDeleteModal(true); setConfirmText(""); setDeleteError(""); }} className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        );

      case "branding":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="branding">
            <h2 className="text-2xl font-medium mb-1 tracking-tight">White-label branding</h2>
            <p className="text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">Your logo, colour and footer appear on this workspace&apos;s dashboards and exported reports.</p>

            <div className="space-y-8 max-w-lg">
              {/* Logo */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Agency logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {brand.logo_url
                      ? <img src={brand.logo_url} alt="logo" className="max-w-full max-h-full object-contain" />
                      : <span className="text-xs text-gray-400">No logo</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-block px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-black transition-colors">
                      Upload
                      <input type="file" accept="image/*" onChange={onLogoPick} className="hidden" />
                    </label>
                    {brand.logo_url && (
                      <button onClick={() => setBrand((b) => ({ ...b, logo_url: null }))} className="block text-xs text-gray-500 hover:text-red-500">Remove logo</button>
                    )}
                    <p className="text-xs text-gray-400">PNG or SVG, under 500KB.</p>
                  </div>
                </div>
              </div>

              {/* Accent colour */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Accent colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={brand.accent_color} onChange={(e) => setBrand((b) => ({ ...b, accent_color: e.target.value }))} className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer bg-white" />
                  <input type="text" value={brand.accent_color} onChange={(e) => setBrand((b) => ({ ...b, accent_color: e.target.value }))} className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 font-mono" />
                </div>
              </div>

              {/* Report footer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Report footer</label>
                <input type="text" value={brand.report_footer} maxLength={300} onChange={(e) => setBrand((b) => ({ ...b, report_footer: e.target.value }))} placeholder="Prepared by Your Agency · hello@agency.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm" />
              </div>

              {brandMsg && (
                <div className={`text-sm px-4 py-3 rounded-xl ${brandMsg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{brandMsg.text}</div>
              )}

              <div className="pt-2">
                <button onClick={saveBranding} disabled={brandSaving} className="px-6 py-3 text-white text-sm font-medium rounded-full transition-all shadow-sm w-max disabled:opacity-50" style={{ background: brand.accent_color }}>
                  {brandSaving ? "Saving…" : "Save branding"}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="notifications">
            <h2 className="text-2xl font-medium mb-1 tracking-tight">Notifications</h2>
            <p className="text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">Where ArbFlow pings you when something changes in this workspace&apos;s numbers.</p>

            <div className="space-y-8 max-w-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Slack or Discord webhook</label>
                <input
                  type="url"
                  value={notif.slack_webhook_url}
                  onChange={(e) => setNotif((n) => ({ ...n, slack_webhook_url: e.target.value }))}
                  placeholder="https://hooks.slack.com/services/…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-mono"
                />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Anomaly alerts (and the weekly digest) are posted here as well as emailed.
                  Create one under Slack → Apps → Incoming Webhooks, or Discord → Channel settings → Integrations → Webhooks.
                </p>
              </div>

              <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Weekly digest</h4>
                  <p className="text-xs text-gray-500 mt-1">A Monday-morning style summary: last 7 days vs the week before.</p>
                </div>
                <button
                  onClick={() => setNotif((n) => ({ ...n, digest_enabled: !n.digest_enabled }))}
                  aria-label="Toggle weekly digest"
                  className={`w-12 h-6 rounded-full relative transition-colors ${notif.digest_enabled ? "bg-black" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notif.digest_enabled ? "right-1" : "left-1"}`} />
                </button>
              </div>

              {notifMsg && (
                <div className={`text-sm px-4 py-3 rounded-xl ${notifMsg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{notifMsg.text}</div>
              )}

              <button onClick={saveNotifications} disabled={notifSaving}
                className="px-6 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all shadow-sm w-max disabled:opacity-50">
                {notifSaving ? "Saving…" : "Save notifications"}
              </button>
            </div>
          </motion.div>
        );

      case "billing":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="billing">
            <h2 className="text-2xl font-medium mb-1 tracking-tight">Subscription & Billing</h2>
            <p className="text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">Manage your plan and payment methods.</p>

            <div className="p-8 bg-gradient-to-br from-gray-900 to-black rounded-3xl text-white mb-8 border border-gray-800 shadow-xl relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mb-2">Current Plan</p>
                  <h4 className="text-4xl font-light">Enterprise</h4>
                </div>
                <span className="px-3 py-1 bg-white/10 text-xs font-medium rounded-full backdrop-blur-sm border border-white/20">Active</span>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <p className="text-sm text-gray-400">Renews on Oct 24, 2026</p>
                <button className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg">Manage Plan</button>
              </div>
            </div>

            <h4 className="text-sm font-medium text-gray-900 mb-4 px-1">Payment Method</h4>
            <div className="flex items-center space-x-4 p-5 border border-gray-100 rounded-2xl max-w-md bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-9 bg-gray-50 border border-gray-200 rounded flex items-center justify-center font-bold text-blue-600 text-xs tracking-tighter">VISA</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-500">Expires 12/28</p>
              </div>
              <button className="text-xs font-medium text-gray-500 hover:text-black bg-gray-50 px-3 py-1.5 rounded-md">Edit</button>
            </div>
          </motion.div>
        );

      case "api":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="api">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-medium tracking-tight">API Keys</h2>
              <button className="px-4 py-2 bg-black text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm">Generate New Key</button>
            </div>
            <p className="text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">Integrate ArbFlow with your external tools programmatically.</p>

            <div className="space-y-4">
              <div className="p-5 border border-gray-100 rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">Production Key</p>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  </div>
                  <p className="text-xs font-mono text-gray-500">sk_live_••••••••••••9f2a</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-black transition-colors">Copy</button>
                  <button className="px-3 py-1.5 bg-red-50 text-xs font-medium text-red-600 rounded-md hover:bg-red-100 transition-colors">Revoke</button>
                </div>
              </div>

              <div className="p-5 border border-gray-100 rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">Testing Key</p>
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  </div>
                  <p className="text-xs font-mono text-gray-500">sk_test_••••••••••••4b8c</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-black transition-colors">Copy</button>
                  <button className="px-3 py-1.5 bg-red-50 text-xs font-medium text-red-600 rounded-md hover:bg-red-100 transition-colors">Revoke</button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start space-x-3">
              <span className="text-blue-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p className="text-sm text-blue-800 leading-relaxed">
                Never share your API keys in source code or public repositories. These keys provide full access to your workspace data.
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] p-6 md:p-10 font-sans text-gray-900 flex justify-center pt-24">
      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-4 md:gap-10">

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-64 flex-shrink-0">
          <h1 className="text-3xl font-semibold tracking-tight mb-8 px-2">Settings</h1>
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            {[
              { id: "profile", label: "Profile" },
              { id: "branding", label: "Branding" },
              { id: "notifications", label: "Notifications" },
              { id: "billing", label: "Billing" },
              { id: "api", label: "API Keys" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                    ? "bg-white text-black shadow-sm border border-gray-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-black"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Dynamic Content Area */}
        <div className="flex-grow max-w-3xl">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_4px_40px_rgb(0,0,0,0.04)] border border-gray-100 min-h-[600px]">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Delete-account confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
            onClick={() => !deleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-900">Delete your account?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This permanently deletes <strong className="text-gray-800">{profile?.email ?? "your account"}</strong> and disconnects all integrations. This action cannot be undone.
              </p>
              <label className="block text-xs font-medium text-gray-600 mt-6 mb-2">Type <span className="font-mono font-semibold">DELETE</span> to confirm</label>
              <input
                autoFocus value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
                placeholder="DELETE"
              />
              {deleteError && <p className="text-sm text-red-600 mt-3">{deleteError}</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting || confirmText !== "DELETE"} className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {deleting ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}