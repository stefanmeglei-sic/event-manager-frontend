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

export default function AdminLocationsPage(): React.JSX.Element {
  const { t } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async (): Promise<void> => {
    try {
      const data = await listLocations();
      setLocations(data);
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

  async function onUpdateCapacity(id: string, nextCapacity: number): Promise<void> {
    setError(null);
    try {
      await updateLocation(id, { capacitate: nextCapacity });
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_locations.failed_to_update"));
    }
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
        <p className="text-muted">{t("common.loading_user")}</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight text-text">{t("admin_locations.restricted_title")}</h1>
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger">
          {t("admin_locations.restricted_message")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
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
                <td className="px-4 py-3 text-text">{loc.nume_sala}</td>
                <td className="px-4 py-3 text-muted">{loc.corp_cladire ?? "-"}</td>
                <td className="px-4 py-3 text-muted">{loc.capacitate ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateCapacity(loc.id, (loc.capacitate ?? 0) + 10)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-surface-muted"
                    >
                      {t("admin_locations.increase_capacity")}
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
    </main>
  );
}
