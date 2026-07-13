import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (supabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}
