export const runtime = "nodejs";

import { AIRFLOW_BASE, getCookieCached, isSameOrigin } from "@/lib/airflow-auth";

export async function GET(req: Request) {
  if (!isSameOrigin(req)) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return new Response("Missing ?path=", { status: 400 });

  const clean = path.replace(/^\/+/, "");
  const upstreamUrl = new URL(`/static/${clean}`, AIRFLOW_BASE).toString();

  const cookie = await getCookieCached();
  const upstream = await fetch(upstreamUrl, {
    headers: {
      cookie,
      "accept-encoding": "identity",
    },
  });

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

  return new Response(upstream.body, { status: 200, headers: outHeaders });
}
