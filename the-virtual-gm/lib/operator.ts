import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Operator } from "@/lib/types";

// Fetch the operator row for the signed-in user, self-provisioning an
// inactive 'scout' row on first login (RLS insert_own permits id = auth.uid()).
export async function getOrCreateOperator(
  supabase: SupabaseClient,
  user: User
): Promise<Operator | null> {
  const { data: existing } = await supabase
    .from("operators")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Operator;

  const { data: created } = await supabase
    .from("operators")
    .insert({
      id: user.id,
      name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Operator",
      email: user.email,
    })
    .select("*")
    .maybeSingle();

  return (created as Operator) ?? null;
}
