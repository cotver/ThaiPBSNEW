import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { watchlistNavigationEnabled } from "@/lib/feature-flags";
import { getColumnNavItems, getTypeNavItems } from "@/lib/payload-content";
import "../globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppShell columnNavItems={columnNavItems} showWatchlist={watchlistNavigationEnabled()} typeNavItems={typeNavItems}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
