import type { Metadata } from "next";
import { LotChrome } from "@/components/studio/LotChrome";

export const metadata: Metadata = {
  title: { default: "Studio Lot — Thai PBS Programme Market", template: "%s · Studio Lot · Thai PBS" },
  description: "Walk the Thai PBS catalogue as a gallery: every home page section, hung room by room.",
};

/** The Studio Lot's own pages (programmes, newsroom, shortlist), in the gallery's chrome. */
export default function StudioLotLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <LotChrome>{children}</LotChrome>;
}
