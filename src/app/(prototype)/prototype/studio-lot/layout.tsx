import type { Metadata } from "next";
import { LotCursor } from "./_components/LotCursor";
import { LotHeader } from "./_components/LotHeader";
import { plexThai } from "./_lib/font";
import styles from "./studio-lot.module.css";

export const metadata: Metadata = {
  title: { default: "Studio Lot — Thai PBS Programme Market", template: "%s · Studio Lot · Thai PBS" },
  description: "Walk the Thai PBS catalogue as a gallery: every home page section, hung room by room.",
};

export default function StudioLotLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${plexThai.variable} ${styles.root}`}>
      <LotHeader />
      {children}
      <LotCursor />
    </div>
  );
}
