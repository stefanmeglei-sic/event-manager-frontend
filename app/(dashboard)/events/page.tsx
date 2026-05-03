import type { Metadata } from "next";
import type { PaginatedEvents, EventCategory, EventStatus, Location } from "../../../lib/types";
import { EventsClient } from "./EventsClient";

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

export default async function EventsPage(): Promise<React.JSX.Element> {
  const [eventsData, categories, statuses, locations, participationTypes] = await Promise.all([
    fetchJson<PaginatedEvents>("/events?limit=20"),
    fetchJson<EventCategory[]>("/lookups/event-categories"),
    fetchJson<EventStatus[]>("/lookups/event-statuses"),
    fetchJson<Location[]>("/lookups/locations"),
    fetchJson<EventStatus[]>("/lookups/participation-types"),
  ]);

  const initialData: PaginatedEvents = eventsData ?? { items: [], next_cursor: null };

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Events
        </h1>
        <p className="mt-1 text-sm text-muted">
          Browse and discover university events
        </p>
      </header>

      <EventsClient
        initialData={initialData}
        categories={categories ?? []}
        statuses={statuses ?? []}
        locations={locations ?? []}
        participationTypes={participationTypes ?? []}
      />
    </main>
  );
}
