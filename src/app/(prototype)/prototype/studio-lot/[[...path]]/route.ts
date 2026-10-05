import { NextResponse, type NextRequest } from "next/server";

/**
 * Old Studio Lot links: the gallery moved from /prototype/studio-lot to /home (?view=studio|list) and
 * its pages to /home/studio/…. This lives in the prototype folder on purpose — remove the folder and the
 * old links stop working with it.
 *
 * /prototype/studio-lot               → /home?view=studio   (?view=list → /home?view=list; ?stage=… kept)
 * /prototype/studio-lot/<page>/…      → /home/studio/<page>/…   (programs, news, shortlist, logo)
 *
 * 307, not permanent: browsers don't remember it, so once the folder is gone the old links really are gone.
 */
function redirectToStudio(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return params.then(({ path = [] }) => {
    const target = new URL(request.nextUrl);
    if (path.length) {
      target.pathname = `/home/studio/${path.map(encodeURIComponent).join("/")}`;
    } else {
      target.pathname = "/home";
      if (target.searchParams.get("view") !== "list") target.searchParams.set("view", "studio");
    }
    return NextResponse.redirect(target, 307);
  });
}

export const GET = redirectToStudio;
export const HEAD = redirectToStudio;
