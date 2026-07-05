/* Shared route-handler plumbing: uniform auth-error → HTTP mapping. */

import { NextResponse } from "next/server";

import { isAuthError } from "./auth";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (isAuthError(error)) return jsonError(error.status, error.message);
  console.error("[api]", error);
  return jsonError(500, "Internal error");
}
