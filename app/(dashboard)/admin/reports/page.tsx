"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type Summary = {
  total_events: number;
  total_registrations: number;
  avg_participants_per_event: number;
  top_organizers: Array<{ organizer_id: string; event_count: number }>;
};

type MonthCount = { month: string; count: number };

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byMonth, setByMonth] = useState<MonthCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    Promise.all([
      apiFetch<Summary>("/reports/summary", { token }),
      apiFetch<MonthCount[]>("/reports/events-by-month", { token }),
    ])
      .then(([s, m]) => {
        setSummary(s);
        setByMonth(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted p-8">Loading reports…</p>;
  if (error) return <p className="text-danger p-8">{error}</p>;

  const maxCount = Math.max(...byMonth.map((m) => m.count), 1);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-text">Reports</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Events" value={summary?.total_events ?? 0} />
        <StatCard label="Total Registrations" value={summary?.total_registrations ?? 0} />
        <StatCard label="Avg Participants/Event" value={summary?.avg_participants_per_event ?? 0} />
      </div>

      {/* Events by month bar chart (CSS bars) */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-text mb-4">Events by Month</h2>
        <div className="space-y-2">
          {byMonth.map((m) => (
            <div key={m.month} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted shrink-0">{m.month}</span>
              <div className="flex-1 bg-surface-raised rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(m.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-xs text-muted text-right">{m.count}</span>
            </div>
          ))}
          {byMonth.length === 0 && <p className="text-muted text-sm">No data yet.</p>}
        </div>
      </div>

      {/* Top organizers */}
      {summary && summary.top_organizers.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-text mb-4">Top Organizers</h2>
          <div className="space-y-2">
            {summary.top_organizers.map((o, i) => (
              <div key={o.organizer_id} className="flex items-center justify-between text-sm">
                <span className="text-muted font-mono text-xs truncate max-w-[70%]">
                  {i + 1}. {o.organizer_id}
                </span>
                <span className="text-text font-medium">{o.event_count} events</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 text-center">
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
