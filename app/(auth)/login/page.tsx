"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage(): React.JSX.Element {
  const { loginEmail, login, isLoading, error } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    try {
      await loginEmail(email, password);
      router.push("/events");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  }

  async function handleGoogleSuccess(credential: string): Promise<void> {
    setLocalError(null);
    try {
      await login(credential);
      router.push("/events");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  const displayError = localError ?? error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Event Manager
            </h1>
            <p className="mt-1 text-sm text-muted">
              University Event Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text"
              >
                Email
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
                Password
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
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-subtle">or</span>
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
                setLocalError("Google sign-in failed. Please try again.")
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
