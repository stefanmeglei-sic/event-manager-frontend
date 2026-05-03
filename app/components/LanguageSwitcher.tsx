"use client";

import type { Locale } from "@/lib/i18n/config";

import { useLocale } from "./LocaleProvider";

const LOCALES: Locale[] = ["ro", "en"];

export function LanguageSwitcher(): React.JSX.Element {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-raised p-1">
      {LOCALES.map((option) => {
        const active = option === locale;
        const title = option === "ro" ? t("locale.switch_to_romanian") : t("locale.switch_to_english");

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={active}
            aria-label={title}
            title={title}
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold transition",
              active ? "bg-primary text-on-primary" : "text-text hover:bg-surface-muted",
            ].join(" ")}
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}