"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Returns the request-scoped client only if the caller is a super_admin
// (defense in depth — RLS also enforces super_admin on the write).
async function superAdminClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  return data ? supabase : null;
}

export async function verifyAthlete(id: string): Promise<void> {
  const supabase = await superAdminClient();
  if (!supabase) return;
  await supabase
    .from("athletes")
    .update({ sovereign_verified: true, entry_status: "sovereign" })
    .eq("id", id);
  revalidatePath("/admin");
}

export async function rejectAthlete(id: string): Promise<void> {
  const supabase = await superAdminClient();
  if (!supabase) return;
  await supabase
    .from("athletes")
    .update({ entry_status: "flagged_review", profile_public: false })
    .eq("id", id);
  revalidatePath("/admin");
}
