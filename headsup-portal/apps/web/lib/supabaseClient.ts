/* Anon-key Supabase client for the browser. Auth + RLS-scoped reads only —
   the browser never writes a score and never sees the service role (Gate 3). */

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "./env";

export function browserClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
