"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Application failed", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Thai PBS Pavilions</title>
      </head>
      <body style={{ background: "#030714", color: "white", margin: 0 }}>
        <main
          style={{
            alignItems: "center",
            display: "flex",
            fontFamily: "Arial, sans-serif",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <section style={{ maxWidth: "560px", textAlign: "center" }}>
            <p style={{ color: "#a5f3fc", fontSize: "13px", fontWeight: 800, letterSpacing: "0.16em" }}>
              THAI PBS PAVILIONS
            </p>
            <h1 style={{ fontSize: "clamp(32px, 7vw, 52px)", margin: "18px 0" }}>
              We could not open this page
            </h1>
            <p style={{ color: "#aeb7c8", lineHeight: 1.7 }}>
              The problem may be temporary. Try loading the page again, or return to the homepage.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginTop: "30px" }}>
              <button
                onClick={() => unstable_retry()}
                style={{ border: 0, borderRadius: "999px", cursor: "pointer", fontWeight: 800, padding: "13px 24px" }}
                type="button"
              >
                Try again
              </button>
              <a
                href="/home"
                style={{ border: "1px solid #566174", borderRadius: "999px", color: "white", fontWeight: 800, padding: "12px 24px", textDecoration: "none" }}
              >
                Go home
              </a>
            </div>
            {error.digest ? <p style={{ color: "#657087", fontSize: "12px", marginTop: "24px" }}>Error reference: {error.digest}</p> : null}
          </section>
        </main>
      </body>
    </html>
  );
}
