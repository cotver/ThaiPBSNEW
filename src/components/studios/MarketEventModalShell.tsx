'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from '../MarketEvents.module.css';

/** The routed modal for Market & Events, also used by Contact Information (wider, via dialogClassName). */
export function MarketEventModalShell({
  children,
  closeLabel = "Close Market & Events",
  dialogClassName,
  title,
}: {
  children: ReactNode;
  closeLabel?: string;
  dialogClassName?: string;
  title: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [close, mounted]);

  if (!mounted) return null;
  return createPortal(
    <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div aria-label={title} aria-modal="true" className={dialogClassName ? `${styles.dialog} ${dialogClassName}` : styles.dialog} ref={dialogRef} role="dialog" tabIndex={-1}>
        <button aria-label={closeLabel} className={styles.close} onClick={close} type="button">×</button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
