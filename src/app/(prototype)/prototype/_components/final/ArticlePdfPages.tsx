"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import styles from "./ArticlePdfPages.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type ArticlePdfPagesProps = {
  file: string;
  title?: string;
};

export function ArticlePdfPages({ file, title = "Article PDF" }: ArticlePdfPagesProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>();
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const element = pagesRef.current;
    if (!element) return;

    const updateWidth = () => {
      setPageWidth(Math.max(1, Math.floor(element.getBoundingClientRect().width)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.viewer} aria-label={title + " pages"}>
      <div className={styles.pages} ref={pagesRef}>
        <Document
          className={styles.document}
          error={
            <div className={styles.state}>
              <p>Unable to render this PDF as pages.</p>
              <a href={file} rel="noreferrer" target="_blank">Open the original PDF</a>
            </div>
          }
          file={file}
          loading={
            <div aria-label="Loading article pages" className={styles.loading} role="status">
              <span aria-hidden="true" className={styles.spinner} />
            </div>
          }
          onLoadSuccess={({ numPages }) => setPageCount(numPages)}
        >
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <article className={styles.page} key={pageNumber}>
                <Page
                  error={<div className={styles.pageState}>Unable to render this page.</div>}
                  loading={<div className={styles.pageState}>Loading page {pageNumber}…</div>}
                  pageNumber={pageNumber}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  width={pageWidth}
                />
              </article>
            );
          })}
        </Document>
      </div>
    </section>
  );
}
