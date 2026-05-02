"use client";

import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function SignInButton() {
  const { user, isLoading, error, login, logout } = useAuth();

  function getLandingPath(role: string): string {
    if (role === "admin") return "/admin/reports";
    if (role === "organizer") return "/organizer";
    return "/events";
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={getLandingPath(user.role)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
        >
          Home
        </Link>
        {(user.role === "admin" || user.role === "organizer") && (
          <Link
            href="/events/new"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
          >
            New event
          </Link>
        )}
        {user.role === "admin" && (
          <Link
            href="/admin/locations"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
          >
            Locations
          </Link>
        )}
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
          >
            Users
          </Link>
        )}
        {user.role === "admin" && (
          <Link
            href="/admin/reports"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
          >
            Reports
          </Link>
        )}
        {user.role === "organizer" && (
          <Link
            href="/organizer"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
          >
            My Events
          </Link>
        )}
        <Link
          href="/profile"
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
        >
          Profile
        </Link>
        <span className="max-w-[200px] truncate text-sm text-muted" title={user.email}>
          {user.email} ({user.role})
        </span>
        <button
          onClick={logout}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-muted"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-xs text-rose-600">
        Google auth is not configured: missing NEXT_PUBLIC_GOOGLE_CLIENT_ID.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isLoading ? (
        <span className="text-sm text-slate-500">Signing in…</span>
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
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
