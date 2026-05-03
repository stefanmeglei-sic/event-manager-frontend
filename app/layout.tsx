import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary, translate } from "@/lib/i18n/shared";
import "./globals.css";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { Providers } from "./components/Providers";
import { SignInButton } from "./components/SignInButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Manager API Console",
  description: "Frontend dashboard for exploring the Event Manager backend OpenAPI spec",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers initialLocale={locale}>
          <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-surface/90 px-6 py-3 backdrop-blur md:px-10">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-text transition hover:text-primary"
            >
              {translate(dictionary, "app.name")}
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <SignInButton />
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
