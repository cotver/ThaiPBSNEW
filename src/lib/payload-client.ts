import { getPayload } from "payload";
import type { Payload } from "payload";
import config from "@payload-config";

declare global {
  // eslint-disable-next-line no-var
  var __payloadClientPromise: Promise<Payload> | undefined;
}

/**
 * Memoized Payload client.
 *
 * In Next.js (especially dev/HMR), calling `getPayload({ config })` in many route
 * handlers can lead to repeated initialization and excessive database connections.
 * Keeping a single shared instance avoids gradual pool exhaustion.
 */
export async function getPayloadClient(): Promise<Payload> {
  if (!globalThis.__payloadClientPromise) {
    globalThis.__payloadClientPromise = getPayload({ config });
  }
  return globalThis.__payloadClientPromise;
}

