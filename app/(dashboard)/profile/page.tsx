"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { MyRegistration } from "@/lib/types";
import { RegistrationQR } from "@/app/components/RegistrationQR";

type AuthUser = { id: string; email: string; role: string; token: string };
type RegistrationStatus = { id: string; nume: string };

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [statuses, setStatuses] = useState<RegistrationStatus[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("event_manager_auth");
      if (stored) {
        const u = JSON.parse(stored) as AuthUser;
        setUser(u);
        setRegLoading(true);

        Promise.all([
          apiFetch<MyRegistration[]>("/users/me/registrations", {
            token: u.token,
          }),
          apiFetch<RegistrationStatus[]>("/lookups/registration-statuses"),
        ])
          .then(([regs, stats]) => {
            setRegistrations(regs);
            setStatuses(stats);
          })
          .catch(() => {})
          .finally(() => setRegLoading(false));
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function cancelRegistration(reg: MyRegistration) {
    if (!user) return;
    setCancellingId(reg.id);
    try {
      await apiFetch(
        `/events/${reg.eveniment_id}/registrations/${reg.id}/cancel`,
        {
          method: "PATCH",
          token: user.token,
        }
      );
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === reg.id ? { ...r, status_id: "cancelled" } : r
        )
      );
    } catch {
      /* ignore */
    } finally {
      setCancellingId(null);
    }
  }

  if (!user) return <p className="text-muted p-8">Not signed in.</p>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-text">Your Profile</h1>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Email
          </p>
          <p className="text-text">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Role
          </p>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary capitalize">
            {user.role}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            User ID
          </p>
          <p className="font-mono text-xs text-muted">{user.id}</p>
        </div>
      </div>

      {/* My Registrations */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">
          My Registrations
        </h2>
        {regLoading && <p className="text-muted text-sm">Loading…</p>}
        {!regLoading && registrations.length === 0 && (
          <p className="text-muted text-sm">You have no registrations yet.</p>
        )}
        <div className="space-y-3">
          {registrations.map((reg) => {
            const statusName =
              statuses.find((s) => s.id === reg.status_id)?.nume ?? "";
            const isCancelled = statusName === "cancelled";
            return (
              <div
                key={reg.id}
                className="rounded-xl border border-border bg-surface p-4 flex items-start gap-4"
              >
                {/* QR Ticket */}
                {reg.qr_token && !isCancelled && (
                  <div className="shrink-0">
                    <RegistrationQR
                      eventId={reg.eveniment_id}
                      registrationId={reg.id}
                      token={user.token}
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">
                    {reg.event_title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {reg.event_start_date
                      ? new Date(reg.event_start_date).toLocaleString("ro-RO")
                      : "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      statusId={reg.status_id}
                      statuses={statuses}
                    />
                    {reg.check_in_at && (
                      <span className="text-xs text-muted">
                        Checked in:{" "}
                        {new Date(reg.check_in_at).toLocaleString("ro-RO")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cancel button */}
                {!isCancelled && (
                  <button
                    onClick={() => cancelRegistration(reg)}
                    disabled={cancellingId === reg.id}
                    className="shrink-0 text-xs text-danger hover:underline disabled:opacity-50"
                  >
                    {cancellingId === reg.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({
  statusId,
  statuses,
}: {
  statusId: string;
  statuses: RegistrationStatus[];
}) {
  const name =
    statuses.find((s) => s.id === statusId)?.nume ?? statusId.slice(0, 8);
  const colorMap: Record<string, string> = {
    pending: "text-warning border-warning",
    confirmed: "text-success border-success",
    checked_in: "text-primary border-primary",
    cancelled: "text-danger border-danger",
  };
  const color = colorMap[name] ?? "text-muted border-border";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs capitalize ${color}`}
    >
      {name}
    </span>
  );
}
