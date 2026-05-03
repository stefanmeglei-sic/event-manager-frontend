"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../../components/AuthProvider";
import { useLocale } from "../../../components/LocaleProvider";
import { createEvent } from "../../../../lib/api/events";
import {
  getEventCategories,
  getEventStatuses,
  getLocations,
  getParticipationTypes,
} from "../../../../lib/api/lookups";
import type { EventCategory, EventStatus, Location } from "../../../../lib/types";

export default function NewEventPage(): React.JSX.Element {
  const router = useRouter();
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

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canCreate = user?.role === "admin" || user?.role === "organizer";

  useEffect(() => {
    if (!canCreate) {
      return;
    }
    Promise.all([
      getEventCategories(),
      getEventStatuses(),
      getLocations(),
      getParticipationTypes(),
    ])
      .then(([cats, sts, locs, parts]) => {
        setCategories(cats);
        setStatuses(sts);
        setLocations(locs);
        setParticipationTypes(parts);
        setCategoryId(cats[0]?.id ?? "");
        setStatusId(sts.find((s) => s.nume === "draft")?.id ?? sts[0]?.id ?? "");
        setParticipationTypeId(parts[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("event_form.failed_to_load_lookups"));
      });
  }, [canCreate, t]);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSaving(true);
    try {
      await createEvent({
        titlu: title,
        descriere: description || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        locatie_id: locationId || null,
        categorie_id: categoryId,
        status_id: statusId,
        organizer_id: user.id,
        tip_participare_id: participationTypeId,
        max_participanti: maxParticipants ? Number(maxParticipants) : null,
        deadline_inscriere: deadline ? new Date(deadline).toISOString() : null,
        link_inscriere: registrationLink || null,
      });
      router.push("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("event_form.failed_to_create"));
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

  if (!canCreate) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
        <h1 className="text-2xl font-semibold text-text">{t("event_form.create_title")}</h1>
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger">
          {t("event_form.create_restricted")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
      <h1 className="text-3xl font-bold tracking-tight text-text">{t("event_form.create_title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("event_form.create_subtitle")}</p>

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

        {error && <p className="rounded-xl border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
        >
          {isSaving ? t("event_form.creating_button") : t("event_form.create_button")}
        </button>
      </form>
    </main>
  );
}
