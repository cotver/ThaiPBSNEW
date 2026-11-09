import { NextResponse, type NextRequest } from "next/server";

/**
 * Prototype pages are design workspaces, not part of the public site. In production they answer 404
 * unless ENABLE_PROTOTYPES=true. /prototype/studio-lot stays reachable: it only redirects old links.
 */
export function proxy(request: NextRequest) {
  const prototypesEnabled =
    process.env.NODE_ENV !== "production" || process.env.ENABLE_PROTOTYPES?.trim().toLowerCase() === "true";
  if (prototypesEnabled) return NextResponse.next();

  const path = request.nextUrl.pathname.toLowerCase();
  if (path === "/prototype/studio-lot" || path.startsWith("/prototype/studio-lot/")) return NextResponse.next();

  return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export const config = {
  matcher: ["/prototype", "/prototype/:path*"],
};
