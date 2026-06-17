import { createClient } from "@/lib/supabase/server";
import { ReviewRow, type PendingAthlete } from "../review-row";

export const dynamic = "force-dynamic";

export default async function IntelReviewPage() {
  const supabase = createClient();
  // Intel-draft prospects: unverified, pre-loaded scouting intel (NOT self-intake
  // form submissions, which set assessment_answers.self_reported = 'true').
  const { data } = await supabase
    .from("athletes")
    .select(
      "id, full_name, position, school, graduation_year, ovr, market_position, profile_slug, assessment_answers, entry_source, created_at"
    )
    .eq("sovereign_verified", false)
    .is("assessment_answers->>self_reported", null)
    .order("created_at", { ascending: false });

  const pending: PendingAthlete[] = (data ?? []).map((r) => ({
    id: r.id as string,
    full_name: r.full_name as string | null,
    position: r.position as string | null,
    school: r.school as string | null,
    graduation_year: r.graduation_year as number | null,
    ovr: r.ovr as number | string | null,
    market_position:
      (r.market_position as string | null) ??
      (r.entry_source ? `intel · ${r.entry_source}` : null),
    profile_slug: r.profile_slug as string | null,
    email: null,
  }));

  return (
    <div className="fade-in">
      <div className="t-display text-2xl md:text-3xl" style={{ color: "var(--white)" }}>
        Intel Prospects
      </div>
      <p style={{ color: "var(--mid)", fontSize: 13, marginTop: 4, marginBottom: "calc(var(--u)*3)" }}>
        Pre-loaded scouting intel awaiting triage. Verify to add a prospect to the
        verified pool (pending a full evaluation); Reject to archive.
      </p>

      {pending.length === 0 ? (
        <div className="card-dark" style={{ padding: "calc(var(--u)*3)", color: "var(--mid)", fontSize: 14 }}>
          No intel prospects awaiting triage.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="t-label">{pending.length} prospects</div>
          {pending.map((a) => (
            <ReviewRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
