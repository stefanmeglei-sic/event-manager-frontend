"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { GoogleLogin } from "@react-oauth/google";
import { useLocale } from "../../components/LocaleProvider";

function getLandingPath(role: string): string {
  if (role === "admin") return "/admin/reports";
  if (role === "organizer") return "/organizer";
  return "/events";
}

export default function LoginPage(): React.JSX.Element {
  const { user, loginEmail, login, isLoading, error } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(getLandingPath(user.role));
    }
  }, [user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    try {
      const authUser = await loginEmail(email, password);
      const target = getLandingPath(authUser.role);
      router.replace(target);
      router.refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t("auth.login_failed"));
    }
  }

  async function handleGoogleSuccess(credential: string): Promise<void> {
    setLocalError(null);
    try {
      const authUser = await login(credential);
      const target = getLandingPath(authUser.role);
      router.replace(target);
      router.refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t("auth.google_login_failed"));
    }
  }

  const displayError = localError ?? error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              {t("app.name")}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {t("app.tagline")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text"
              >
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-subtle transition focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                placeholder="you@student.usv.ro"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text"
              >
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-subtle transition focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                placeholder="••••••••"
              />
            </div>

            {displayError && (
              <p className="rounded-lg bg-danger-bg border border-danger/30 px-3 py-2 text-sm text-danger">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
            >
              {isLoading ? t("auth.signing_in") : t("auth.sign_in")}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-subtle">{t("common.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(cred) => {
                if (cred.credential) {
                  handleGoogleSuccess(cred.credential).catch(() => undefined);
                }
              }}
              onError={() =>
                setLocalError(t("auth.google_sign_in_failed"))
              }
              size="large"
              shape="rectangular"
              text="signin_with"
              width="100%"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
