"use client";

import { useState, useTransition } from "react";
import type { Event, PaginatedEvents, EventCategory, EventStatus } from "../../../lib/types";
import { EventCard } from "../../../components/events/event-card";
import { CalendarView } from "../../../components/events/CalendarView";
import { listEvents } from "../../../lib/api/events";

type EventsClientProps = {
  initialData: PaginatedEvents;
  categories: EventCategory[];
  statuses: EventStatus[];
};

export function EventsClient({
  initialData,
  categories,
  statuses,
}: EventsClientProps): React.JSX.Element {
  const [events, setEvents] = useState<Event[]>(initialData.items);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialData.next_cursor,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);

  function getStatusLabel(statusId: string | null): string | undefined {
    if (!statusId) return undefined;
    return statuses.find((s) => s.id === statusId)?.nume;
  }

  async function applyFilter(
    categoryId: string | null,
    statusId: string | null,
    search?: string,
  ): Promise<void> {
    setLoadError(null);
    try {
      const data = await listEvents({
        limit: 20,
        categorie_id: categoryId ?? undefined,
        status_id: statusId ?? undefined,
        search: search ?? undefined,
      });
      setEvents(data.items);
      setNextCursor(data.next_cursor);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load events",
      );
    }
  }

  function handleCategoryFilter(id: string | null): void {
    const next = id === selectedCategory ? null : id;
    setSelectedCategory(next);
    startTransition(() => {
      applyFilter(next, selectedStatus).catch(() => undefined);
    });
  }

  function handleLoadMore(): void {
    if (!nextCursor) return;
    startTransition(() => {
      listEvents({
        limit: 20,
        cursor: nextCursor,
        categorie_id: selectedCategory ?? undefined,
        status_id: selectedStatus ?? undefined,
      })
        .then((data) => {
          setEvents((prev) => [...prev, ...data.items]);
          setNextCursor(data.next_cursor);
        })
        .catch((err: unknown) => {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load more events",
          );
        });
    });
  }

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("list")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${view === "list" ? "bg-primary text-on-primary border-primary" : "border-border text-text hover:bg-surface-muted"}`}
        >
          List
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${view === "calendar" ? "bg-primary text-on-primary border-primary" : "border-border text-text hover:bg-surface-muted"}`}
        >
          Calendar
        </button>
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            startTransition(() => {
              applyFilter(selectedCategory, selectedStatus, e.currentTarget.value).catch(() => undefined);
            });
          }
        }}
        placeholder="Search events…"
        className="w-full max-w-sm rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border"
      />

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-muted text-text hover:bg-surface-raised"
              }`}
            >
              {cat.nume}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => handleCategoryFilter(null)}
              className="rounded-full bg-danger-bg px-4 py-1.5 text-sm font-medium text-danger hover:opacity-80"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Status filters */}
      {statuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                const next = st.id === selectedStatus ? null : st.id;
                setSelectedStatus(next);
                startTransition(() => {
                  applyFilter(selectedCategory, next).catch(() => undefined);
                });
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedStatus === st.id
                  ? "bg-surface-raised text-text ring-1 ring-border-focus"
                  : "bg-surface-muted text-muted hover:bg-surface-raised"
              }`}
            >
              {st.nume}
            </button>
          ))}
          {selectedStatus && (
            <button
              onClick={() => {
                setSelectedStatus(null);
                startTransition(() => {
                  applyFilter(selectedCategory, null).catch(() => undefined);
                });
              }}
              className="rounded-full bg-danger-bg px-3 py-1 text-xs font-medium text-danger hover:opacity-80"
            >
              Clear status
            </button>
          )}
        </div>
      )}

      {loadError && (
        <p className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {loadError}
        </p>
      )}

      {/* Events grid */}
      {view === "calendar" ? (
        <CalendarView events={events} />
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted">No events found.</p>
          {(selectedCategory ?? selectedStatus) && (
            <p className="mt-1 text-sm text-subtle">
              Try clearing the filters.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              statusLabel={getStatusLabel(event.status_id)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text shadow-sm transition hover:bg-surface-raised disabled:opacity-50"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
