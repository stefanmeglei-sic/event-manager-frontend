import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import type { Event, Location, EventCategory, EventStatus } from "@/lib/types";
import EnrollButton from "./EnrollButton";
import ValidateButtons from "./ValidateButtons";
import FeedbackSection from "./FeedbackSection";
import ExportCsvButton from "./ExportCsvButton";

type Props = { params: Promise<{ id: string }> };

function formatGoogleDate(iso: string): string {
  // Convert ISO 8601 to YYYYMMDDTHHMMSSz (strip dashes/colons)
  return iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
}

function buildGoogleCalendarUrl(event: Event, locationName: string | undefined): string {
  const start = formatGoogleDate(event.start_date);
  const endIso = event.end_date ?? new Date(new Date(event.start_date).getTime() + 3600000).toISOString();
  const end = formatGoogleDate(endIso);
  const params = new URLSearchParams({
    text: event.titlu,
    dates: `${start}/${end}`,
    ...(event.descriere ? { details: event.descriere } : {}),
    ...(locationName ? { location: locationName } : {}),
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;

  const [event, locations, categories, statuses] = await Promise.all([
    apiFetch<Event>(`/events/${id}`),
    apiFetch<Location[]>("/lookups/locations"),
    apiFetch<EventCategory[]>("/lookups/event-categories"),
    apiFetch<EventStatus[]>("/lookups/event-statuses"),
  ]);

  const location = locations.find((l) => l.id === event.locatie_id);
  const category = categories.find((c) => c.id === event.categorie_id);
  const draftStatus = statuses.find((s) => s.nume === "draft");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4">
        <Link
          href="/events"
          className="text-sm text-muted hover:text-text transition-colors"
        >
          ← Back to events
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">{event.titlu}</h1>
          {category && (
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              {category.nume}
            </span>
          )}
        </div>

        {event.descriere && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Description</p>
            <p className="text-text whitespace-pre-wrap">{event.descriere}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Start</p>
            <p className="text-text">
              {new Date(event.start_date).toLocaleString("ro-RO")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">End</p>
            <p className="text-text">
              {new Date(event.end_date).toLocaleString("ro-RO")}
            </p>
          </div>
        </div>

        {location && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Location</p>
            <p className="text-text">
              {location.nume_sala}
              {location.corp_cladire ? ` — ${location.corp_cladire}` : ""}
              {location.capacitate ? ` (capacity: ${location.capacitate})` : ""}
            </p>
          </div>
        )}

        {event.max_participanti !== null && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Max participants</p>
            <p className="text-text">{event.max_participanti}</p>
          </div>
        )}

        {event.deadline_inscriere && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              Registration deadline
            </p>
            <p className="text-text">
              {new Date(event.deadline_inscriere).toLocaleString("ro-RO")}
            </p>
          </div>
        )}

        {event.link_inscriere && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              Registration link
            </p>
            <a
              href={event.link_inscriere}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {event.link_inscriere}
            </a>
          </div>
        )}

        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">QR Code</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1"}/events/${id}/qr`}
            alt="Event QR Code"
            width={160}
            height={160}
            className="rounded-lg border border-border"
          />
        </div>

        <div className="border-t border-border pt-4 flex gap-3">
          <EnrollButton eventId={id} />
          <Link
            href={`/events/${id}/edit`}
            className="mt-8 inline-block rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-muted"
          >
            Edit event
          </Link>
        </div>

        {draftStatus && event.status_id === draftStatus.id && (
          <ValidateButtons eventId={id} />
        )}

        {/* F5+F6: Calendar actions */}
        <div className="border-t border-border pt-4 flex flex-wrap gap-3 items-center">
          <a
            href={`${process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1"}/events/${id}/ics`}
            download
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-muted transition"
          >
            📥 Add to Calendar
          </a>
          <a
            href={buildGoogleCalendarUrl(event, location?.nume_sala)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-muted transition"
          >
            📅 Google Calendar
          </a>
          {/* F11: CSV Export (client component checks role) */}
          <ExportCsvButton eventId={id} />
        </div>

        {/* F7: Feedback section (client component, only shows when eligible) */}
        <FeedbackSection eventId={id} eventEndDate={event.end_date} />
      </div>
    </main>
  );
}
