import type { Metadata, Viewport } from "next";
import "../globals.css";
import "../(site)/responsive.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  title: "ThaiPBS Parvilions",
  description: "Explore Thai PBS Parvilions.",
};

export default function EntranceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body data-responsive-entrance>{children}</body>
    </html>
  );
}
