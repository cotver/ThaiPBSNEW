import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { CinematicGlobal } from "@/components/cinema/CinematicGlobal";
import { getStudiosShowcaseData } from "@/components/StudiosShowcase";
import { watchlistNavigationEnabled } from "@/lib/feature-flags";
import { getColumnNavItems, getTypeNavItems } from "@/lib/payload-content";
import "../globals.css";
import "./responsive.css";
import "./cinematic.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  title: "ThaiPBS Parvilions",
  description:
    "A ThaiPBS Parvilions streaming homepage built with Next.js 16 and Tailwind CSS.",
};

export default async function RootLayout({
  children,
  marketEventModal,
}: Readonly<{
  children: React.ReactNode;
  marketEventModal: React.ReactNode;
}>) {
  const [typeNavItems, columnNavItems, showcase] = await Promise.all([
    getTypeNavItems(), getColumnNavItems(), getStudiosShowcaseData(),
  ]);
  // Match the homepage showcase's rendering conditions, using its cached data.
  const availableStudiosHrefs = [
    ...[...showcase.categories, ...showcase.otherCategories].map((category) => `/studios/${encodeURIComponent(category.slug)}`),
    ...(showcase.pressReleases.length ? ["/studios/news/press-releases"] : []),
    ...(showcase.marketCompanies.length ? ["/studios/news/content-distribution"] : []),
    ...(showcase.marketEventGroups.length ? ["/studios/events"] : []),
  ];
  if (showcase.featuredArticles.length || availableStudiosHrefs.length) {
    availableStudiosHrefs.unshift("/home#studios");
  }

  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col" data-responsive-site>
        <AppShell availableStudiosHrefs={availableStudiosHrefs} columnNavItems={columnNavItems} showWatchlist={watchlistNavigationEnabled()} typeNavItems={typeNavItems}>
          {children}
          {marketEventModal}
          <CinematicGlobal />
        </AppShell>
      </body>
    </html>
  );
}
