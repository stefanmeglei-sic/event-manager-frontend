"use client";

import {
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  getDefaultLocale,
  normalizeLocale,
  type Locale,
} from "./config";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return getDefaultLocale();
  }

  const storageLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storageLocale) {
    return normalizeLocale(storageLocale);
  }

  const cookieLocale = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=", 2)[1];

  return normalizeLocale(cookieLocale ?? getDefaultLocale());
}

export function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; SameSite=Lax; max-age=31536000`;
  document.documentElement.lang = locale;
}