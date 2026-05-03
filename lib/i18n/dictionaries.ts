import en from "../../locales/en.json";
import ro from "../../locales/ro.json";

import type { Locale } from "./config";

export type Dictionary = typeof ro;

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  ro,
};