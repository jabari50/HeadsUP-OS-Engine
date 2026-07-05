/* Service-role Supabase client — SERVER ONLY (Gate 3).
   The service role bypasses RLS; it exists solely so API routes can perform
   engine-computed writes and cross-role reads AFTER their own auth checks.
   Importing this from a client component throws before any key is read. */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "./env";

if (typeof window !== "undefined") {
  throw new Error("supabaseServer.ts was imported in a browser bundle — Gate 3 violation.");
}

let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(serverEnv.supabaseUrl, serverEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
