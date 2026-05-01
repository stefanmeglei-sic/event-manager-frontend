"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type Props = { eventId: string };

export default function EnrollButton({ eventId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  if (!token) return null;

  async function handleEnroll() {
    setStatus("loading");
    setMessage(null);
    try {
      await apiFetch(`/events/${eventId}/registrations`, {
        method: "POST",
        token: token ?? undefined,
      });
      setStatus("success");
      setMessage("You are enrolled!");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to enroll.");
    }
  }

  return (
    <div className="mt-8 space-y-2">
      {status !== "success" && (
        <button
          onClick={handleEnroll}
          disabled={status === "loading"}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Enrolling…" : "Enroll"}
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
    </div>
  );
}
