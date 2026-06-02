"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Event, PaginatedEvents, EventCategory, EventStatus, Location } from "../../../lib/types";
import { useLocale } from "@/app/components/LocaleProvider";
import { EventCard } from "../../../components/events/event-card";
import { CalendarView } from "../../../components/events/CalendarView";
import { listEvents } from "../../../lib/api/events";
import { slugify } from "@/lib/events/slug";

const PAGE_SIZES = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

type OrganizerOption = {
  id: string;
  label: string;
};

export type EventsInitialState = {
  organizerId: string | null;
  categoryId: string | null;
  statusId: string | null;
  locationId: string;
  participationTypeId: string | null;
  from: string;
  to: string;
  registration: boolean;
  search: string;
  view: "list" | "calendar";
  limit: PageSize;
  cursor: string | null;
  history: (string | null)[];
};

type EventsClientProps = {
  initialData: PaginatedEvents;
  initialState: EventsInitialState;
  organizers: OrganizerOption[];
  categories: EventCategory[];
  statuses: EventStatus[];
  locations: Location[];
  participationTypes: EventStatus[];
};

type EventsQueryState = EventsInitialState;
type SearchParamsLike = {
  get: (name: string) => string | null;
  getAll: (name: string) => string[];
};
type FilterOverrides = Partial<{
  organizerId: string | null;
  categoryId: string | null;
  statusId: string | null;
  locationId: string;
  participationTypeId: string | null;
  from: string;
  to: string;
  registration: boolean;
  search: string;
}>;

function encodeCursor(cursor: string | null): string {
  return cursor === null ? "_" : cursor;
}

function decodeCursor(value: string | null): string | null {
  if (!value || value === "_") return null;
  return value;
}

function parsePageSize(raw: string | null): PageSize {
  const n = Number(raw);
  if (n === 50 || n === 100) return n;
  return 20;
}

function parseView(raw: string | null): "list" | "calendar" {
  return raw === "calendar" ? "calendar" : "list";
}

type Lookups = {
  organizers: OrganizerOption[];
  categories: EventCategory[];
  statuses: EventStatus[];
  locations: Location[];
  participationTypes: EventStatus[];
};

function buildQueryString(state: EventsQueryState, lookups: Lookups): string {
  const params = new URLSearchParams();
  if (state.organizerId) {
    const organizer = lookups.organizers.find((o) => o.id === state.organizerId);
    if (organizer) params.set("organizer", slugify(organizer.label));
  }
  if (state.categoryId) {
    const cat = lookups.categories.find((c) => c.id === state.categoryId);
    if (cat) params.set("category", slugify(cat.nume));
  }
  if (state.statusId) {
    const st = lookups.statuses.find((s) => s.id === state.statusId);
    if (st) params.set("status", slugify(st.nume));
  }
  if (state.locationId) {
    const loc = lookups.locations.find((l) => l.id === state.locationId);
    if (loc) params.set("location", slugify(loc.nume_sala));
  }
  if (state.participationTypeId) {
    const pt = lookups.participationTypes.find((p) => p.id === state.participationTypeId);
    if (pt) params.set("ptype", slugify(pt.nume));
  }
  if (state.from) params.set("from", state.from);
  if (state.to) params.set("to", state.to);
  if (state.registration) params.set("reg", "1");
  if (state.search) params.set("q", state.search);
  if (state.view !== "list") params.set("view", state.view);
  if (state.limit !== 20) params.set("limit", String(state.limit));
  if (state.cursor) params.set("cursor", state.cursor);
  state.history.forEach((item) => params.append("h", encodeCursor(item)));
  return params.toString();
}

function resolveQueryState(params: SearchParamsLike, lookups: Lookups): EventsQueryState {
  const organizerSlug = params.get("organizer");
  const catSlug = params.get("category");
  const stSlug = params.get("status");
  const locSlug = params.get("location");
  const ptSlug = params.get("ptype");
  return {
    organizerId: lookups.organizers.find((o) => slugify(o.label) === organizerSlug)?.id ?? null,
    categoryId: lookups.categories.find((c) => slugify(c.nume) === catSlug)?.id ?? null,
    statusId: lookups.statuses.find((s) => slugify(s.nume) === stSlug)?.id ?? null,
    locationId: lookups.locations.find((l) => slugify(l.nume_sala) === locSlug)?.id ?? "",
    participationTypeId: lookups.participationTypes.find((p) => slugify(p.nume) === ptSlug)?.id ?? null,
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    registration: params.get("reg") === "1",
    search: params.get("q") ?? "",
    view: parseView(params.get("view")),
    limit: parsePageSize(params.get("limit")),
    cursor: decodeCursor(params.get("cursor")),
    history: params.getAll("h").map((entry: string) => decodeCursor(entry)),
  };
}

