import Link from "next/link";
import type { Event } from "../../lib/types";

type EventCardProps = {
  event: Event;
  statusLabel?: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  published: "bg-success-bg text-success",
  activ:     "bg-success-bg text-success",
  cancelled: "bg-danger-bg text-danger",
  anulat:    "bg-danger-bg text-danger",
  completed: "bg-surface-muted text-muted",
  finalizat: "bg-surface-muted text-muted",
  draft:     "bg-warning-bg text-warning",
  pending:   "bg-info-bg text-info",
};

function statusBadgeClass(label: string | undefined): string {
  if (!label) return "bg-surface-muted text-muted";
  return (
    STATUS_COLORS[label.toLowerCase()] ?? "bg-surface-muted text-primary"
  );
}

export function EventCard({
  event,
  statusLabel,
}: EventCardProps): React.JSX.Element {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-text group-hover:text-primary line-clamp-2">
          {event.titlu}
        </h3>
        {statusLabel && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(statusLabel)}`}
          >
            {statusLabel}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted">
        {formatDate(event.start_date)}
      </p>

      {event.max_participanti !== null && (
        <p className="mt-1 text-xs text-subtle">
          Max {event.max_participanti} participants
        </p>
      )}

      {event.descriere && (
        <p className="mt-3 text-sm text-muted line-clamp-2">
          {event.descriere}
        </p>
      )}
    </Link>
  );
}
