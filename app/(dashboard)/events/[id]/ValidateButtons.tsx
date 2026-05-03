"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/app/components/LocaleProvider";

type Props = { eventId: string };

export default function ValidateButtons({ eventId }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function validate(approved: boolean) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/events/${eventId}/validate`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
        token,
      });
      setSuccess(approved ? t("validate.approved") : t("validate.rejected"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("validate.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-border pt-4 space-y-2">
      <p className="text-xs text-muted uppercase tracking-wider">{t("validate.admin_actions")}</p>
      {success && <p className="text-sm text-success">{success}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => validate(true)}
          disabled={loading}
          className="rounded-full bg-success-bg px-4 py-1.5 text-sm text-success hover:opacity-80 disabled:opacity-50 transition"
        >
          {t("validate.approve_publish")}
        </button>
        <button
          onClick={() => validate(false)}
          disabled={loading}
          className="rounded-full bg-danger-bg px-4 py-1.5 text-sm text-danger hover:opacity-80 disabled:opacity-50 transition"
        >
          {t("validate.reject")}
        </button>
      </div>
    </div>
  );
}
