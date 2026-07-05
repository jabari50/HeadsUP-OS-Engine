/* Server-only HMAC-signed client for the Render scoring engine (§7 U7).
   Signature: HMAC_SHA256(HU_ENGINE_SECRET, "{unix_ts}.{raw_body}").
   The engine rejects stale timestamps (>300s) and unsigned calls. */

import crypto from "crypto";

import { serverEnv } from "./env";

if (typeof window !== "undefined") {
  throw new Error("engineClient.ts was imported in a browser bundle — Gate 3 violation.");
}

export class EngineError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`Engine responded ${status}`);
    this.name = "EngineError";
  }
}

export async function engineFetch<T = unknown>(path: string, payload: unknown): Promise<T> {
  const raw = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", serverEnv.engineSecret)
    .update(`${timestamp}.${raw}`)
    .digest("hex");

  const response = await fetch(`${serverEnv.engineUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-HU-Timestamp": timestamp,
      "X-HU-Signature": signature,
    },
    body: raw,
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok && response.status !== 422) {
    throw new EngineError(response.status, body);
  }
  return body as T;
}
