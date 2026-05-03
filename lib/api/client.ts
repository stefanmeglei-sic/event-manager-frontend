import { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY, getDefaultLocale, normalizeLocale } from "@/lib/i18n/config";

type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  token?: string;
  locale?: string;
  headers?: Record<string, string>;
};

function getLocale(override?: string): string {
  if (override) return override;
  // Server-side: no access to window/document, return default
  if (typeof window === 'undefined') return getDefaultLocale();
  // Client-side: prefer localStorage, fall back to cookie, then default
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored) return normalizeLocale(stored);
  const cookie = document.cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split('=', 2)[1];
  return normalizeLocale(cookie ?? getDefaultLocale());
}

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: prefer internal Docker/network URL
    return (
      process.env.BACKEND_INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8000/api/v1'
    );
  }
  // Client-side: must be browser-reachable (NEXT_PUBLIC_BROWSER_API_URL is
  // baked at build time to the public host, e.g. http://localhost:8000/api/v1)
  return (
    process.env.NEXT_PUBLIC_BROWSER_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000/api/v1'
  );
}

export async function apiFetch<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Locale': getLocale(options?.locale),
    ...(options?.headers ?? {}),
  };

  // Use explicitly provided token, or read from localStorage on client
  let token = options?.token;
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token') ?? undefined;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { token: tokenOption, locale: localeOption, headers: headersOption, ...restOptions } = options ?? {};
  void tokenOption;
  void localeOption;
  void headersOption;

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) errorDetail = body.detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}
