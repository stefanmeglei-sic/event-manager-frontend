"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";

import { useAuth } from "@/app/components/AuthProvider";
import { useLocale } from "@/app/components/LocaleProvider";
import { apiFetch } from "@/lib/api/client";
import {
  getEventCategories,
  getEventStatuses,
  getLocations,
  getParticipationTypes,
} from "@/lib/api/lookups";
import type { Event, EventCategory, EventStatus, Location } from "@/lib/types";

export default function EditEventPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useLocale();
  const { user } = useAuth();

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [statuses, setStatuses] = useState<EventStatus[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [participationTypes, setParticipationTypes] = useState<EventStatus[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [participationTypeId, setParticipationTypeId] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [deadline, setDeadline] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = user?.role === "admin" || user?.role === "organizer";

  // Helper to convert ISO date to datetime-local input value
  function toDatetimeLocal(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    // format: YYYY-MM-DDTHH:MM
    return d.toISOString().slice(0, 16);
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiFetch<Event>(`/events/${id}`),
      getEventCategories(),
      getEventStatuses(),
      getLocations(),
      getParticipationTypes(),
    ])
      .then(([event, cats, sts, locs, parts]) => {
        setCategories(cats);
        setStatuses(sts);
        setLocations(locs);
        setParticipationTypes(parts);

        setTitle(event.titlu);
        setDescription(event.descriere ?? "");
        setStartDate(toDatetimeLocal(event.start_date));
        setEndDate(toDatetimeLocal(event.end_date));
        setCategoryId(event.categorie_id ?? cats[0]?.id ?? "");
        setStatusId(event.status_id ?? sts[0]?.id ?? "");
        setLocationId(event.locatie_id ?? "");
        setParticipationTypeId(event.tip_participare_id ?? parts[0]?.id ?? "");
        setMaxParticipants(event.max_participanti?.toString() ?? "");
        setDeadline(toDatetimeLocal(event.deadline_inscriere));
        setRegistrationLink(event.link_inscriere ?? "");
        setLoaded(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("event_form.failed_to_load_event"));
      });
  }, [id, t]);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSaving(true);
    try {
      await apiFetch(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          titlu: title,
          descriere: description || null,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          locatie_id: locationId || null,
          categorie_id: categoryId,
          status_id: statusId,
          tip_participare_id: participationTypeId,
          max_participanti: maxParticipants ? Number(maxParticipants) : null,
          deadline_inscriere: deadline ? new Date(deadline).toISOString() : null,
          link_inscriere: registrationLink || null,
        }),
      });
      router.push(`/events/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("event_form.failed_to_update"));
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
        <p className="text-muted">{t("common.loading_user")}</p>
      </main>
    );
  }

  if (!canEdit) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
        <h1 className="text-2xl font-semibold text-text">{t("event_form.edit_title")}</h1>
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger">
          {t("event_form.edit_restricted")}
        </p>
      </main>
    );
  }

  if (!loaded && !error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
        <p className="text-muted">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
      <h1 className="text-3xl font-bold tracking-tight text-text">{t("event_form.edit_title")}</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div>
          <label className="block text-sm text-text">{t("event_form.title_label")}</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
          />
        </div>

        <div>
          <label className="block text-sm text-text">{t("event_form.description_label")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            rows={4}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-text">{t("event_form.start_date")}</label>
            <input
              required
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            />
          </div>
          <div>
            <label className="block text-sm text-text">{t("event_form.end_date")}</label>
            <input
              required
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-text">{t("event_form.category")}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nume}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text">{t("event_form.status")}</label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            >
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>{st.nume}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-text">{t("event_form.location")}</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            >
              <option value="">{t("common.no_location")}</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.nume_sala}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text">{t("event_form.participation_type")}</label>
            <select
              value={participationTypeId}
              onChange={(e) => setParticipationTypeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            >
              {participationTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.nume}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm text-text">{t("event_form.max_participants")}</label>
            <input
              type="number"
              min={1}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-text">{t("event_form.registration_deadline")}</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text">{t("event_form.registration_link")}</label>
          <input
            value={registrationLink}
            onChange={(e) => setRegistrationLink(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger-bg p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? t("event_form.saving_button") : t("event_form.save_button")}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/events/${id}`)}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-muted"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </main>
  );
}
