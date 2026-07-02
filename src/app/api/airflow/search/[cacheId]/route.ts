export const runtime = "nodejs";

import {
  AIRFLOW_BASE,
  getCookieCached,
  clearCookieCache,
  isSameOrigin,
} from "@/lib/airflow-auth";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ cacheId: string }> }
) {
  if (!isSameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { cacheId } = await ctx.params;

    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start") ?? "0";
    const max_results = searchParams.get("max_results") ?? "50";
    const wait_for_results = searchParams.get("wait_for_results") ?? "true";
    const wait_timeout = searchParams.get("wait_timeout") ?? "31";
    const sort_by = searchParams.get("sort_by") ?? "MODIFIED";
    const sort_order = searchParams.get("sort_order") ?? "descending";

    const qs = new URLSearchParams({
      start,
      max_results,
      wait_for_results,
      wait_timeout,
      sort_by,
      sort_order,
    });

    const upstreamUrl = new URL(
      `/api/v2/search/cached/${encodeURIComponent(cacheId)}?${qs.toString()}`,
      AIRFLOW_BASE
    ).toString();

    let cookie = await getCookieCached();

    const doFetch = (cookieHeader: string) =>
      fetch(upstreamUrl, {
        method: "GET",
        headers: {
          cookie: cookieHeader,
          "x-requested-with": "XMLHttpRequest",
          accept: "application/json",
        },
      });

    let upstream = await doFetch(cookie);

    if (upstream.status === 401) {
      clearCookieCache();
      cookie = await getCookieCached();
      upstream = await doFetch(cookie);
    }

    const data = await upstream.json().catch(async () => ({
      raw: await upstream.text(),
    }));
    return Response.json(
      { upstreamStatus: upstream.status, data },
      { status: upstream.status }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }
}
