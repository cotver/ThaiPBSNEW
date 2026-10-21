import { officialMarketLogoSrc } from "@/lib/market-logos";

/**
 * Same-origin copy of an official partner logo, so the 3D gallery can paint it into a WebGL texture.
 * WebGL refuses cross-origin images without CORS headers (viu.com sends none), and Next's image
 * optimizer will not serve SVG. Only the fixed allowlist in market-logos is reachable — never an arbitrary URL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const src = officialMarketLogoSrc(brand);
  if (!src) return new Response("Not found", { status: 404 });

  try {
    const upstream = await fetch(src, { next: { revalidate: 86400 } });
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !contentType.startsWith("image/")) return new Response("Logo unavailable", { status: 502 });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        // Logos are inert images; keep any scripting inside an SVG from running if opened directly.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Logo unavailable", { status: 502 });
  }
}
