"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";
import { persistLocale } from "@/lib/i18n/client";
import { getDictionary, translate } from "@/lib/i18n/shared";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}): React.JSX.Element {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    persistLocale(initialLocale);
  }, [initialLocale]);

  const dictionary = getDictionary(locale);

  function setLocale(nextLocale: Locale): void {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
    router.refresh();
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: (key, replacements) => translate(dictionary, key, replacements),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used within <LocaleProvider>");
  }
  return value;
}