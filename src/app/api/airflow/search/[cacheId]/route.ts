export const runtime = "nodejs";

import {
  AIRFLOW_BASE,
  getCookieCached,
  clearCookieCache,
  fetchAirflow,
  hasCmsUser,
  isSameOrigin,
} from "@/lib/airflow-auth";

function intParam(value: string | null, fallback: number, min: number, max: number): string {
  const n = Number.parseInt(value ?? "", 10);
  return String(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ cacheId: string }> }
) {
  if (!isSameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!(await hasCmsUser(req))) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { cacheId } = await ctx.params;
    // ".." survives encodeURIComponent and would resolve to a parent path.
    if (!/^(?!\.+$)[A-Za-z0-9._-]{1,128}$/.test(cacheId)) {
      return Response.json({ error: "Invalid cacheId" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);

    const sortOrder = searchParams.get("sort_order");
    const sortBy = searchParams.get("sort_by");
    const qs = new URLSearchParams({
      start: intParam(searchParams.get("start"), 0, 0, 100000),
      max_results: intParam(searchParams.get("max_results"), 50, 1, 200),
      wait_for_results: searchParams.get("wait_for_results") === "false" ? "false" : "true",
      wait_timeout: intParam(searchParams.get("wait_timeout"), 31, 1, 60),
      sort_by: sortBy && /^[A-Z_]{1,40}$/.test(sortBy) ? sortBy : "MODIFIED",
      sort_order: sortOrder === "ascending" ? "ascending" : "descending",
    });

    const upstreamUrl = new URL(
      `/api/v2/search/cached/${encodeURIComponent(cacheId)}?${qs.toString()}`,
      AIRFLOW_BASE
    ).toString();

    const doFetch = (cookieHeader: string) =>
      fetchAirflow(upstreamUrl, {
        method: "GET",
        headers: {
          cookie: cookieHeader,
          "x-requested-with": "XMLHttpRequest",
          accept: "application/json",
        },
      }, 75_000); // Airflow may hold the response for up to wait_timeout (max 60s).

    let upstream = await doFetch(await getCookieCached());

    if (upstream.status === 401) {
      clearCookieCache();
      upstream = await doFetch(await getCookieCached());
    }

    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 1000) };
    }
    return Response.json(
      { upstreamStatus: upstream.status, data },
      { status: upstream.status }
    );
  } catch (e: unknown) {
    console.error("Airflow search results failed", e);
    return Response.json({ error: "Airflow search failed" }, { status: 502 });
  }
}
