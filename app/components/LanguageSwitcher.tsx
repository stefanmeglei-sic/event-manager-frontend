"use client";

import { useLocale } from "./LocaleProvider";

export function LanguageSwitcher(): React.JSX.Element {
  const { locale, setLocale, t } = useLocale();

  const next = locale === "ro" ? "en" : "ro";
  const label = locale === "ro" ? t("locale.switch_to_english") : t("locale.switch_to_romanian");

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={label}
      title={label}
      className="text-xs font-semibold tracking-wide text-primary transition hover:text-primary-hover"
    >
      {locale.toUpperCase()}
    </button>
  );
}