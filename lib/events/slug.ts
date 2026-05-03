type EventSlugInput = {
  titlu: string;
  organizer_name?: string | null;
  organizer_id?: string | null;
  start_date?: string | null;
};

export function slugify(value: string): string {
  return normalizePart(value);
}

function normalizePart(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized;
}

export function toEventSlug(title: string): string {
  return normalizePart(title) || "event";
}

function normalizeOrganizer(event: EventSlugInput): string {
  const organizer = event.organizer_name ?? event.organizer_id ?? "organizer";
  return normalizePart(organizer) || "organizer";
}

function normalizeStartDate(startDate: string | null | undefined): string {
  if (!startDate) return "date";
  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) return "date";
  return parsed.toISOString().slice(0, 10);
}

export function getEventSlug(event: EventSlugInput): string {
  const title = toEventSlug(event.titlu);
  const organizer = normalizeOrganizer(event);
  const date = normalizeStartDate(event.start_date);
  return `${title}--${organizer}--${date}`;
}

export function getEventLegacySlug(event: Pick<EventSlugInput, "titlu">): string {
  return toEventSlug(event.titlu);
}

export function getEventPath(event: EventSlugInput): string {
  return `/events/${getEventSlug(event)}`;
}

export function getEventEditPath(event: EventSlugInput): string {
  return `${getEventPath(event)}/edit`;
}
