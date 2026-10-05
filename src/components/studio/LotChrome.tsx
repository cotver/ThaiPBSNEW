import { plexThai } from "@/lib/studio/font";
import { LotCursor } from "./LotCursor";
import { LotHeader } from "./LotHeader";
import styles from "./studio-lot.module.css";

/**
 * The Studio Lot's own full-screen chrome — its font, header and cursor — around the gallery on /home
 * and its pages under /home/studio. `data-studio-lot` tells the site shell to step aside (studio-shell.css).
 */
export function LotChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${plexThai.variable} ${styles.root}`} data-studio-lot>
      <LotHeader />
      {children}
      <LotCursor />
    </div>
  );
}
