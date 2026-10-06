import type { Metadata } from "next";
import { LotChrome } from "@/components/studio/LotChrome";

export const metadata: Metadata = {
  title: { default: "Studio Lot — Thai PBS Programme Market", template: "%s · Studio Lot · Thai PBS" },
  description: "Walk the Thai PBS catalogue as a gallery: every home page section, hung room by room.",
};

/**
 * The Studio Lot: the gallery and its own pages (programmes, newsroom, shortlist), in the gallery's chrome.
 * `lotModal` shows the pages it links to over it (see @lotModal), so the 3D walk never reloads.
 */
export default function StudioLotLayout({ children, lotModal }: Readonly<{ children: React.ReactNode; lotModal: React.ReactNode }>) {
  return (
    <LotChrome>
      {children}
      {lotModal}
    </LotChrome>
  );
}
