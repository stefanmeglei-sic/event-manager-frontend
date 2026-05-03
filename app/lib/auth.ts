import { getStoredLocale } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary, translate } from "@/lib/i18n/shared";

export interface AuthUser {
  id: string;
  token: string;
  email: string;
  nume?: string | null;
  role: string;
}

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BROWSER_API_URL) {
    return process.env.NEXT_PUBLIC_BROWSER_API_URL;
  }
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

async function fetchToken(
  path: string,
  body: Record<string, string>,
  locale?: Locale,
): Promise<string> {
  const resolvedLocale = locale ?? getStoredLocale();
  const dictionary = getDictionary(resolvedLocale);
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Locale": resolvedLocale,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    throw new Error(error.detail || translate(dictionary, "errors.auth.authentication_failed"));
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function fetchMe(token: string, locale?: Locale): Promise<AuthUser> {
  const resolvedLocale = locale ?? getStoredLocale();
  const dictionary = getDictionary(resolvedLocale);
  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Locale": resolvedLocale,
    },
  });
  if (!response.ok) {
    throw new Error(translate(dictionary, "errors.auth.failed_to_fetch_user_info"));
  }
  const user = (await response.json()) as {
    id: string;
    email: string;
    nume?: string | null;
    role: string;
  };
  return { id: user.id, token, email: user.email, nume: user.nume, role: user.role };
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
  locale?: Locale,
): Promise<AuthUser> {
  const token = await fetchToken("/auth/login", { email, password }, locale);
  return fetchMe(token, locale);
}

export async function loginWithGoogleToken(idToken: string, locale?: Locale): Promise<AuthUser> {
  const token = await fetchToken("/auth/google", { id_token: idToken }, locale);
  return fetchMe(token, locale);
}
