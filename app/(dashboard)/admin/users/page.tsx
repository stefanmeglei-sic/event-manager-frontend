"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/app/components/LocaleProvider";

type ApiUser = { id: string; email: string; nume?: string | null; rol_id: string; created_at: string };
type RoleLookup = { id: string; nume: string };
type PaginatedUsers = { items: ApiUser[]; next_cursor: string | null };
type UserDraft = { email: string; nume: string; rol_id: string };

export default function AdminUsersPage() {
  const { t } = useLocale();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<RoleLookup[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("token");
  });
  const [loading, setLoading] = useState(Boolean(token));

  function makeDraft(user: ApiUser): UserDraft {
    return {
      email: user.email,
      nume: user.nume ?? "",
      rol_id: user.rol_id,
    };
  }

  function applyUsers(nextUsers: ApiUser[], reset: boolean): void {
    setUsers((prev) => (reset ? nextUsers : [...prev, ...nextUsers]));
    setDrafts((prev) => {
      const merged = { ...prev };
      nextUsers.forEach((u) => {
        merged[u.id] = merged[u.id] ?? makeDraft(u);
      });
      return merged;
    });
  }

  const loadMore = useCallback(
    async (cur: string | null, reset: boolean) => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (cur) params.set("cursor", cur);
        const data = await apiFetch<PaginatedUsers>(`/users?${params.toString()}`, { token });
        applyUsers(data.items, reset);
        setCursor(data.next_cursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("admin_users.failed_to_load"));
      } finally {
        setLoading(false);
      }
    },
    [token, t],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    Promise.all([
      apiFetch<PaginatedUsers>("/users?limit=20", { token }),
      apiFetch<RoleLookup[]>("/lookups/roles", { token }),
    ])
      .then(([data, roleData]) => {
        if (!active) return;
        applyUsers(data.items, true);
        setCursor(data.next_cursor);
        setRoles(roleData);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : t("admin_users.failed_to_load"));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, t]);

  async function saveUser(userId: string): Promise<void> {
    if (!token) return;
    const draft = drafts[userId];
    if (!draft) return;
    setSavingUserId(userId);
    setError(null);
    try {
      const updated = await apiFetch<ApiUser>(`/users/${userId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          email: draft.email,
          nume: draft.nume || null,
          rol_id: draft.rol_id,
        }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setDrafts((prev) => ({ ...prev, [userId]: makeDraft(updated) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin_users.failed_to_update"));
    } finally {
      setSavingUserId(null);
    }
  }

  async function resetPassword(userId: string): Promise<void> {
    if (!token) return;
    const newPassword = window.prompt(t("admin_users.new_password_prompt"));
    if (!newPassword) return;
    if (newPassword.length < 8) {
      setError(t("admin_users.password_too_short"));
      return;
    }
    setResettingUserId(userId);
    setError(null);
    try {
      await apiFetch<ApiUser>(`/users/${userId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ password: newPassword }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin_users.failed_to_update"));
    } finally {
      setResettingUserId(null);
    }
  }

  async function banUser(userId: string): Promise<void> {
    if (!token) return;
    if (!window.confirm(t("admin_users.confirm_ban"))) return;
    setBanningUserId(userId);
    setError(null);
    try {
      await apiFetch<{ detail: string }>(`/users/${userId}`, {
        method: "DELETE",
        token,
      });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin_users.failed_to_ban"));
    } finally {
      setBanningUserId(null);
    }
  }

  function roleNameFromId(roleId: string): string {
    return roles.find((r) => r.id === roleId)?.nume ?? roleId;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold text-text">{t("admin_users.title")}</h1>
      {error && (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="rounded-xl border border-border">
        <div className="space-y-3 bg-surface p-4 md:hidden">
          {loading && users.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface-raised px-4 py-6 text-center text-sm text-muted">
              {t("common.loading")}
            </p>
          ) : (
            users.map((u) => (
              <article key={u.id} className="rounded-xl border border-border bg-surface-raised p-4">
                <input
                  value={drafts[u.id]?.nume ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: { ...(prev[u.id] ?? makeDraft(u)), nume: e.target.value },
                    }))
                  }
                  placeholder={t("admin_users.name")}
                  className="mb-2 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
                />
                <input
                  value={drafts[u.id]?.email ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: { ...(prev[u.id] ?? makeDraft(u)), email: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
                />
                <p className="mt-2 text-xs text-muted capitalize">
                  {t("admin_users.role")}: {roleNameFromId(drafts[u.id]?.rol_id ?? u.rol_id)}
                </p>
                <select
                  value={drafts[u.id]?.rol_id ?? u.rol_id}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: { ...(prev[u.id] ?? makeDraft(u)), rol_id: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nume}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted">
                  {t("admin_users.joined")}: {new Date(u.created_at).toLocaleDateString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => void saveUser(u.id)}
                    className="rounded-lg border border-border px-3 py-1 text-xs text-text hover:bg-surface-muted"
                  >
                    {savingUserId === u.id ? t("admin_users.saving") : t("admin_users.save")}
                  </button>
                  <button
                    onClick={() => void resetPassword(u.id)}
                    className="rounded-lg border border-border px-3 py-1 text-xs text-text hover:bg-surface-muted"
                  >
                    {resettingUserId === u.id ? t("admin_users.resetting_password") : t("admin_users.reset_password")}
                  </button>
                  <button
                    onClick={() => void banUser(u.id)}
                    className="rounded-lg border border-danger/40 px-3 py-1 text-xs text-danger hover:bg-danger-bg"
                  >
                    {banningUserId === u.id ? t("admin_users.banning") : t("admin_users.ban")}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-raised">
            <tr>
              <th className="px-4 py-3 text-left text-muted font-medium">{t("admin_users.name")}</th>
              <th className="px-4 py-3 text-left text-muted font-medium">{t("admin_users.email")}</th>
              <th className="px-4 py-3 text-left text-muted font-medium">{t("admin_users.role")}</th>
              <th className="px-4 py-3 text-left text-muted font-medium">{t("admin_users.joined")}</th>
              <th className="px-4 py-3 text-left text-muted font-medium">{t("admin_users.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  {t("common.loading")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    <input
                      value={drafts[u.id]?.nume ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...(prev[u.id] ?? makeDraft(u)), nume: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-text"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={drafts[u.id]?.email ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...(prev[u.id] ?? makeDraft(u)), email: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-text"
                    />
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">
                    <select
                      value={drafts[u.id]?.rol_id ?? u.rol_id}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [u.id]: { ...(prev[u.id] ?? makeDraft(u)), rol_id: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-surface-raised px-2 py-1 text-sm text-text"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.nume}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void saveUser(u.id)}
                        className="rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-surface-muted"
                      >
                        {savingUserId === u.id ? t("admin_users.saving") : t("admin_users.save")}
                      </button>
                      <button
                        onClick={() => void resetPassword(u.id)}
                        className="rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-surface-muted"
                      >
                        {resettingUserId === u.id ? t("admin_users.resetting_password") : t("admin_users.reset_password")}
                      </button>
                      <button
                        onClick={() => void banUser(u.id)}
                        className="rounded-lg border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-bg"
                      >
                        {banningUserId === u.id ? t("admin_users.banning") : t("admin_users.ban")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      {cursor && (
        <div className="mt-6 text-center">
          <button
            onClick={() => void loadMore(cursor, false)}
            disabled={loading}
            className="w-full rounded-full border border-border px-4 py-2 text-sm text-text hover:bg-surface-muted disabled:opacity-50 sm:w-auto"
          >
            {loading ? t("common.loading") : t("admin_users.load_more")}
          </button>
        </div>
      )}
    </main>
  );
}
