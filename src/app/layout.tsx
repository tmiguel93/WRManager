import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";

import { AppProviders } from "@/components/layout/app-providers";
import "./globals.css";

const bodyFont = Rajdhani({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const headingFont = Orbitron({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WORLD MOTORSPORT MANAGER",
  description: "AAA-indie motorsport management simulation experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
