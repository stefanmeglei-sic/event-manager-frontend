"use client";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { getEventPath } from "@/lib/events/slug";

type Props = { events: Event[] };

export function CalendarView({ events }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build map: day → events
  const eventsByDay: Record<number, Event[]> = {};
  for (const event of events) {
    const d = new Date(event.start_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(event);
    }
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = now.toLocaleString("ro-RO", { month: "long", year: "numeric" });
  const daysWithEvents = Object.entries(eventsByDay)
    .map(([day, dayEvents]) => ({ day: Number(day), dayEvents }))
    .sort((left, right) => left.day - right.day);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-text capitalize">{monthName}</p>
      </div>
      <div className="divide-y divide-border md:hidden">
        {daysWithEvents.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No events this month.</p>
        ) : (
          daysWithEvents.map(({ day, dayEvents }) => (
            <div key={day} className="space-y-3 px-4 py-4">
              <div>
                <p className={`text-sm font-semibold ${day === now.getDate() ? "text-primary" : "text-text"}`}>
                  {day}
                </p>
                <p className="text-xs text-muted">{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}</p>
              </div>
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={getEventPath(ev)}
                    className="block rounded-lg border border-border bg-surface-raised px-3 py-2 transition hover:border-primary/40"
                  >
                    <p className="text-sm font-medium text-text">{ev.titlu}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(ev.start_date).toLocaleTimeString("ro-RO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="hidden md:grid md:grid-cols-7 md:border-b md:border-border">
        {dayNames.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs text-muted font-medium">{d}</div>
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-7">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`min-h-[80px] border-b border-r border-border/50 p-1 ${day ? "" : "bg-surface-muted/30"}`}
          >
            {day && (
              <>
                <p className={`text-xs font-medium mb-1 ${day === now.getDate() ? "text-primary" : "text-muted"}`}>
                  {day}
                </p>
                <div className="space-y-0.5">
                  {(eventsByDay[day] ?? []).slice(0, 2).map((ev) => (
                    <Link
                      key={ev.id}
                      href={getEventPath(ev)}
                      className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary hover:bg-primary/20"
                      title={ev.titlu}
                    >
                      {ev.titlu}
                    </Link>
                  ))}
                  {(eventsByDay[day]?.length ?? 0) > 2 && (
                    <p className="text-[10px] text-muted">+{(eventsByDay[day]?.length ?? 0) - 2} more</p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
