"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Public site route failed", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-20 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl sm:p-12">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Thai PBS Pavilions</p>
        <h1 className="mt-4 text-3xl font-black sm:text-5xl">We could not open this page</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-white/65">
          The problem may be temporary. Try loading the page again, or return to the homepage.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
            onClick={() => unstable_retry()}
            type="button"
          >
            Try again
          </button>
          <Link
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
            href="/home"
          >
            Go home
          </Link>
        </div>
        {error.digest ? <p className="mt-6 text-xs text-white/35">Error reference: {error.digest}</p> : null}
      </section>
    </main>
  );
}
