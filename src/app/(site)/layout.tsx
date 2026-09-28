import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { watchlistNavigationEnabled } from "@/lib/feature-flags";
import { getColumnNavItems, getTypeNavItems } from "@/lib/payload-content";
import "../globals.css";
import "./responsive.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  title: "ThaiPBS Parvilions",
  description:
    "A ThaiPBS Parvilions streaming homepage built with Next.js 16 and Tailwind CSS.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [typeNavItems, columnNavItems] = await Promise.all([getTypeNavItems(), getColumnNavItems()]);

  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col" data-responsive-site>
        <AppShell columnNavItems={columnNavItems} showWatchlist={watchlistNavigationEnabled()} typeNavItems={typeNavItems}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
