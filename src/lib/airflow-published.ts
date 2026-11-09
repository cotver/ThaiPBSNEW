import { AIRFLOW_BASE, resolveAirflowStaticUrl } from "@/lib/airflow-auth";

/**
 * The public site shows Airflow posters and trailers through /api/airflow/static and /api/airflow/video,
 * which attach the server's Airflow session. Visitors without a CMS login may only fetch files that a
 * program, season or episode actually references; everything else on Airflow stays private.
 */

const AIRFLOW_PATH_FIELDS = [
  "TrailerAirflowProxyPath",
  "TrailerThumbnailAirflowProxyPath",
  "videoAirflowProxyPath",
  "videoThumbnailAirflowProxyPath",
  "trailerLink",
  "videoLink",
] as const;

const COLLECTIONS = ["programs", "seasons", "episodes"] as const;

// How long a loaded allowlist is trusted, and the minimum gap between reloads triggered by a miss
// (so a stream of requests for unknown files cannot hammer the database).
const CACHE_TTL_MS = 60_000;
const MISS_RELOAD_GAP_MS = 10_000;

type PublishedCache = { paths: Set<string>; loadedAt: number; loading?: Promise<Set<string>> };

declare global {
  var __airflowPublishedPaths: PublishedCache | undefined;
}

/** Compare paths in decoded form so "%5B" vs "[" or "%20" vs " " spellings match the same file. */
function pathKey(url: URL): string {
  try {
    return decodeURIComponent(url.pathname);
  } catch {
    return url.pathname;
  }
}

/** Turn any stored form (plain path, full Airflow URL, or an already-proxied /api/airflow URL) into a key. */
export function airflowPathKeyFromStoredValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let text = value.trim();
  if (!text) return null;

  if (text.startsWith("/api/airflow/")) {
    try {
      const proxied = new URL(text, "http://local.invalid");
      text = proxied.searchParams.get("path") ?? proxied.searchParams.get("url") ?? "";
    } catch {
      return null;
    }
    if (!text) return null;
  }

  if (/^https?:\/\//i.test(text)) {
    try {
      if (new URL(text).origin !== new URL(AIRFLOW_BASE).origin) return null;
    } catch {
      return null;
    }
  }

  const resolved = resolveAirflowStaticUrl(text);
  return resolved ? pathKey(resolved) : null;
}

async function loadPublishedPaths(): Promise<Set<string>> {
  const { getPayloadClient } = await import("@/lib/payload-client");
  const payload = await getPayloadClient();
  const select = Object.fromEntries(AIRFLOW_PATH_FIELDS.map((field) => [field, true]));
  const paths = new Set<string>();

  for (const collection of COLLECTIONS) {
    const result = await payload.find({
      collection,
      depth: 0,
      overrideAccess: true,
      pagination: false,
      select,
    });
    for (const doc of result.docs as unknown as Array<Record<string, unknown>>) {
      for (const field of AIRFLOW_PATH_FIELDS) {
        const key = airflowPathKeyFromStoredValue(doc[field]);
        if (key) paths.add(key);
      }
    }
  }

  return paths;
}

function reload(cache: PublishedCache): Promise<Set<string>> {
  cache.loading ??= loadPublishedPaths()
    .then((paths) => {
      cache.paths = paths;
      cache.loadedAt = Date.now();
      return paths;
    })
    .finally(() => {
      cache.loading = undefined;
    });
  return cache.loading;
}

/** True when the CMS references this Airflow file, so anonymous visitors may load it. */
export async function isPublishedAirflowFile(url: URL): Promise<boolean> {
  const key = pathKey(url);
  const cache = (globalThis.__airflowPublishedPaths ??= { paths: new Set(), loadedAt: 0 });
  const age = Date.now() - cache.loadedAt;

  try {
    if (age > CACHE_TTL_MS) return (await reload(cache)).has(key);
    if (cache.paths.has(key)) return true;
    // A file attached in the CMS moments ago may not be in the list yet.
    if (age > MISS_RELOAD_GAP_MS) return (await reload(cache)).has(key);
    return false;
  } catch (error) {
    console.error("Unable to load published Airflow paths", error);
    return cache.paths.has(key);
  }
}
