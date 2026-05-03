import { dictionaries, type Dictionary } from "./dictionaries";
import { normalizeLocale, type Locale } from "./config";

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function translate(
  dictionary: Dictionary,
  key: string,
  replacements?: Record<string, string | number>,
): string {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dictionary);

  if (typeof value !== "string") {
    return key;
  }

  if (!replacements) {
    return value;
  }

  return Object.entries(replacements).reduce((message, [name, replacement]) => {
    return message.replaceAll(`{${name}}`, String(replacement));
  }, value);
}

export function resolveLocale(locale: string | null | undefined): Locale {
  return normalizeLocale(locale);
}