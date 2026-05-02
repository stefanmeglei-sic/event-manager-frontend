"use client";

import { useState, useEffect } from "react";

type Participant = {
  id: string;
  user_id: string;
  status: string;
  tip_participare_id: string | null;
  check_in_at: string | null;
  created_at: string;
};

type Props = { eventId: string };

function toCsv(rows: Participant[]): string {
  const headers = ["id", "user_id", "status", "tip_participare_id", "check_in_at", "created_at"];
  const escape = (val: string | null) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.id, r.user_id, r.status, r.tip_participare_id, r.check_in_at, r.created_at]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export default function ExportCsvButton({ eventId }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const parsed = JSON.parse(userRaw) as { role?: string };
        setRole(parsed.role ?? null);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  if (role !== "admin" && role !== "organizer") return null;

  async function handleExport() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Participant[];
      const csv = toCsv(data);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `participants-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-muted disabled:opacity-50 transition"
    >
      {loading ? "Exporting…" : "⬇ Export CSV"}
    </button>
  );
}
