import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { AppProviders } from "@/components/layout/app-providers";
import { getCurrentLocale } from "@/i18n/server";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const headingFont = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "WORLD MOTORSPORT MANAGER",
  description: "AAA-indie motorsport management simulation experience.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();

  return (
    <html lang={locale} className={`${bodyFont.variable} ${headingFont.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
