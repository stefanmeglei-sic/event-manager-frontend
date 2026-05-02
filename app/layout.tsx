import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-surface/90 px-6 py-3 backdrop-blur md:px-10">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-text transition hover:text-primary"
            >
              Event Manager
            </Link>
            <SignInButton />
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
