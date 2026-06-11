"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { POSITIONS } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLASS_YEARS = ["2026", "2027", "2028", "2029", "2030"];

function parseHeight(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 48 || n > 96) return null;
  return n;
}

export async function createMatchRequest(formData: FormData) {
  const position = String(formData.get("position") ?? "");
  if (!POSITIONS.includes(position as (typeof POSITIONS)[number])) return;

  const heightMin = parseHeight(formData.get("height_min"));
  const heightMax = parseHeight(formData.get("height_max"));
  if (heightMin !== null && heightMax !== null && heightMin > heightMax) return;

  const classYearRaw = String(formData.get("class_year") ?? "");
  const classYear = CLASS_YEARS.includes(classYearRaw) ? classYearRaw : null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("match_requests").insert({
    operator_id: user.id,
    position,
    height_min: heightMin,
    height_max: heightMax,
    class_year: classYear,
  });

  revalidatePath("/dashboard/match");
}

export async function closeMatchRequest(formData: FormData) {
  const id = String(formData.get("request_id") ?? "");
  if (!UUID_RE.test(id)) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("match_requests")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("operator_id", user.id);

  revalidatePath("/dashboard/match");
}