export function EventsClient({
  initialData,
  initialState,
  organizers,
  categories,
  statuses,
  locations,
  participationTypes,
}: EventsClientProps): React.JSX.Element {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>(initialData.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData.next_cursor);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>(initialState.history);
  const [currentCursor, setCurrentCursor] = useState<string | null>(initialState.cursor);
  const [pageSize, setPageSize] = useState<PageSize>(initialState.limit);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string | null>(initialState.organizerId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialState.categoryId);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(initialState.statusId);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialState.locationId);
  const [selectedParticipationType, setSelectedParticipationType] = useState<string | null>(initialState.participationTypeId);
  const [dateFrom, setDateFrom] = useState<string>(initialState.from);
  const [dateTo, setDateTo] = useState<string>(initialState.to);
  const [requiresRegistration, setRequiresRegistration] = useState<boolean>(initialState.registration);
  const [searchQuery, setSearchQuery] = useState(initialState.search);
  const [view, setView] = useState<"list" | "calendar">(initialState.view);
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);
  const didMountRef = useRef(false);

  function getStatusLabel(statusId: string | null): string | undefined {
    if (!statusId) return undefined;
    return statuses.find((s) => s.id === statusId)?.nume;
  }

  function readStateFromUI(): EventsQueryState {
    return {
      organizerId: selectedOrganizer,
      categoryId: selectedCategory,
      statusId: selectedStatus,
      locationId: selectedLocation,
      participationTypeId: selectedParticipationType,
      from: dateFrom,
      to: dateTo,
      registration: requiresRegistration,
      search: searchQuery,
      view,
      limit: pageSize,
      cursor: currentCursor,
      history: cursorHistory,
    };
  }

  function pushStateToUrl(next: EventsQueryState): void {
    const query = buildQueryString(next, { organizers, categories, statuses, locations, participationTypes });
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function replaceUIState(next: EventsQueryState): void {
    setSelectedOrganizer(next.organizerId);
    setSelectedCategory(next.categoryId);
    setSelectedStatus(next.statusId);
    setSelectedLocation(next.locationId);
    setSelectedParticipationType(next.participationTypeId);
    setDateFrom(next.from);
    setDateTo(next.to);
    setRequiresRegistration(next.registration);
    setSearchQuery(next.search);
    setView(next.view);
    setPageSize(next.limit);
    setCurrentCursor(next.cursor);
    setCursorHistory(next.history);
  }

  function navigateWithState(next: EventsQueryState): void {
    replaceUIState(next);
    pushStateToUrl(next);
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const next = resolveQueryState(searchParams, { organizers, categories, statuses, locations, participationTypes });
    replaceUIState(next);
    setLoadError(null);

    startTransition(() => {
      listEvents({
        limit: next.limit,
        organizer_id: next.organizerId ?? undefined,
        categorie_id: next.categoryId ?? undefined,
        status_id: next.statusId ?? undefined,
        location_id: next.locationId || undefined,
        tip_participare_id: next.participationTypeId ?? undefined,
        date_from: next.from || undefined,
        date_to: next.to || undefined,
        requires_registration: next.registration || undefined,
        search: next.search || undefined,
        cursor: next.cursor ?? undefined,
      })
        .then((data) => {
          setEvents(data.items);
          setNextCursor(data.next_cursor);
        })
        .catch((err: unknown) => {
          setLoadError(err instanceof Error ? err.message : t("events_filters.failed_to_load"));
        });
    });
  }, [
    categories,
    locations,
    organizers,
    participationTypes,
    pathname,
    router,
    searchParams,
    statuses,
    t,
  ]);

  function applyFilter(overrides: FilterOverrides = {}): void {
    const current = readStateFromUI();
    const next: EventsQueryState = {
      ...current,
      organizerId: overrides.organizerId !== undefined ? overrides.organizerId : current.organizerId,
      categoryId: overrides.categoryId !== undefined ? overrides.categoryId : current.categoryId,
      statusId: overrides.statusId !== undefined ? overrides.statusId : current.statusId,
      locationId: overrides.locationId !== undefined ? overrides.locationId : current.locationId,
      participationTypeId: overrides.participationTypeId !== undefined ? overrides.participationTypeId : current.participationTypeId,
      from: overrides.from !== undefined ? overrides.from : current.from,
      to: overrides.to !== undefined ? overrides.to : current.to,
      registration: overrides.registration !== undefined ? overrides.registration : current.registration,
      search: overrides.search !== undefined ? overrides.search : current.search,
      cursor: null,
      history: [],
    };
    navigateWithState(next);
  }

  function handleNextPage(): void {
    if (!nextCursor) return;
    const current = readStateFromUI();
    const next: EventsQueryState = {
      ...current,
      cursor: nextCursor,
      history: [...current.history, current.cursor],
    };
    navigateWithState(next);
  }

  function handlePrevPage(): void {
    if (cursorHistory.length === 0) return;
    const current = readStateFromUI();
    const prevCursor = current.history[current.history.length - 1] ?? null;
    const next: EventsQueryState = {
      ...current,
      cursor: prevCursor,
      history: current.history.slice(0, -1),
    };
    navigateWithState(next);
  }

  function clearAllFilters(): void {
    navigateWithState({
      organizerId: null,
      categoryId: null,
      statusId: null,
      locationId: "",
      participationTypeId: null,
      from: "",
      to: "",
      registration: false,
      search: "",
      view,
      limit: pageSize,
      cursor: null,
      history: [],
    });
  }

  const hasActiveFilters =
    selectedOrganizer || selectedCategory || selectedStatus || selectedLocation ||
    selectedParticipationType || dateFrom || dateTo || requiresRegistration || searchQuery;

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            const current = readStateFromUI();
            navigateWithState({ ...current, view: "list" });
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${view === "list" ? "bg-primary text-on-primary border-primary" : "border-border text-text hover:bg-surface-muted"}`}
        >
          {t("events_filters.list")}
        </button>
        <button
          onClick={() => {
            const current = readStateFromUI();
            navigateWithState({ ...current, view: "calendar" });
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${view === "calendar" ? "bg-primary text-on-primary border-primary" : "border-border text-text hover:bg-surface-muted"}`}
        >
          {t("events_filters.calendar")}
        </button>
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            applyFilter({ search: e.currentTarget.value });
          }
        }}
        placeholder={t("events_filters.search_placeholder")}
        className="w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border sm:max-w-sm"
      />

      {/* Date range */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <span className="text-xs font-medium text-muted">{t("events_filters.date")}</span>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              applyFilter({ from: e.target.value });
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border sm:w-auto"
          />
          <span className="hidden text-xs text-muted sm:inline">-</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => {
              setDateTo(e.target.value);
              applyFilter({ to: e.target.value });
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border sm:w-auto"
          />
        </div>
      </div>

      {/* Organizer dropdown */}
      {organizers.length > 0 && (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="text-xs font-medium text-muted">{t("events_filters.organizer")}</span>
          <select
            value={selectedOrganizer ?? ""}
            onChange={(e) => {
              const next = e.target.value || null;
              setSelectedOrganizer(next);
              applyFilter({ organizerId: next });
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border sm:w-auto"
          >
            <option value="">{t("events_filters.all_organizers")}</option>
            {organizers.map((organizer) => (
              <option key={organizer.id} value={organizer.id}>
                {organizer.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location dropdown */}
      {locations.length > 0 && (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="text-xs font-medium text-muted">{t("events_filters.location")}</span>
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              applyFilter({ locationId: e.target.value });
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-border sm:w-auto"
          >
            <option value="">{t("events_filters.all_locations")}</option>
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
          <span className="self-center text-xs font-medium text-muted">{t("events_filters.mode")}</span>
          {participationTypes.map((pt) => (
            <button
              key={pt.id}
              onClick={() => {
                const next = pt.id === selectedParticipationType ? null : pt.id;
                setSelectedParticipationType(next);
                applyFilter({ participationTypeId: next });
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
          <span className="self-center text-xs font-medium text-muted">{t("events_filters.category")}</span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const next = cat.id === selectedCategory ? null : cat.id;
                setSelectedCategory(next);
                applyFilter({ categoryId: next });
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
          <span className="self-center text-xs font-medium text-muted">{t("events_filters.status")}</span>
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                const next = st.id === selectedStatus ? null : st.id;
                setSelectedStatus(next);
                applyFilter({ statusId: next });
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
            applyFilter({ registration: next });
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition border ${
            requiresRegistration
              ? "bg-primary text-on-primary border-primary"
              : "border-border text-muted hover:bg-surface-muted"
          }`}
        >
          {t("events_filters.requires_registration")}
        </button>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="rounded-full bg-danger-bg px-4 py-1.5 text-sm font-medium text-danger hover:opacity-80"
        >
          {t("events_filters.clear_filters")}
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
          <p className="text-muted">{t("events_filters.no_events")}</p>
          {hasActiveFilters && (
            <p className="mt-1 text-sm text-subtle">
              {t("events_filters.try_clearing")}
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

      {/* Pagination controls */}
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{t("pagination.per_page")}</span>
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => {
                const current = readStateFromUI();
                navigateWithState({
                  ...current,
                  limit: size,
                  cursor: null,
                  history: [],
                });
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                pageSize === size
                  ? "bg-primary text-on-primary border-primary"
                  : "border-border text-text hover:bg-surface-muted"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={isPending || cursorHistory.length === 0}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-raised disabled:opacity-40"
          >
            ← {t("pagination.prev")}
          </button>
          <span className="text-xs text-muted">
            {t("pagination.page")} {cursorHistory.length + 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={isPending || !nextCursor}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-raised disabled:opacity-40"
          >
            {t("pagination.next")} →
          </button>
        </div>
      </div>
    </div>
  );
}


