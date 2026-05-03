"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/app/components/LocaleProvider";
import { getEventPath } from "@/lib/events/slug";
import type { Event, EventCategory } from "@/lib/types";

type PaginatedEvents = { items: Event[]; next_cursor: string | null };

export default function AdminEventsPage(): React.JSX.Element {
  const { t } = useLocale();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, "approving" | "rejecting" | null>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([
      apiFetch<PaginatedEvents>("/events?limit=200", { token: token ?? undefined }),
      apiFetch<EventCategory[]>("/lookups/event-categories", { token: token ?? undefined }),
      apiFetch<Array<{ id: string; nume: string }>>("/lookups/event-statuses", { token: token ?? undefined }),
    ])
      .then(([eventsData, cats, statuses]) => {
        setCategories(cats);
        const draftId = statuses.find((s) => s.nume === "draft")?.id;
        setEvents(draftId ? eventsData.items.filter((e) => e.status_id === draftId) : eventsData.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("admin_events.failed_to_load")))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleValidate(eventId: string, approved: boolean): Promise<void> {
    const token = localStorage.getItem("token");
    setActionStates((prev) => ({ ...prev, [eventId]: approved ? "approving" : "rejecting" }));
    try {
      await apiFetch(`/events/${eventId}/validate`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
        token: token ?? undefined,
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin_events.failed_to_load"));
    } finally {
      setActionStates((prev) => ({ ...prev, [eventId]: null }));
    }
  }

  if (loading) return <main className="p-8"><p className="text-muted">{t("admin_events.loading")}</p></main>;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text">{t("admin_events.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("admin_events.subtitle")}</p>
      </header>

      {error && (
        <p className="mb-6 rounded-xl border border-danger/30 bg-danger-bg p-4 text-sm text-danger">{error}</p>
      )}

      {events.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          {t("admin_events.no_events")}
        </div>
      )}

      <div className="space-y-4">
        {events.map((event) => {
          const cat = categories.find((c) => c.id === event.categorie_id);
          const state = actionStates[event.id];
          return (
            <div key={event.id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={getEventPath(event)}
                    className="text-base font-semibold text-text hover:underline"
                  >
                    {event.titlu}
                  </Link>
                  {cat && (
                    <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {cat.nume}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted uppercase tracking-wider">{t("admin_events.organizer")}: </span>
                  <span className="text-text">{event.organizer_name ?? event.organizer_id}</span>
                </div>
                <div>
                  <span className="text-xs text-muted uppercase tracking-wider">{t("admin_events.dates")}: </span>
                  <span className="text-text">
                    {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {event.descriere && (
                <p className="text-sm text-muted line-clamp-2">{event.descriere}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleValidate(event.id, true)}
                  disabled={state !== null && state !== undefined}
                  className="rounded-full bg-success-bg px-4 py-1.5 text-sm font-medium text-success hover:opacity-80 disabled:opacity-50 transition"
                >
                  {state === "approving" ? t("admin_events.approving") : t("admin_events.approve")}
                </button>
                <button
                  onClick={() => handleValidate(event.id, false)}
                  disabled={state !== null && state !== undefined}
                  className="rounded-full bg-danger-bg px-4 py-1.5 text-sm font-medium text-danger hover:opacity-80 disabled:opacity-50 transition"
                >
                  {state === "rejecting" ? t("admin_events.rejecting") : t("admin_events.reject")}
                </button>
                <Link
                  href={getEventPath(event)}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-text hover:bg-surface-muted transition"
                >
                  View
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
