"use client";

import { useState, useTransition } from "react";
import type { Event, PaginatedEvents, EventCategory, EventStatus, Location } from "../../../lib/types";
import { EventCard } from "../../../components/events/event-card";
import { CalendarView } from "../../../components/events/CalendarView";
import { listEvents } from "../../../lib/api/events";

type EventsClientProps = {
  initialData: PaginatedEvents;
  categories: EventCategory[];
  statuses: EventStatus[];
  locations: Location[];
  participationTypes: EventStatus[];
};

export function EventsClient({
  initialData,
  categories,
  statuses,
  locations,
  participationTypes,
}: EventsClientProps): React.JSX.Element {
  const [events, setEvents] = useState<Event[]>(initialData.items);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialData.next_cursor,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedParticipationType, setSelectedParticipationType] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [requiresRegistration, setRequiresRegistration] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);

  function getStatusLabel(statusId: string | null): string | undefined {
    if (!statusId) return undefined;
    return statuses.find((s) => s.id === statusId)?.nume;
  }

  function buildFilters(overrides: Partial<{
    categoryId: string | null;
    statusId: string | null;
    locationId: string;
    participationTypeId: string | null;
    from: string;
    to: string;
    registration: boolean;
    search: string;
  }> = {}) {
    const categoryId = overrides.categoryId !== undefined ? overrides.categoryId : selectedCategory;
    const statusId = overrides.statusId !== undefined ? overrides.statusId : selectedStatus;
    const locationId = overrides.locationId !== undefined ? overrides.locationId : selectedLocation;
    const participationTypeId = overrides.participationTypeId !== undefined ? overrides.participationTypeId : selectedParticipationType;
    const from = overrides.from !== undefined ? overrides.from : dateFrom;
    const to = overrides.to !== undefined ? overrides.to : dateTo;
    const registration = overrides.registration !== undefined ? overrides.registration : requiresRegistration;
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    return {
      limit: 20,
      categorie_id: categoryId ?? undefined,
      status_id: statusId ?? undefined,
      location_id: locationId || undefined,
      tip_participare_id: participationTypeId ?? undefined,
      date_from: from || undefined,
      date_to: to || undefined,
      requires_registration: registration || undefined,
      search: search || undefined,
    };
  }

  async function applyFilter(overrides: Parameters<typeof buildFilters>[0] = {}): Promise<void> {
    setLoadError(null);
    try {
      const data = await listEvents(buildFilters(overrides));
      setEvents(data.items);
      setNextCursor(data.next_cursor);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load events");
    }
  }

  function handleLoadMore(): void {
    if (!nextCursor) return;
    startTransition(() => {
      listEvents({ ...buildFilters(), cursor: nextCursor })
        .then((data) => {
          setEvents((prev) => [...prev, ...data.items]);
          setNextCursor(data.next_cursor);
        })
        .catch((err: unknown) => {
          setLoadError(err instanceof Error ? err.message : "Failed to load more events");
        });
    });
  }

  function clearAllFilters(): void {
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedLocation("");
    setSelectedParticipationType(null);
    setDateFrom("");
    setDateTo("");
    setRequiresRegistration(false);
    setSearchQuery("");
    startTransition(() => {
      listEvents({ limit: 20 })
        .then((data) => { setEvents(data.items); setNextCursor(data.next_cursor); })
        .catch(() => undefined);
    });
  }

  const hasActiveFilters =
    selectedCategory || selectedStatus || selectedLocation ||
    selectedParticipationType || dateFrom || dateTo || requiresRegistration || searchQuery;

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
              applyFilter({ search: e.currentTarget.value }).catch(() => undefined);
            });
          }
        }}
        placeholder="Search events…"
        className="w-full max-w-sm rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border"
      />

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted">Date:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              startTransition(() => {
                applyFilter({ from: e.target.value }).catch(() => undefined);
              });
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border"
          />
          <span className="text-xs text-muted">–</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => {
              setDateTo(e.target.value);
              startTransition(() => {
                applyFilter({ to: e.target.value }).catch(() => undefined);
              });
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border"
          />
        </div>
      </div>

      {/* Location dropdown */}
      {locations.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted">Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              startTransition(() => {
                applyFilter({ locationId: e.target.value }).catch(() => undefined);
              });
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.nume_sala}{loc.corp_cladire ? ` (${loc.corp_cladire})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Participation type chips */}
      {participationTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-muted">Mode:</span>
          {participationTypes.map((pt) => (
            <button
              key={pt.id}
              onClick={() => {
                const next = pt.id === selectedParticipationType ? null : pt.id;
                setSelectedParticipationType(next);
                startTransition(() => {
                  applyFilter({ participationTypeId: next }).catch(() => undefined);
                });
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedParticipationType === pt.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-muted text-text hover:bg-surface-raised"
              }`}
            >
              {pt.nume}
            </button>
          ))}
        </div>
      )}

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-muted">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const next = cat.id === selectedCategory ? null : cat.id;
                setSelectedCategory(next);
                startTransition(() => {
                  applyFilter({ categoryId: next }).catch(() => undefined);
                });
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-muted text-text hover:bg-surface-raised"
              }`}
            >
              {cat.nume}
            </button>
          ))}
        </div>
      )}

      {/* Status filters */}
      {statuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-muted">Status:</span>
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                const next = st.id === selectedStatus ? null : st.id;
                setSelectedStatus(next);
                startTransition(() => {
                  applyFilter({ statusId: next }).catch(() => undefined);
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
        </div>
      )}

      {/* Extra toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            const next = !requiresRegistration;
            setRequiresRegistration(next);
            startTransition(() => {
              applyFilter({ registration: next }).catch(() => undefined);
            });
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
            requiresRegistration
              ? "bg-primary text-on-primary border-primary"
              : "border-border text-muted hover:bg-surface-muted"
          }`}
        >
          Requires registration
        </button>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="rounded-full bg-danger-bg px-4 py-1.5 text-sm font-medium text-danger hover:opacity-80"
        >
          Clear all filters
        </button>
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
          {hasActiveFilters && (
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


