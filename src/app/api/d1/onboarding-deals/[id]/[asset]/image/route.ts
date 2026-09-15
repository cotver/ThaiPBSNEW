const DEFAULT_D1_URL = "https://d1-read-proxy.thaipbs.workers.dev/";
const ALLOWED_ASSETS = new Set(["poster-v", "poster-h", "logo"]);

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string; id: string }> },
) {
  const { asset, id } = await params;
  if (!id || !ALLOWED_ASSETS.has(asset)) {
    return Response.json({ error: "Invalid D1 artwork request" }, { status: 400 });
  }

  const apiKey = process.env.D1_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return Response.json({ error: "D1 artwork is not configured" }, { status: 503 });
  }

  const baseUrl = process.env.D1_URL || DEFAULT_D1_URL;
  const upstreamUrl = new URL(
    `/api/onboarding-deals/${encodeURIComponent(id)}/${asset}/image`,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        Accept: "image/*",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json(
        { error: upstream.status === 404 ? "Artwork not found" : "Unable to load D1 artwork" },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    const contentType = upstream.headers.get("content-type");
    if (!contentType?.toLocaleLowerCase().startsWith("image/")) {
      return Response.json({ error: "D1 returned an invalid artwork response" }, { status: 502 });
    }

    const headers = new Headers({
      "Cache-Control": "private, max-age=300",
      "Content-Type": contentType,
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, { headers, status: 200 });
  } catch {
    return Response.json({ error: "Unable to load D1 artwork" }, { status: 502 });
  }
}
