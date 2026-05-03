import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { findEventBySlug } from "@/lib/api/events";
import { getEventEditPath } from "@/lib/events/slug";
import { getDictionary, translate } from "@/lib/i18n/shared";
import { getServerLocale } from "@/lib/i18n/server";
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
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const { id: slug } = await params;

  const [event, locations, categories, statuses] = await Promise.all([
    findEventBySlug(slug),
    apiFetch<Location[]>("/lookups/locations"),
    apiFetch<EventCategory[]>("/lookups/event-categories"),
    apiFetch<EventStatus[]>("/lookups/event-statuses"),
  ]);

  if (!event) {
    notFound();
  }

  const eventId = event.id;

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
          &larr; {translate(dictionary, "event_detail.back_to_events")}
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
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "event_detail.description")}</p>
            <p className="text-text whitespace-pre-wrap">{event.descriere}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "event_detail.start")}</p>
            <p className="text-text">
              {new Date(event.start_date).toLocaleString(dateLocale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "event_detail.end")}</p>
            <p className="text-text">
              {new Date(event.end_date).toLocaleString(dateLocale)}
            </p>
          </div>
        </div>

        {location && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "event_detail.location")}</p>
            <p className="text-text">
              {location.nume_sala}
              {location.corp_cladire ? ` - ${location.corp_cladire}` : ""}
              {location.capacitate ? ` (${translate(dictionary, "event_detail.capacity")}: ${location.capacitate})` : ""}
            </p>
          </div>
        )}

        {event.max_participanti !== null && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "event_detail.max_participants")}</p>
            <p className="text-text">{event.max_participanti}</p>
          </div>
        )}

        {event.deadline_inscriere && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              {translate(dictionary, "event_detail.registration_deadline")}
            </p>
            <p className="text-text">
              {new Date(event.deadline_inscriere).toLocaleString(dateLocale)}
            </p>
          </div>
        )}

        {event.link_inscriere && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              {translate(dictionary, "event_detail.registration_link")}
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
          <p className="text-xs text-muted uppercase tracking-wider mb-2">{translate(dictionary, "event_detail.qr_code")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1"}/events/${eventId}/qr`}
            alt={translate(dictionary, "qr.event_alt")}
            width={160}
            height={160}
            className="rounded-lg border border-border"
          />
        </div>

        <div className="border-t border-border pt-4 flex gap-3">
          <EnrollButton
            eventId={eventId}
            organizerId={event.organizer_id}
            participationTypeId={event.tip_participare_id}
          />
          <Link
            href={getEventEditPath(event)}
            className="mt-8 inline-block rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-muted"
          >
            {translate(dictionary, "event_detail.edit_event")}
          </Link>
        </div>

        {draftStatus && event.status_id === draftStatus.id && (
          <ValidateButtons eventId={eventId} />
        )}

        {/* F5+F6: Calendar actions */}
        <div className="border-t border-border pt-4 flex flex-wrap gap-3 items-center">
          <a
            href={`${process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1"}/events/${eventId}/ics`}
            download
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-muted transition"
          >
            {translate(dictionary, "event_detail.add_to_calendar")}
          </a>
          <a
            href={buildGoogleCalendarUrl(event, location?.nume_sala)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-muted transition"
          >
            {translate(dictionary, "event_detail.google_calendar")}
          </a>
          {/* F11: CSV Export (client component checks role) */}
          <ExportCsvButton eventId={eventId} />
        </div>

        {/* F7: Feedback section (client component, only shows when eligible) */}
        <FeedbackSection eventId={eventId} eventEndDate={event.end_date} />
      </div>
    </main>
  );
}
