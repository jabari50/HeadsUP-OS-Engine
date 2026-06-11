"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACTIVATION_STATUSES, type ActivationStatus } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addToRoster(formData: FormData) {
  const athleteId = String(formData.get("athlete_id") ?? "");
  if (!UUID_RE.test(athleteId)) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS insert_own enforces operator_id = auth.uid(); set it explicitly too.
  await supabase
    .from("rosters")
    .insert({ operator_id: user.id, athlete_id: athleteId });

  revalidatePath("/dashboard");
}

export async function setActivation(formData: FormData) {
  const rosterId = String(formData.get("roster_id") ?? "");
  const status = String(formData.get("status") ?? "") as ActivationStatus;
  if (!UUID_RE.test(rosterId)) return;
  if (!ACTIVATION_STATUSES.includes(status)) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("rosters")
    .update({ activation_status: status })
    .eq("id", rosterId)
    .eq("operator_id", user.id);

  revalidatePath("/dashboard");
}

export async function removeFromRoster(formData: FormData) {
  const rosterId = String(formData.get("roster_id") ?? "");
  if (!UUID_RE.test(rosterId)) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("rosters")
    .delete()
    .eq("id", rosterId)
    .eq("operator_id", user.id);

  revalidatePath("/dashboard");
}
