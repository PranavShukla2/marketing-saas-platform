"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Download, LogOut, Palette, Trash2, User } from "lucide-react";
import { PageHeader } from "../../../components/shell/PageHeader";
import {
  Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, Field, Input, Switch,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "../../../components/ui";
import { apiFetch, getApiUrl, logout } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";

type Profile = { email: string; company_name: string };
type Brand = { logo_url: string | null; accent_color: string; report_footer: string };
type Notif = { slack_webhook_url: string; digest_enabled: boolean };

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("profile");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [brand, setBrand] = useState<Brand>({ logo_url: null, accent_color: "#5b5bd6", report_footer: "" });
  const [notif, setNotif] = useState<Notif>({ slack_webhook_url: "", digest_enabled: true });

  const [brandSaving, setBrandSaving] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = getApiUrl();
      const [me, b, n] = await Promise.allSettled([
        apiFetch(`${base}/api/v1/auth/me`),
        apiFetch(withWorkspace(`${base}/api/v1/workspace/branding`)),
        apiFetch(withWorkspace(`${base}/api/v1/workspace/notifications`)),
      ]);
      if (cancelled) return;
      if (me.status === "fulfilled" && me.value.ok) setProfile(await me.value.json());
      if (b.status === "fulfilled" && b.value.ok) {
        const v = await b.value.json();
        setBrand({ logo_url: v.logo_url, accent_color: v.accent_color || "#5b5bd6", report_footer: v.report_footer || "" });
      }
      if (n.status === "fulfilled" && n.value.ok) {
        const v = await n.value.json();
        setNotif({ slack_webhook_url: v.slack_webhook_url || "", digest_enabled: !!v.digest_enabled });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // The backend stores the logo as a base64 data URL in Postgres and caps it.
    if (file.size > 500 * 1024) { toast.error("That image is too large", { description: "Please choose one under 500KB." }); return; }
    const reader = new FileReader();
    reader.onloadend = () => setBrand((s) => ({ ...s, logo_url: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    setBrandSaving(true);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/branding`), {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(brand),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't save branding.");
      toast.success("Branding saved", { description: "It'll show on your dashboards and exported reports." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save branding.");
    } finally {
      setBrandSaving(false);
    }
  };

  const saveNotifications = async () => {
    setNotifSaving(true);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/notifications`), {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notif),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't save notification settings.");
      toast.success("Notification settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save notification settings.");
    } finally {
      setNotifSaving(false);
    }
  };

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
      toast.success("Export downloaded");
    } catch {
      toast.error("Couldn't build your export", { description: "Please try again in a moment." });
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
      /* cookies are cleared on the redirect either way */
    }
    try { localStorage.removeItem("token"); } catch {}
    window.location.href = "/login";
  };

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await apiFetch(`${getApiUrl()}/api/v1/auth/me`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      await logout();
      router.push("/?deleted=1");
    } catch {
      setDeleteError("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeader title="Settings" description="Your account, your branding and how we reach you." />

      <Tabs group="settings" value={tab} onValueChange={setTab}>
        <TabsList variant="underline" className="mb-6 overflow-x-auto">
          <TabsTrigger variant="underline" value="profile"><User className="mr-1.5 inline size-3.5" />Profile</TabsTrigger>
          <TabsTrigger variant="underline" value="branding"><Palette className="mr-1.5 inline size-3.5" />Branding</TabsTrigger>
          <TabsTrigger variant="underline" value="notifications"><Bell className="mr-1.5 inline size-3.5" />Notifications</TabsTrigger>
        </TabsList>

        {/* ---------------- Profile ---------------- */}
        <TabsContent value="profile" className="space-y-5">
          <Card padding="lg" className="rounded-[var(--radius-xl)]">
            <h2 className="text-base font-semibold text-[var(--ink)]">Account</h2>
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">
              These come from your sign-up and can&apos;t be edited yet.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Company / agency" htmlFor="company">
                <Input id="company" readOnly value={profile?.company_name ?? "—"} className="cursor-not-allowed bg-[var(--page)]" />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" readOnly value={profile?.email ?? "—"} className="cursor-not-allowed bg-[var(--page)]" />
              </Field>
            </div>
          </Card>

          <Card padding="lg" className="rounded-[var(--radius-xl)]">
            <h2 className="text-base font-semibold text-[var(--ink)]">Your data</h2>
            <div className="mt-4 space-y-4">
              <Row
                title="Export everything"
                description="A JSON file with your account, integrations, branding and activity log."
                action={
                  <Button variant="outline" onClick={handleExportData} loading={exporting}>
                    {!exporting && <Download />}Export
                  </Button>
                }
              />
              <Row
                title="Sign out everywhere"
                description="Ends every session on every device, including this one."
                action={
                  <Button variant="outline" onClick={handleLogoutAll} loading={signingOutAll}>
                    {!signingOutAll && <LogOut />}Sign out all
                  </Button>
                }
              />
            </div>
          </Card>

          <Card padding="lg" className="rounded-[var(--radius-xl)] border-red-500/25">
            <h2 className="text-base font-semibold text-[var(--ink)]">Danger zone</h2>
            <div className="mt-4">
              <Row
                title="Delete this account"
                description="Permanently removes your account and disconnects every integration. This cannot be undone."
                action={
                  <Button variant="danger" onClick={() => { setShowDelete(true); setConfirmText(""); setDeleteError(""); }}>
                    <Trash2 />Delete
                  </Button>
                }
              />
            </div>
          </Card>
        </TabsContent>

        {/* ---------------- Branding ---------------- */}
        <TabsContent value="branding">
          <Card padding="lg" className="rounded-[var(--radius-xl)]">
            <h2 className="text-base font-semibold text-[var(--ink)]">White-label branding</h2>
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">
              Applied to client dashboards and every report you send.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--ink-2)]">Logo</p>
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--page)]">
                    {brand.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a base64 data URL, not an optimisable asset
                      <img src={brand.logo_url} alt="Your logo" className="size-full object-contain p-1.5" />
                    ) : (
                      <span className="text-xs text-[var(--ink-3)]">None</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--page)]">
                      <input type="file" accept="image/*" onChange={onLogoPick} className="hidden" />
                      Choose an image
                    </label>
                    <p className="text-xs text-[var(--ink-3)]">PNG or SVG, under 500KB.</p>
                    {brand.logo_url && (
                      <Button variant="link" className="text-xs" onClick={() => setBrand((b) => ({ ...b, logo_url: null }))}>
                        Remove logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Field label="Accent colour" htmlFor="accent" hint="Used on report headings and the export button.">
                <div className="flex items-center gap-3">
                  <input
                    id="accent"
                    type="color"
                    value={brand.accent_color}
                    onChange={(e) => setBrand((b) => ({ ...b, accent_color: e.target.value }))}
                    className="size-10 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)]"
                  />
                  <Input
                    value={brand.accent_color}
                    onChange={(e) => setBrand((b) => ({ ...b, accent_color: e.target.value }))}
                    className="w-32 font-mono"
                    aria-label="Accent colour hex value"
                  />
                </div>
              </Field>

              <Field label="Report footer" htmlFor="footer" hint="Replaces the ArbFlow line at the bottom of exports.">
                <Input
                  id="footer"
                  maxLength={300}
                  value={brand.report_footer}
                  onChange={(e) => setBrand((b) => ({ ...b, report_footer: e.target.value }))}
                  placeholder="Prepared by Your Agency · hello@agency.com"
                />
              </Field>

              <Button onClick={saveBranding} loading={brandSaving}>Save branding</Button>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------- Notifications ---------------- */}
        <TabsContent value="notifications">
          <Card padding="lg" className="rounded-[var(--radius-xl)]">
            <h2 className="text-base font-semibold text-[var(--ink)]">Alerts &amp; digests</h2>
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">
              Where we tell you something changed.
            </p>

            <div className="mt-6 space-y-6">
              <Field
                label="Slack or Discord webhook"
                htmlFor="webhook"
                hint="Only Slack and Discord URLs are accepted — other hosts are rejected server-side."
              >
                <Input
                  id="webhook"
                  value={notif.slack_webhook_url}
                  onChange={(e) => setNotif((n) => ({ ...n, slack_webhook_url: e.target.value }))}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </Field>

              <label className="flex cursor-pointer select-none items-start gap-3">
                <Switch
                  checked={notif.digest_enabled}
                  onCheckedChange={(v) => setNotif((n) => ({ ...n, digest_enabled: v }))}
                  aria-label="Weekly digest"
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--ink)]">Weekly digest</span>
                  <span className="block text-sm text-[var(--ink-2)]">
                    A summary of what moved, once a week. Needs about a fortnight of history before the first one.
                  </span>
                </span>
              </label>

              <Button onClick={saveNotifications} loading={notifSaving}>Save notifications</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete-account confirmation. */}
      <Dialog open={showDelete} onOpenChange={(open) => { if (!deleting) setShowDelete(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes{" "}
              <strong className="text-[var(--ink)]">{profile?.email ?? "your account"}</strong>{" "}
              and disconnects all integrations. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Field
            label="Type DELETE to confirm"
            htmlFor="confirm-delete"
            error={deleteError || undefined}
          >
            <Input
              id="confirm-delete"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting} disabled={confirmText !== "DELETE"}>
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A titled row with an action on the right — the shape most settings take. */
function Row({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--line)] p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
        <p className="mt-0.5 text-sm text-[var(--ink-2)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
