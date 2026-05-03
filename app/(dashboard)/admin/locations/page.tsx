"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../../../components/AuthProvider";
import { useLocale } from "../../../components/LocaleProvider";
import {
  createLocation,
  deleteLocation,
  listLocations,
  updateLocation,
} from "../../../../lib/api/locations";
import type { Location } from "../../../../lib/types";

type LocationDraft = {
  nume_sala: string;
  corp_cladire: string;
  capacitate: string;
};

export default function AdminLocationsPage(): React.JSX.Element {
  const { t } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [capacity, setCapacity] = useState("");
  const [locationDrafts, setLocationDrafts] = useState<Record<string, LocationDraft>>({});
  const [savingLocationId, setSavingLocationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toDraft(loc: Location): LocationDraft {
    return {
      nume_sala: loc.nume_sala,
      corp_cladire: loc.corp_cladire ?? "",
      capacitate: loc.capacitate?.toString() ?? "",
    };
  }

  const loadLocations = useCallback(async (): Promise<void> => {
    try {
      const data = await listLocations();
      setLocations(data);
      setLocationDrafts(Object.fromEntries(data.map((loc) => [loc.id, toDraft(loc)])));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_locations.failed_to_load"));
    }
  }, [t]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let active = true;
    listLocations()
      .then((data) => {
        if (!active) return;
        setLocations(data);
        setLocationDrafts(Object.fromEntries(data.map((loc) => [loc.id, toDraft(loc)])));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("admin_locations.failed_to_load"));
      });

    return () => {
      active = false;
    };
  }, [isAdmin, t]);

  async function onCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    try {
      await createLocation({
        nume_sala: name,
        corp_cladire: building || null,
        capacitate: capacity ? Number(capacity) : null,
      });
      setName("");
      setBuilding("");
      setCapacity("");
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_locations.failed_to_create"));
    }
  }

  async function onDelete(id: string): Promise<void> {
    setError(null);
    try {
      await deleteLocation(id);
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_locations.failed_to_delete"));
    }
  }

  async function onSaveLocation(id: string): Promise<void> {
    const draft = locationDrafts[id];
    if (!draft) return;

    const trimmedName = draft.nume_sala.trim();
    if (!trimmedName) {
      setError(t("admin_locations.room_name_required"));
      return;
    }

    const normalizedCapacity = draft.capacitate.trim();
    if (normalizedCapacity && Number(normalizedCapacity) <= 0) {
      setError(t("admin_locations.invalid_capacity"));
      return;
    }

    setError(null);
    setSavingLocationId(id);
    try {
      await updateLocation(id, {
        nume_sala: trimmedName,
        corp_cladire: draft.corp_cladire.trim() || null,
        capacitate: normalizedCapacity ? Number(normalizedCapacity) : null,
      });
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_locations.failed_to_update"));
    } finally {
      setSavingLocationId(null);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <p className="text-muted">{t("common.loading_user")}</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight text-text">{t("admin_locations.restricted_title")}</h1>
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger">
          {t("admin_locations.restricted_message")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
      <h1 className="text-3xl font-bold tracking-tight text-text">{t("admin_locations.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("admin_locations.subtitle")}</p>

      <form onSubmit={onCreate} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("admin_locations.room_name")}
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <input
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder={t("admin_locations.building")}
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder={t("admin_locations.capacity")}
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          {t("admin_locations.add_location")}
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 rounded-2xl border border-border bg-surface">
        <div className="space-y-3 p-4 md:hidden">
          {locations.map((loc) => (
            <article key={loc.id} className="rounded-xl border border-border bg-surface-raised p-4">
              <p className="text-sm font-semibold text-text">{loc.nume_sala}</p>
              <div className="mt-3 grid gap-2">
                <input
                  value={locationDrafts[loc.id]?.nume_sala ?? ""}
                  onChange={(e) =>
                    setLocationDrafts((prev) => ({
                      ...prev,
                      [loc.id]: { ...(prev[loc.id] ?? toDraft(loc)), nume_sala: e.target.value },
                    }))
                  }
                  placeholder={t("admin_locations.room_name")}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
                />
                <input
                  value={locationDrafts[loc.id]?.corp_cladire ?? ""}
                  onChange={(e) =>
                    setLocationDrafts((prev) => ({
                      ...prev,
                      [loc.id]: { ...(prev[loc.id] ?? toDraft(loc)), corp_cladire: e.target.value },
                    }))
                  }
                  placeholder={t("admin_locations.building")}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
                />
                <input
                  type="number"
                  min={1}
                  value={locationDrafts[loc.id]?.capacitate ?? ""}
                  onChange={(e) =>
                    setLocationDrafts((prev) => ({
                      ...prev,
                      [loc.id]: { ...(prev[loc.id] ?? toDraft(loc)), capacitate: e.target.value },
                    }))
                  }
                  placeholder={t("admin_locations.capacity")}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onSaveLocation(loc.id)}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-surface-muted"
                >
                  {savingLocationId === loc.id ? t("admin_locations.saving") : t("admin_locations.save")}
                </button>
                <button
                  onClick={() => onDelete(loc.id)}
                  className="rounded-lg border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-bg"
                >
                  {t("common.delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-subtle">
              <th className="px-4 py-3">{t("admin_locations.room")}</th>
              <th className="px-4 py-3">{t("admin_locations.building")}</th>
              <th className="px-4 py-3">{t("admin_locations.capacity")}</th>
              <th className="px-4 py-3">{t("admin_locations.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td className="px-4 py-3 text-text">
                  <input
                    value={locationDrafts[loc.id]?.nume_sala ?? ""}
                    onChange={(e) =>
                      setLocationDrafts((prev) => ({
                        ...prev,
                        [loc.id]: { ...(prev[loc.id] ?? toDraft(loc)), nume_sala: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-text"
                  />
                </td>
                <td className="px-4 py-3 text-muted">
                  <input
                    value={locationDrafts[loc.id]?.corp_cladire ?? ""}
                    onChange={(e) =>
                      setLocationDrafts((prev) => ({
                        ...prev,
                        [loc.id]: { ...(prev[loc.id] ?? toDraft(loc)), corp_cladire: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-text"
                  />
                </td>
                <td className="px-4 py-3 text-muted">
                  <input
                    type="number"
                    min={1}
                    value={locationDrafts[loc.id]?.capacitate ?? ""}
                    onChange={(e) =>
                      setLocationDrafts((prev) => ({
                        ...prev,
                        [loc.id]: { ...(prev[loc.id] ?? toDraft(loc)), capacitate: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-text"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSaveLocation(loc.id)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-surface-muted"
                    >
                      {savingLocationId === loc.id ? t("admin_locations.saving") : t("admin_locations.save")}
                    </button>
                    <button
                      onClick={() => onDelete(loc.id)}
                      className="rounded-lg border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-bg"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </main>
  );
}
