export const runtime = "nodejs";

import { getCookieCached, isSameOrigin } from "@/lib/airflow-auth";

function isDirectNavigation(req: Request): boolean {
  const fetchDest = req.headers.get("sec-fetch-dest")?.toLowerCase();
  const fetchMode = req.headers.get("sec-fetch-mode")?.toLowerCase();

  return fetchDest === "document" || fetchMode === "navigate";
}

/**
 * GET /api/airflow/video?url=<encoded-full-url>
 * Proxies video request to Airflow static URL with auth cookie.
 * Only allows same-origin requests (no direct link access).
 */
export async function GET(req: Request) {
  if (isDirectNavigation(req)) return new Response("Forbidden", { status: 403 });
  if (!isSameOrigin(req)) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return new Response("Missing ?url=", { status: 400 });

  let upstreamUrl: string;
  try {
    upstreamUrl = decodeURIComponent(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  const range = req.headers.get("range");
  const requestHeaders: HeadersInit = {
    cookie: await getCookieCached(),
    "accept-encoding": "identity",
  };
  if (range) requestHeaders["range"] = range;

  const upstream = await fetch(upstreamUrl, { headers: requestHeaders });

  if (!upstream.ok) {
    const txt = await upstream.text().catch(() => "");
    return new Response(
      `Upstream ${upstream.status}\n\n${txt}`.slice(0, 1000),
      {
        status: upstream.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }
    );
  }

  const outHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) outHeaders.set("content-type", ct);
  outHeaders.set("cache-control", "private, max-age=60");

  const status = upstream.status;
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) outHeaders.set("content-range", contentRange);
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) outHeaders.set("accept-ranges", acceptRanges);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) outHeaders.set("content-length", contentLength);

  return new Response(upstream.body, { status, headers: outHeaders });
}
