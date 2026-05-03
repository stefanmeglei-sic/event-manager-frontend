"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Locale } from "@/lib/i18n/config";

import { LocaleProvider } from "./LocaleProvider";
import { AuthProvider } from "./AuthProvider";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <LocaleProvider initialLocale={initialLocale}>
        <AuthProvider>{children}</AuthProvider>
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>{children}</AuthProvider>
      </GoogleOAuthProvider>
    </LocaleProvider>
  );
}
