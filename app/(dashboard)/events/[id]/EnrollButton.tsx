"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/app/components/LocaleProvider";

type Props = {
  eventId: string;
  organizerId: string;
  participationTypeId: string | null;
};

type ParticipationType = { id: string; nume: string };

export default function EnrollButton({ eventId, organizerId, participationTypeId }: Props) {
  const { t } = useLocale();
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("token");
  });
  const [canEnroll, setCanEnroll] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      const storedAuth = localStorage.getItem("event_manager_auth");
      if (!storedAuth) return true;
      const user = JSON.parse(storedAuth) as { id?: string; role?: string };
      return !(user.role === "organizer" && user.id === organizerId);
    } catch {
      return true;
    }
  });
  const [resolvedParticipationTypeId, setResolvedParticipationTypeId] = useState<string | null>(
    participationTypeId,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const storedAuth = localStorage.getItem("event_manager_auth");
      if (!storedAuth) return null;
      const user = JSON.parse(storedAuth) as { id?: string; role?: string };
      if (user.role === "organizer" && user.id === organizerId) {
        return t("enroll.cannot_own_event");
      }
    } catch {
      // Ignore malformed local storage data.
    }
    return null;
  });

  useEffect(() => {
    if (!participationTypeId) {
      apiFetch<ParticipationType[]>("/lookups/participation-types")
        .then((types) => {
          const firstTypeId = types[0]?.id ?? null;
          setResolvedParticipationTypeId(firstTypeId);
          if (!firstTypeId) {
            setCanEnroll(false);
            setMessage(t("enroll.no_participation_types"));
          }
        })
        .catch(() => {
          setCanEnroll(false);
          setMessage(t("enroll.failed_to_load_participation_types"));
        });
    }
  }, [participationTypeId, t]);

  if (!token) return null;

  async function handleEnroll() {
    if (!resolvedParticipationTypeId) {
      setStatus("error");
      setMessage(t("enroll.no_participation_type_for_event"));
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      await apiFetch(`/events/${eventId}/registrations`, {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ tip_participare_id: resolvedParticipationTypeId }),
      });
      setStatus("success");
      setMessage(t("enroll.enrolled"));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("enroll.failed"));
    }
  }

  return (
    <div className="mt-8 space-y-2">
      {canEnroll && status !== "success" && (
        <button
          onClick={handleEnroll}
          disabled={status === "loading"}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? t("enroll.enrolling") : t("enroll.enroll")}
        </button>
      )}
      {message && status === "success" && (
        <p className="rounded-xl border border-success/30 bg-success-bg px-4 py-2 text-sm text-success">
          {message}
        </p>
      )}
      {message && status === "error" && (
        <p className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-2 text-sm text-danger">
          {message}
        </p>
      )}
      {!canEnroll && message && (
        <p className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
