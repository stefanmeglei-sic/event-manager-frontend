"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

type ApiUser = { id: string; email: string; role_name: string; created_at: string };
type PaginatedUsers = { items: ApiUser[]; next_cursor: string | null };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const loadMore = useCallback(
    async (cur: string | null, reset: boolean) => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (cur) params.set("cursor", cur);
        const data = await apiFetch<PaginatedUsers>(`/users?${params.toString()}`, { token });
        setUsers((prev) => (reset ? data.items : [...prev, ...data.items]));
        setCursor(data.next_cursor);
      } catch {
        /* handle silently */
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token === undefined || token === null) return;
    void loadMore(null, true);
  }, [token, loadMore]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-text mb-6">User Management</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-raised">
            <tr>
              <th className="px-4 py-3 text-left text-muted font-medium">Email</th>
              <th className="px-4 py-3 text-left text-muted font-medium">Role</th>
              <th className="px-4 py-3 text-left text-muted font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3 text-text">{u.email}</td>
                  <td className="px-4 py-3 text-muted capitalize">{u.role_name}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {cursor && (
        <div className="mt-6 text-center">
          <button
            onClick={() => void loadMore(cursor, false)}
            disabled={loading}
            className="rounded-full border border-border px-4 py-2 text-sm text-text hover:bg-surface-muted disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}
