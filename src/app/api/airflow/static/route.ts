export const runtime = "nodejs";

import { fetchAirflow, getCookieCached, isSameOrigin, resolveAirflowStaticUrl } from "@/lib/airflow-auth";

function isDirectNavigation(req: Request) {
  const fetchDest = req.headers.get("sec-fetch-dest")?.toLowerCase();
  const fetchMode = req.headers.get("sec-fetch-mode")?.toLowerCase();

  return fetchDest === "document" || fetchMode === "navigate";
}

function isServerImageOptimizerFetch(req: Request) {
  return (
    !req.headers.get("origin") &&
    !req.headers.get("referer") &&
    !req.headers.get("sec-fetch-dest") &&
    !req.headers.get("sec-fetch-mode") &&
    !req.headers.get("sec-fetch-site")
  );
}

export async function GET(req: Request) {
  if (isDirectNavigation(req)) return new Response("Forbidden", { status: 403 });
  if (!isSameOrigin(req) && !isServerImageOptimizerFetch(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return new Response("Missing ?path=", { status: 400 });

  // Only relative paths are accepted here; resolve them under /static/ on the
  // Airflow origin and reject anything that escapes it (e.g. "../api/...").
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) {
    return new Response("Invalid path", { status: 400 });
  }
  const resolved = resolveAirflowStaticUrl(path);
  if (!resolved) return new Response("Invalid path", { status: 400 });
  const upstreamUrl = resolved.toString();

  let upstream: Response;
  try {
    const cookie = await getCookieCached();
    upstream = await fetchAirflow(upstreamUrl, {
      headers: {
        cookie,
        "accept-encoding": "identity",
      },
      redirect: "manual",
    });
  } catch (e) {
    console.error("Airflow static proxy failed", e);
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

  return new Response(upstream.body, { status: 200, headers: outHeaders });
}
