import { createClient } from "@/lib/supabase/server";
import { ReviewRow, type PendingAthlete } from "./review-row";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("athletes")
    .select(
      "id, full_name, position, school, graduation_year, ovr, market_position, profile_slug, assessment_answers, created_at"
    )
    .eq("sovereign_verified", false)
    .eq("entry_source", "self_submitted")
    .eq("assessment_answers->>self_reported", "true")
    .order("created_at", { ascending: false });

  const pending: PendingAthlete[] = (data ?? []).map((r) => {
    const aa = (r.assessment_answers ?? {}) as Record<string, unknown>;
    return {
      id: r.id as string,
      full_name: r.full_name as string | null,
      position: r.position as string | null,
      school: r.school as string | null,
      graduation_year: r.graduation_year as number | null,
      ovr: r.ovr as number | string | null,
      market_position: r.market_position as string | null,
      profile_slug: r.profile_slug as string | null,
      email: (aa.email as string) ?? null,
    };
  });

  return (
    <div className="fade-in">
      <div className="t-display text-2xl md:text-3xl" style={{ color: "var(--white)" }}>
        Review Queue
      </div>
      <p style={{ color: "var(--mid)", fontSize: 13, marginTop: 4, marginBottom: "calc(var(--u)*3)" }}>
        Self-submitted athletes awaiting verification. Verifying promotes them onto
        the operator scout board.
      </p>

      {pending.length === 0 ? (
        <div className="card-dark" style={{ padding: "calc(var(--u)*3)", color: "var(--mid)", fontSize: 14 }}>
          No athletes awaiting review. New self-intake submissions land here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="t-label">{pending.length} pending</div>
          {pending.map((a) => (
            <ReviewRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
