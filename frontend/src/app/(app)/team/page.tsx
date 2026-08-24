"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, UserPlus, Users } from "lucide-react";
import { PageHeader } from "../../../components/shell/PageHeader";
import {
  Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, Field, Input, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Skeleton,
} from "../../../components/ui";
import { DataTable } from "../../../components/workspace/DataTable";
import { EmptyState } from "../../../components/workspace/primitives";
import { apiFetch, getApiUrl } from "../../../lib/auth";
import { withWorkspace } from "../../../lib/workspace";

type Member = {
  member_id: number; name: string; email: string;
  role: string; status: string; avatar: string; removable: boolean;
};
type Invite = { email: string; role: string; status: string };

/** One row shape for both, so members and pending invites share a table. */
type Row =
  | { kind: "member"; key: string; member: Member }
  | { kind: "invite"; key: string; invite: Invite };

const ROLES = [
  { id: "admin", label: "Admin", hint: "Can manage the team and settings" },
  { id: "member", label: "Member", hint: "Can view every dashboard and report" },
  { id: "viewer", label: "Viewer", hint: "Read-only access" },
];

export default function TeamPage() {
  const [team, setTeam] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/team`));
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
        setInvites(data.invites || []);
        setCanManage(!!data.can_manage);
      }
    } catch {
      toast.error("Couldn't load the team", { description: "Check your connection and refresh." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch(withWorkspace(`${getApiUrl()}/api/v1/workspace/team/invite`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't send the invite.");
      toast.success(data.detail || `Invite sent to ${email}`);
      setEmail("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the invite.");
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    const member = pendingRemoval;
    if (!member) return;
    setPendingRemoval(null);
    try {
      const res = await apiFetch(
        withWorkspace(`${getApiUrl()}/api/v1/workspace/team/member/${member.member_id}`),
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success(`${member.name} no longer has access`);
    } catch {
      toast.error(`Couldn't remove ${member.name}`);
    }
    load();
  };

  const revokeInvite = async (inviteEmail: string) => {
    try {
      const res = await apiFetch(
        withWorkspace(`${getApiUrl()}/api/v1/workspace/team/invite?email=${encodeURIComponent(inviteEmail)}`),
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success(`Invitation to ${inviteEmail} revoked`);
    } catch {
      toast.error("Couldn't revoke that invitation");
    }
    load();
  };

  const rows: Row[] = [
    ...team.map((m) => ({ kind: "member" as const, key: `m-${m.member_id}`, member: m })),
    ...invites.map((i) => ({ kind: "invite" as const, key: `i-${i.email}`, invite: i })),
  ];

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <PageHeader
        title="Team"
        description={
          canManage
            ? "Invite people to this workspace and manage their access."
            : "People with access to this workspace."
        }
        badge={!loading ? <Badge tone="neutral">{team.length + invites.length} people</Badge> : undefined}
      />

      {canManage && (
        <Card padding="md" className="mb-5">
          <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Email" htmlFor="invite-email" className="flex-1">
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </Field>
            <Field label="Role" htmlFor="invite-role" className="sm:w-44">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="invite-role" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="block">{r.label}</span>
                      <span className="block text-xs text-[var(--ink-3)]">{r.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button type="submit" loading={busy} className="sm:mb-0">
              {!busy && <UserPlus />}Send invite
            </Button>
          </form>
        </Card>
      )}

      <Card padding="lg" className="rounded-[var(--radius-xl)]">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1"><Skeleton className="h-3 w-40" /><Skeleton className="mt-2 h-3 w-56" /></div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title="Just you so far"
            description="Invite a teammate and they get their own login to this workspace — the same dashboards, no shared password."
          />
        ) : (
          <DataTable
            rows={rows}
            getKey={(r) => r.key}
            columns={[
              {
                key: "person",
                header: "Member",
                sortBy: (r) => (r.kind === "member" ? r.member.name : r.invite.email),
                cell: (r) =>
                  r.kind === "member" ? (
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--indigo),var(--violet))] text-xs font-semibold text-white">
                        {r.member.avatar}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[var(--ink)]">{r.member.name}</span>
                        <span className="block truncate text-xs text-[var(--ink-3)]">{r.member.email}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Mail className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[var(--ink)]">{r.invite.email}</span>
                        <span className="block text-xs text-[var(--ink-3)]">Invitation sent</span>
                      </span>
                    </div>
                  ),
              },
              {
                key: "role",
                header: "Role",
                sortBy: (r) => (r.kind === "member" ? r.member.role : r.invite.role),
                cell: (r) => (
                  <span className="capitalize">{r.kind === "member" ? r.member.role : r.invite.role}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (r) =>
                  r.kind === "member" ? (
                    <Badge tone="success" size="sm" dot>{r.member.status}</Badge>
                  ) : (
                    <Badge tone="warning" size="sm">Pending</Badge>
                  ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (r) =>
                  r.kind === "member" ? (
                    r.member.removable ? (
                      <Button variant="ghost" size="sm" onClick={() => setPendingRemoval(r.member)}>
                        Remove
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--ink-3)]">—</span>
                    )
                  ) : canManage ? (
                    <Button variant="ghost" size="sm" onClick={() => revokeInvite(r.invite.email)}>
                      Revoke
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
      </Card>

      {/* Removing someone's access is not undoable from this screen and the old
          page did it on a single click, with no confirmation and no feedback. */}
      <Dialog open={!!pendingRemoval} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {pendingRemoval?.name}?</DialogTitle>
            <DialogDescription>
              They lose access to this workspace immediately. You can invite them again at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingRemoval(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmRemove}>Remove access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
