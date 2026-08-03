import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { getTypeNavItems } from "@/lib/payload-content";
import "../globals.css";
import "./prototype.css";

export const metadata: Metadata = {
  title: "Program Prototype | Thai PBS",
  description: "A standalone visual prototype for the Thai PBS program catalog.",
};

export default async function PrototypeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const typeNavItems = await getTypeNavItems();

  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full bg-[#030714] text-white">
        <AppShell typeNavItems={typeNavItems}>{children}</AppShell>
      </body>
    </html>
  );
}
