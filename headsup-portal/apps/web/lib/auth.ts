/* Session + RBAC helpers. ALL role checks read app_metadata — the
   server-controlled claim block. user_metadata is user-writable and must
   never appear in an authorization decision (Gate 7). */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { serverEnv } from "./env";
import { serviceClient } from "./supabaseServer";
import type { OperatorRow } from "@/types/database.types";

export const RBAC_ROLES = [
  "Athlete",
  "College_Scout",
  "Coach",
  "NDA_Analyst",
  "System_Admin",
] as const;

export type PortalRole = (typeof RBAC_ROLES)[number];

export interface AuthContext {
  user: User;
  role: PortalRole | "";
}

/* Per-request, cookie-bound client: queries through it run as the signed-in
   user with RLS enforced. */
export function sessionClient() {
  const store = cookies();
  return createServerClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; middleware refreshes them.
        }
      },
    },
  });
}

export async function getAuth(): Promise<AuthContext | null> {
  const supabase = sessionClient();
  // getUser() validates the JWT against Supabase — never trust getSession()
  // alone for authorization.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const role = (data.user.app_metadata?.role ?? "") as AuthContext["role"];
  return { user: data.user, role };
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) throw new AuthError(401, "Not authenticated");
  return auth;
}

export async function requireRole(...allowed: PortalRole[]): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!allowed.includes(auth.role as PortalRole)) {
    throw new AuthError(403, "Insufficient role");
  }
  return auth;
}

/* Operator record for the calling user (Coach/GM surfaces). Uses the service
   client AFTER authentication — scoped strictly to the caller's own user id. */
export async function getOperator(userId: string): Promise<OperatorRow | null> {
  const { data } = await serviceClient()
    .from("operators")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as OperatorRow) ?? null;
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
