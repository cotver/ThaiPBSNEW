export const runtime = "nodejs";

import {
  AIRFLOW_BASE,
  getCookieCached,
  clearCookieCache,
  fetchAirflow,
  hasCmsUser,
  isSameOrigin,
} from "@/lib/airflow-auth";

const SEARCH_FLAGS = ["clips", "files", "images", "markers", "sequences", "subclips"] as const;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!(await hasCmsUser(req))) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));

    const q: string = String(body.q ?? "").trim().slice(0, 500);
    if (!q) return Response.json({ error: "Missing q" }, { status: 400 });

    const template = String(body.template ?? "Meta Data Team").slice(0, 200);
    const flags: Record<string, unknown> =
      body.flags && typeof body.flags === "object" ? body.flags : {};

    const params = new URLSearchParams();
    params.set("q", q);
    params.set("template", template);
    for (const key of SEARCH_FLAGS) {
      params.set(key, String(key in flags ? Boolean(flags[key]) : true));
    }

    const upstreamUrl = new URL(
      `/api/v2/search/cached?${params.toString()}`,
      AIRFLOW_BASE
    ).toString();

    const upstreamBody = JSON.stringify(
      body.payload && typeof body.payload === "object" ? body.payload : {}
    );
    const doFetch = (cookieHeader: string) =>
      fetchAirflow(upstreamUrl, {
        method: "POST",
        headers: {
          cookie: cookieHeader,
          "content-type": "application/json; charset=utf-8",
          "x-requested-with": "XMLHttpRequest",
          accept: "application/json",
        },
        body: upstreamBody,
      });

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
    console.error("Airflow search failed", e);
    return Response.json({ error: "Airflow search failed" }, { status: 502 });
  }
}
