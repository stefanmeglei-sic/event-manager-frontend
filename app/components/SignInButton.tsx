"use client";

import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api/client";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type NotificationItem = {
  id: string;
  user_id: string;
  eveniment_id: string | null;
  mesaj: string;
  is_read: boolean;
  created_at: string | null;
};

export function SignInButton() {
  const { user, isLoading, error, login, logout } = useAuth();
  const { t } = useLocale();

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  function getLandingPath(role: string): string {
    if (role === "admin") return "/admin/reports";
    if (role === "organizer") return "/organizer";
    return "/events";
  }

  const loadNotifications = useCallback(async (): Promise<void> => {
    if (!user) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const rows = await apiFetch<NotificationItem[]>("/notifications?limit=8");
      setNotifications(rows);
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : t("nav.failed_to_load_notifications"));
    } finally {
      setNotificationsLoading(false);
    }
  }, [user, t]);

  async function markAllRead(): Promise<void> {
    setMarkingRead(true);
    try {
      await apiFetch<{ detail: string }>("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : t("nav.failed_to_load_notifications"));
    } finally {
      setMarkingRead(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    const timerId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [user, loadNotifications]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent): void {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setAdminMenuOpen(false);
      setUserMenuOpen(false);
      setNotificationsOpen(false);
    }

    function onEscape(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      setAdminMenuOpen(false);
      setUserMenuOpen(false);
      setNotificationsOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((sum, n) => sum + (n.is_read ? 0 : 1), 0),
    [notifications],
  );

  if (user) {
    const displayName = (user.role === "organizer" || user.role === "admin") && user.nume ? user.nume : user.email;

    return (
      <div ref={wrapperRef} className="relative flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
        <Link
          href={getLandingPath(user.role)}
          className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text transition hover:bg-surface-muted sm:text-xs"
        >
          {t("nav.home")}
        </Link>

        {(user.role === "admin" || user.role === "organizer") && (
          <Link
            href="/events/new"
            className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text transition hover:bg-surface-muted sm:text-xs"
          >
            {t("nav.new_event")}
          </Link>
        )}

        {user.role === "organizer" && (
          <Link
            href="/organizer"
            className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text transition hover:bg-surface-muted sm:text-xs"
          >
            {t("nav.my_events")}
          </Link>
        )}

        {user.role === "admin" && (
          <div className="relative">
            <button
              onClick={() => {
                setAdminMenuOpen((prev) => !prev);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text transition hover:bg-surface-muted sm:text-xs"
            >
              {t("nav.admin")}
            </button>
            {adminMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-surface p-2 shadow-lg">
                <Link href="/admin/events" className="block rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => setAdminMenuOpen(false)}>
                  {t("nav.admin_events")}
                </Link>
                <Link href="/admin/lookups" className="block rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => setAdminMenuOpen(false)}>
                  {t("nav.lookups")}
                </Link>
                <Link href="/admin/locations" className="block rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => setAdminMenuOpen(false)}>
                  {t("nav.locations")}
                </Link>
                <Link href="/admin/users" className="block rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => setAdminMenuOpen(false)}>
                  {t("nav.users")}
                </Link>
                <Link href="/admin/reports" className="block rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => setAdminMenuOpen(false)}>
                  {t("nav.reports")}
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setAdminMenuOpen(false);
              setUserMenuOpen(false);
            }}
            className="relative rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text transition hover:bg-surface-muted sm:text-xs"
          >
            {t("nav.notifications")}
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-on-primary">
                {unreadCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-surface p-2 shadow-lg">
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <p className="text-xs font-semibold text-text">{t("nav.notifications")}</p>
                <button
                  onClick={() => void markAllRead()}
                  disabled={markingRead || notifications.length === 0}
                  className="rounded-lg border border-border px-2 py-1 text-[11px] text-text disabled:opacity-60"
                >
                  {markingRead ? t("common.loading") : t("nav.mark_all_read")}
                </button>
              </div>

              {notificationsLoading ? (
                <p className="px-2 py-3 text-xs text-muted">{t("nav.loading_notifications")}</p>
              ) : notificationsError ? (
                <p className="px-2 py-3 text-xs text-danger">{notificationsError}</p>
              ) : notifications.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted">{t("nav.no_notifications")}</p>
              ) : (
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg px-2 py-2 text-xs ${item.is_read ? "bg-surface-raised text-muted" : "bg-surface-muted text-text"}`}
                    >
                      <p>{item.mesaj}</p>
                      {item.created_at && (
                        <p className="mt-1 text-[10px] text-subtle">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen((prev) => !prev);
              setAdminMenuOpen(false);
              setNotificationsOpen(false);
            }}
            className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text transition hover:bg-surface-muted sm:max-w-[220px] sm:text-xs"
            title={`${displayName} (${user.role})`}
          >
            <span className="truncate">{displayName}</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-surface p-2 shadow-lg">
              <p className="px-3 py-2 text-[11px] text-muted">{user.role}</p>
              <Link href="/profile" className="block rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => setUserMenuOpen(false)}>
                {t("nav.profile")}
              </Link>
              <button
                onClick={logout}
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-danger hover:bg-danger-bg"
              >
                {t("nav.sign_out")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!GOOGLE_CLIENT_ID) {
    return <p className="text-xs text-rose-600">{t("auth.google_missing_client_id")}</p>;
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      {isLoading ? (
        <span className="text-sm text-slate-500">{t("auth.signing_in")}</span>
      ) : (
        <GoogleLogin
          onSuccess={(cred) => {
            if (cred.credential) {
              login(cred.credential).catch(() => undefined);
            }
          }}
          onError={() => undefined}
          size="medium"
          shape="pill"
          text="signin_with"
        />
      )}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
