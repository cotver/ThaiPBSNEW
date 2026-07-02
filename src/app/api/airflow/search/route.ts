export const runtime = "nodejs";

import {
  AIRFLOW_BASE,
  getCookieCached,
  clearCookieCache,
  isSameOrigin,
} from "@/lib/airflow-auth";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));

    const q: string = String(body.q ?? "").trim();
    if (!q) return Response.json({ error: "Missing q" }, { status: 400 });

    const template = String(body.template ?? "Meta Data Team");
    const flags = body.flags ?? {
      clips: true,
      files: true,
      images: true,
      markers: true,
      sequences: true,
      subclips: true,
    };

    const params = new URLSearchParams();
    params.set("q", q);
    params.set("template", template);
    for (const [k, v] of Object.entries(flags)) {
      params.set(k, String(Boolean(v)));
    }

    const cookie = await getCookieCached();

    const upstreamUrl = new URL(
      `/api/v2/search/cached?${params.toString()}`,
      AIRFLOW_BASE
    ).toString();

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json; charset=utf-8",
        "x-requested-with": "XMLHttpRequest",
        accept: "application/json",
      },
      body: JSON.stringify(body.payload ?? {}),
    });

    if (upstream.status === 401) {
      clearCookieCache();
      const cookie2 = await getCookieCached();
      const retry = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          cookie: cookie2,
          "content-type": "application/json; charset=utf-8",
          "x-requested-with": "XMLHttpRequest",
          accept: "application/json",
        },
        body: JSON.stringify(body.payload ?? {}),
      });

      const data = await retry.json().catch(async () => ({
        raw: await retry.text(),
      }));
      return Response.json(
        { upstreamStatus: retry.status, data },
        { status: retry.status }
      );
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
