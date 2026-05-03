import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Event, PaginatedEvents } from "@/lib/types";
import { getDictionary, translate } from "@/lib/i18n/shared";
import { getServerLocale } from "@/lib/i18n/server";

type CurrentUser = {
  id: string;
  email: string;
  role: string;
};

function getServerApiUrl(): string {
  return (
    process.env.BACKEND_INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api/v1"
  );
}

async function serverFetch<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${getServerApiUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function OrganizerPage(): Promise<React.JSX.Element> {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const currentUser = await serverFetch<CurrentUser>("/auth/me", token);

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "organizer" && currentUser.role !== "admin") {
    redirect("/events");
  }

  const eventsData = await serverFetch<PaginatedEvents>(
    `/events?organizer_id=${currentUser.id}&limit=50`,
    token,
  );

  const events: Event[] = eventsData?.items ?? [];
  const totalRegistrations = 0; // count not available from list endpoint

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">{translate(dictionary, "organizer.title")}</h1>
          <p className="mt-1 text-sm text-muted">{currentUser.email}</p>
        </div>
        <Link
          href="/events/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 transition"
        >
          + {translate(dictionary, "organizer.create_new")}
        </Link>
      </header>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "organizer.total_events")}</p>
          <p className="text-3xl font-bold text-text">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "organizer.total_registrations")}</p>
          <p className="text-3xl font-bold text-text">{totalRegistrations}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">{translate(dictionary, "organizer.role")}</p>
          <p className="text-lg font-semibold text-primary capitalize">{currentUser.role}</p>
        </div>
      </div>

      {/* Events table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="border-b border-border bg-surface px-6 py-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">{translate(dictionary, "organizer.events")}</h2>
        </div>
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted bg-surface">
            {translate(dictionary, "organizer.no_events")} {" "}
            <Link href="/events/new" className="text-primary hover:underline">
              {translate(dictionary, "organizer.create_first")} -&gt;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-raised">
                <tr>
                  <th className="px-4 py-3 text-left text-muted font-medium">{translate(dictionary, "organizer.title_col")}</th>
                  <th className="px-4 py-3 text-left text-muted font-medium">{translate(dictionary, "organizer.start_date_col")}</th>
                  <th className="px-4 py-3 text-left text-muted font-medium">{translate(dictionary, "organizer.location_id_col")}</th>
                  <th className="px-4 py-3 text-left text-muted font-medium">{translate(dictionary, "organizer.actions_col")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-raised transition-colors">
                    <td className="px-4 py-3 text-text font-medium">{event.titlu}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(event.start_date).toLocaleString(dateLocale)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {event.locatie_id ?? translate(dictionary, "common.none")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/events/${event.id}`}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-text hover:bg-surface-muted transition"
                        >
                          {translate(dictionary, "common.view")}
                        </Link>
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-text hover:bg-surface-muted transition"
                        >
                          {translate(dictionary, "common.edit")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
