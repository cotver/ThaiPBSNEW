export const runtime = "nodejs";

import { fetchAirflow, getCookieCached, isSameOrigin, resolveAirflowStaticUrl } from "@/lib/airflow-auth";

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

  // searchParams.get() already decoded the value once. Only decode again for
  // legacy links that were double-encoded (e.g. "https%3A%2F%2F...").
  let rawUrl = url;
  if (!/^https?:\/\//i.test(rawUrl)) {
    try {
      rawUrl = decodeURIComponent(rawUrl);
    } catch {
      return new Response("Invalid url", { status: 400 });
    }
  }

  const resolved = resolveAirflowStaticUrl(rawUrl);
  if (!resolved) return new Response("Invalid url", { status: 400 });
  const upstreamUrl = resolved.toString();

  const range = req.headers.get("range");

  let upstream: Response;
  try {
    const requestHeaders: Record<string, string> = {
      cookie: await getCookieCached(),
      "accept-encoding": "identity",
    };
    if (range) requestHeaders["range"] = range;
    upstream = await fetchAirflow(upstreamUrl, { headers: requestHeaders, redirect: "manual" });
  } catch (e) {
    console.error("Airflow video proxy failed", e);
    return new Response("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok) {
    await upstream.body?.cancel().catch(() => {});
    return new Response(`Upstream ${upstream.status}`, {
      status: upstream.status >= 400 ? upstream.status : 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const outHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) outHeaders.set("content-type", ct);
  outHeaders.set("cache-control", "private, max-age=60");
  // Served from our origin: never let proxied content run as a document.
  outHeaders.set("x-content-type-options", "nosniff");
  outHeaders.set("content-security-policy", "default-src 'none'; sandbox");

  const status = upstream.status;
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) outHeaders.set("content-range", contentRange);
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) outHeaders.set("accept-ranges", acceptRanges);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) outHeaders.set("content-length", contentLength);

  return new Response(upstream.body, { status, headers: outHeaders });
}
