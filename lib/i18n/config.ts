export const LOCALE_COOKIE_NAME = "event_manager_locale";
export const LOCALE_STORAGE_KEY = "event_manager_locale";

export type Locale = "en" | "ro";

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "ro";
}

export function getDefaultLocale(): Locale {
  return normalizeLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
}