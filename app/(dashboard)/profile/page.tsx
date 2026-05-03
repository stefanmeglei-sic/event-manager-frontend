"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { MyRegistration } from "@/lib/types";
import { RegistrationQR } from "@/app/components/RegistrationQR";
import { useLocale } from "@/app/components/LocaleProvider";

type AuthUser = { id: string; email: string; role: string; token: string };
type RegistrationStatus = { id: string; nume: string };

export default function ProfilePage() {
  const { locale, t } = useLocale();
  const [user] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = localStorage.getItem("event_manager_auth");
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [statuses, setStatuses] = useState<RegistrationStatus[]>([]);
  const [regLoading, setRegLoading] = useState(Boolean(user));
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    Promise.all([
      apiFetch<MyRegistration[]>("/users/me/registrations", {
        token: user.token,
      }),
      apiFetch<RegistrationStatus[]>("/lookups/registration-statuses"),
    ])
      .then(([regs, stats]) => {
        if (!active) return;
        setRegistrations(regs);
        setStatuses(stats);
      })
      .catch(() => {
        if (!active) return;
      })
      .finally(() => {
        if (!active) return;
        setRegLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

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

  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";

  if (!user) return <p className="text-muted p-8">{t("common.not_signed_in")}</p>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-text">{t("profile.title")}</h1>

      {/* Profile card */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            {t("profile.email")}
          </p>
          <p className="text-text">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            {t("profile.role")}
          </p>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary capitalize">
            {user.role}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            {t("profile.user_id")}
          </p>
          <p className="font-mono text-xs text-muted">{user.id}</p>
        </div>
      </div>

      {/* My Registrations */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">
          {t("profile.registrations")}
        </h2>
        {regLoading && <p className="text-muted text-sm">{t("common.loading")}</p>}
        {!regLoading && registrations.length === 0 && (
          <p className="text-muted text-sm">{t("profile.no_registrations")}</p>
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
                      ? new Date(reg.event_start_date).toLocaleString(dateLocale)
                      : t("common.none")}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      statusId={reg.status_id}
                      statuses={statuses}
                    />
                    {reg.check_in_at && (
                      <span className="text-xs text-muted">
                        {t("profile.checked_in")} {" "}
                        {new Date(reg.check_in_at).toLocaleString(dateLocale)}
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
                    {cancellingId === reg.id ? t("profile.cancelling") : t("profile.cancel")}
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
