import type { Metadata } from "next";
import { FinalPrototypeShell } from "@/components/final-prototype/FinalPrototypeShell";
import { getTypeNavItems } from "@/lib/payload-content";
import "./final-prototype.css";

export const metadata: Metadata = {
  title: "Final Prototype | Thai PBS",
  description: "The final Thai PBS prototype workspace.",
};

export default async function FinalPrototypeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const typeNavItems = await getTypeNavItems();

  return (
    <html lang="th">
      <body>
        <FinalPrototypeShell typeNavItems={typeNavItems}>{children}</FinalPrototypeShell>
      </body>
    </html>
  );
}
