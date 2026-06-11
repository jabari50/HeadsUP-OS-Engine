"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message: string } | null;

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const origin = headers().get("origin") ?? "";
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    return { ok: false, message: "Could not send magic link. Try again." };
  }
  return { ok: true, message: `Magic link sent to ${email}. Check your inbox.` };
}
