import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "../globals.css";

export const metadata: Metadata = {
  title: "Stream+ | Movie Streaming UI",
  description:
    "A Disney+-inspired movie streaming homepage built with Next.js 16 and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
