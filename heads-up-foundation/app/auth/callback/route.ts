import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

/** OAuth / email-verification callback — exchanges the code for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code && supabaseConfigured()) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
