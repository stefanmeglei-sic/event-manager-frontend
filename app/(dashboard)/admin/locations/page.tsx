"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../../../components/AuthProvider";
import {
  createLocation,
  deleteLocation,
  listLocations,
  updateLocation,
} from "../../../../lib/api/locations";
import type { Location } from "../../../../lib/types";

export default function AdminLocationsPage(): React.JSX.Element {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadLocations(): Promise<void> {
    try {
      const data = await listLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations");
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadLocations().catch(() => undefined);
    }
  }, [isAdmin]);

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
      setError(err instanceof Error ? err.message : "Failed to create location");
    }
  }

  async function onDelete(id: string): Promise<void> {
    setError(null);
    try {
      await deleteLocation(id);
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete location");
    }
  }

  async function onUpdateCapacity(id: string, nextCapacity: number): Promise<void> {
    setError(null);
    try {
      await updateLocation(id, { capacitate: nextCapacity });
      await loadLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update location");
    }
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
        <p className="text-muted">Loading user...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight text-text">Locations</h1>
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger">
          Only admin users can manage locations.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <h1 className="text-3xl font-bold tracking-tight text-text">Manage Locations</h1>
      <p className="mt-1 text-sm text-muted">Admin CRUD for event locations.</p>

      <form onSubmit={onCreate} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name"
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <input
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder="Building"
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Capacity"
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Add location
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-subtle">
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Building</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Actions</th>
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
                      +10 cap
                    </button>
                    <button
                      onClick={() => onDelete(loc.id)}
                      className="rounded-lg border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-bg"
                    >
                      Delete
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
