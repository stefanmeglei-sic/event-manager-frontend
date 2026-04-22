"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthProvider";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function SignInButton() {
  const { user, isLoading, error, login, logout } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="max-w-[200px] truncate text-sm text-slate-600" title={user.email}>
          {user.email}
        </span>
        <button
          onClick={logout}
          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
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
