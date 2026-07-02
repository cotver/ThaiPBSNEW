export const AIRFLOW_BASE =
  process.env.AIRFLOW_BASE || "https://airflow.thaipbs.or.th:8005";

const AIRFLOW_HOST = "airflow.thaipbs.or.th";

declare global {
  // eslint-disable-next-line no-var
  var __airflowSid: { cookie: string; expiresAt: number } | null | undefined;
}

function nowMs() {
  return Date.now();
}

function getSetCookieList(headers: Headers): string[] {
  const anyH = headers as unknown as { getSetCookie?: () => string[] };
  if (typeof anyH.getSetCookie === "function") return anyH.getSetCookie();
  const sc = headers.get("set-cookie");
  return sc ? [sc] : [];
}

function pickGatewaySid(setCookieList: string[]) {
  const hit = setCookieList.find((c) =>
    c.toLowerCase().startsWith("gateway.sid.8005=")
  );
  return hit ? hit.split(";")[0].trim() : null;
}

export async function loginAndGetCookie(): Promise<string> {
  const user = process.env.AIRFLOW_USER || "";
  const pass = process.env.AIRFLOW_PASS || "";
  const product = "airflow";
  const otp = process.env.AIRFLOW_OTP || "";

  if (!user || !pass) throw new Error("Missing AIRFLOW_USER / AIRFLOW_PASS");
  if (!product) throw new Error("Missing AIRFLOW_PRODUCT (required by /api/v2/login)");

  const pre = await fetch(new URL("/login", AIRFLOW_BASE).toString(), {
    method: "GET",
  });
  const preCookies = getSetCookieList(pre.headers)
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");

  const form = new URLSearchParams();
  form.set("username", user);
  form.set("password", pass);
  form.set("otp", otp);
  form.set("product", product);

  const res = await fetch(new URL("/api/v2/login", AIRFLOW_BASE).toString(), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      ...(preCookies ? { cookie: preCookies } : {}),
    },
    body: form.toString(),
    redirect: "manual",
  });

  if (!(res.status === 201 || res.status === 200)) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Login failed: ${res.status}\n${txt}`.slice(0, 1200));
  }

  const sid = pickGatewaySid(getSetCookieList(res.headers));
  if (!sid)
    throw new Error("Login succeeded but gateway.sid.8005 not found in Set-Cookie");
  return sid;
}

export async function getCookieCached(): Promise<string> {
  const cached = globalThis.__airflowSid;
  if (cached && cached.expiresAt > nowMs()) return cached.cookie;

  const cookie = await loginAndGetCookie();
  globalThis.__airflowSid = {
    cookie,
    expiresAt: nowMs() + 10 * 60 * 1000,
  };
  return cookie;
}

export function clearCookieCache(): void {
  globalThis.__airflowSid = null;
}

export function getAirflowHost(): string {
  return AIRFLOW_HOST;
}

/**
 * Build the effective request origin. When behind a reverse proxy (e.g. Cloudflare Tunnel),
 * req.url is often the internal URL (e.g. http://localhost:3000), while the client
 * sends Referer/Origin with the public URL. Use Host / X-Forwarded-* when present
 * so the check matches what the browser sends. Defaults to https when Host is set
 * and not localhost (so tunnel/proxy domains work even if x-forwarded-proto is missing).
 */
function getEffectiveOrigin(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const h = host.replace(/,.*/, "").trim();
    const isLocal =
      h === "localhost" || h.startsWith("127.") || h.endsWith(".localhost");
    const p = (proto?.replace(/,.*/, "").trim() || (isLocal ? "http" : "https"));
    return `${p}://${h}`;
  }
  const requestUrl = new URL(req.url);
  return requestUrl.origin;
}

/**
 * Only allow requests from the same origin (Referer/Origin).
 * Reject direct access (new tab, copy link, other sites).
 * When behind a proxy (e.g. Cloudflare Tunnel), Host is used to build the
 * effective origin; https is assumed for non-localhost so 403 is avoided.
 * Optional: AIRFLOW_ALLOWED_ORIGINS (comma-separated) to allow specific
 * origins (e.g. https://admin.thaipbs.or.th,https://your-tunnel.trycloudflare.com).
 */
export function isSameOrigin(req: Request): boolean {
  const effectiveOrigin = getEffectiveOrigin(req);
  const allowedFromEnv = process.env.AIRFLOW_ALLOWED_ORIGINS?.trim();

  // When reached via localhost (e.g. cloudflared tunnel --url http://localhost),
  // we cannot rely on Origin/Referer (they may be missing or show tunnel URL).
  // Allow requests so the tunnel works. Set AIRFLOW_ALLOWED_ORIGINS in production.
  if (
    !allowedFromEnv &&
    (effectiveOrigin.startsWith("http://localhost") ||
      effectiveOrigin.startsWith("http://127."))
  ) {
    return true;
  }

  const allowedOrigins = allowedFromEnv
    ? allowedFromEnv.split(",").map((o) => o.trim()).filter(Boolean)
    : [effectiveOrigin];

  const referer = req.headers.get("referer");
  const origin = req.headers.get("origin");

  const check = (originToCheck: string) => {
    try {
      const url = new URL(originToCheck);
      return allowedOrigins.includes(url.origin);
    } catch {
      return false;
    }
  };

  if (referer && check(referer)) return true;
  if (origin && allowedOrigins.includes(origin)) return true;
  return false;
}
