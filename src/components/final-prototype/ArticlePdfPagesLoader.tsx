"use client";

import dynamic from "next/dynamic";
import type { ArticlePdfPagesProps } from "./ArticlePdfPages";
import styles from "./ArticlePdfPages.module.css";

const ClientArticlePdfPages = dynamic<ArticlePdfPagesProps>(
  () => import("./ArticlePdfPages").then((module) => module.ArticlePdfPages),
  {
    loading: () => (
      <div aria-label="Loading article pages" className={styles.loading} role="status">
        <span aria-hidden="true" className={styles.spinner} />
      </div>
    ),
    ssr: false,
  },
);

export function ArticlePdfPagesLoader(props: ArticlePdfPagesProps) {
  return <ClientArticlePdfPages {...props} />;
}
