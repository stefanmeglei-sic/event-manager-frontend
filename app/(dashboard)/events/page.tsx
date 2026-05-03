import type { Metadata } from "next";
import type { PaginatedEvents, EventCategory, EventStatus, Location } from "../../../lib/types";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n/shared";
import { EventsClient, type EventsInitialState } from "./EventsClient";
import { slugify } from "@/lib/events/slug";

export const metadata: Metadata = {
  title: "Events — Event Manager",
};

function getServerApiUrl(): string {
  return (
    process.env.BACKEND_INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api/v1"
  );
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getServerApiUrl()}${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function parsePageSize(raw: string | undefined): 20 | 50 | 100 {
  if (raw === "50") return 50;
  if (raw === "100") return 100;
  return 20;
}

function parseInitialState(raw: Record<string, string | string[] | undefined>): EventsInitialState {
  const pick = (key: string): string | undefined => {
    const value = raw[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const historyRaw = raw.h;
  const historyEntries = Array.isArray(historyRaw)
    ? historyRaw
    : historyRaw
      ? [historyRaw]
      : [];

  return {
    categoryId: pick("category") ?? null,
    statusId: pick("status") ?? null,
    locationId: pick("location") ?? "",
    participationTypeId: pick("ptype") ?? null,
    from: pick("from") ?? "",
    to: pick("to") ?? "",
    registration: pick("reg") === "1",
    search: pick("q") ?? "",
    view: pick("view") === "calendar" ? "calendar" : "list",
    limit: parsePageSize(pick("limit")),
    cursor: pick("cursor") ?? null,
    history: historyEntries.map((entry) => (entry === "_" ? null : entry)),
  };
}

function buildInitialEventsQuery(state: EventsInitialState): string {
  const params = new URLSearchParams();
  params.set("limit", String(state.limit));
  if (state.cursor) params.set("cursor", state.cursor);
  if (state.categoryId) params.set("categorie_id", state.categoryId);
  if (state.statusId) params.set("status_id", state.statusId);
  if (state.locationId) params.set("location_id", state.locationId);
  if (state.participationTypeId) params.set("tip_participare_id", state.participationTypeId);
  if (state.from) params.set("date_from", state.from);
  if (state.to) params.set("date_to", state.to);
  if (state.registration) params.set("requires_registration", "true");
  if (state.search) params.set("search", state.search);
  return params.toString();
}

function resolveStateIds(
  state: EventsInitialState,
  categories: EventCategory[],
  statuses: EventStatus[],
  locations: Location[],
  participationTypes: EventStatus[],
): EventsInitialState {
  return {
    ...state,
    categoryId: categories.find((c) => slugify(c.nume) === state.categoryId)?.id ?? null,
    statusId: statuses.find((s) => slugify(s.nume) === state.statusId)?.id ?? null,
    locationId: locations.find((l) => slugify(l.nume_sala) === state.locationId)?.id ?? "",
    participationTypeId: participationTypes.find((p) => slugify(p.nume) === state.participationTypeId)?.id ?? null,
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);
  const rawSearchParams = searchParams ? await searchParams : {};
  const rawState = parseInitialState(rawSearchParams);

  const [categories, statuses, locations, participationTypes] = await Promise.all([
    fetchJson<EventCategory[]>("/lookups/event-categories"),
    fetchJson<EventStatus[]>("/lookups/event-statuses"),
    fetchJson<Location[]>("/lookups/locations"),
    fetchJson<EventStatus[]>("/lookups/participation-types"),
  ]);

  const initialState = resolveStateIds(
    rawState,
    categories ?? [],
    statuses ?? [],
    locations ?? [],
    participationTypes ?? [],
  );

  const initialEventsQuery = buildInitialEventsQuery(initialState);
  const eventsData = await fetchJson<PaginatedEvents>(`/events?${initialEventsQuery}`);

  const initialData: PaginatedEvents = eventsData ?? { items: [], next_cursor: null };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text">
          {translate(dictionary, "events_page.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {translate(dictionary, "events_page.subtitle")}
        </p>
      </header>

      <EventsClient
        initialData={initialData}
        initialState={initialState}
        categories={categories ?? []}
        statuses={statuses ?? []}
        locations={locations ?? []}
        participationTypes={participationTypes ?? []}
      />
    </main>
  );
}
