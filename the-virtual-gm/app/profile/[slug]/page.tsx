import type { Metadata } from "next";
import Link from "next/link";
import { getPublicAthlete, fmtScore, SITE_URL } from "@/lib/vgm/public-profile";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getPublicAthlete(params.slug);
  if (!a) {
    return {
      title: "Private profile | The Virtual GM",
      description: "This recruiting profile is private or not yet published.",
      robots: { index: false, follow: false },
    };
  }
  const name = a.full_name ?? "Athlete";
  const line = [a.position, a.graduation_year, a.school]
    .filter(Boolean)
    .join(" · ");
  const title = `${name} — ${a.position ?? "Recruit"} | The Virtual GM`;
  const description = `${name}${line ? ` · ${line}` : ""}. OVR ${fmtScore(
    a.ovr as number | null
  )}. Verified recruiting profile, scouted from the neck up.`;
  const url = `${SITE_URL}/profile/${params.slug}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      siteName: "The Virtual GM",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="card-dark"
      style={{ padding: "calc(var(--u)*1.75)", textAlign: "center" }}
    >
      <div
        className="t-display"
        style={{ color: "var(--teal)", fontSize: 34, lineHeight: 1 }}
      >
        {value}
      </div>
      <div className="t-label" style={{ marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function PoweredFooter() {
  return (
    <footer
      style={{
        marginTop: "calc(var(--u)*5)",
        paddingTop: "calc(var(--u)*3)",
        borderTop: "1px solid var(--line-dark)",
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 12.5, color: "var(--mid)" }}>
        Powered by{" "}
        <span className="t-display" style={{ color: "var(--white)" }}>
          The Virtual GM
        </span>{" "}
        · We Scout From The Neck Up
      </div>
      <Link href="/signup" className="btn btn-primary btn-sm">
        Claim your profile →
      </Link>
    </footer>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="court-tex fade-in"
      style={{ minHeight: "100vh", padding: "calc(var(--u)*4) 16px" }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

export default async function PublicProfilePage({ params }: Props) {
  const a = await getPublicAthlete(params.slug);

  // Private or non-existent → branded locked state (never 404-ugly).
  if (!a) {
    return (
      <Shell>
        <div
          className="card-dark accent"
          style={{ padding: "calc(var(--u)*4)", textAlign: "center" }}
        >
          <div className="t-label">Private profile</div>
          <h1
            className="t-display"
            style={{ fontSize: 40, margin: "10px 0", color: "var(--white)" }}
          >
            This profile is locked
          </h1>
          <p style={{ color: "var(--mid)", fontSize: 14, maxWidth: 420, margin: "0 auto" }}>
            This recruiting profile is private or hasn&apos;t been published yet.
          </p>
          <div style={{ marginTop: 22 }}>
            <Link href="/signup" className="btn btn-primary">
              Build your own profile
            </Link>
          </div>
        </div>
        <PoweredFooter />
      </Shell>
    );
  }

  const name = a.full_name ?? "Athlete";
  const meta = [a.position, a.graduation_year ? `Class of ${a.graduation_year}` : null, a.school]
    .filter(Boolean)
    .join("  ·  ");
  const loc = [a.location_city, a.location_state].filter(Boolean).join(", ");
  const tags = (a.secondary_tags ?? []).filter(Boolean) as string[];

  return (
    <Shell>
      {/* Hero */}
      <header className="card-dark accent" style={{ padding: "calc(var(--u)*3.5)" }}>
        <div className="t-label" style={{ color: "var(--teal)" }}>
          Verified Recruiting Profile
        </div>
        <h1
          className="t-display"
          style={{ fontSize: 52, lineHeight: 1.02, margin: "8px 0 6px", color: "var(--white)" }}
        >
          {name}
        </h1>
        {meta && (
          <div className="t-head" style={{ color: "var(--white)", fontSize: 15 }}>
            {meta}
          </div>
        )}
        {loc && (
          <div style={{ color: "var(--mid)", fontSize: 13, marginTop: 4 }}>{loc}</div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          {a.market_position && (
            <span className="pill pill-teal">{a.market_position}</span>
          )}
          {a.confidence_band && (
            <span className="pill pill-teal-outline">
              {a.confidence_band} confidence
            </span>
          )}
        </div>
      </header>

      {/* Scores */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginTop: "calc(var(--u)*2.5)",
        }}
      >
        <StatTile label="Overall (OVR)" value={fmtScore(a.ovr as number | null)} />
        <StatTile label="PRO Score" value={fmtScore(a.neck_up_pro_score as number | null)} />
        <StatTile label="NER" value={fmtScore(a.neck_up_ner as number | null)} />
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section style={{ marginTop: "calc(var(--u)*2.5)" }}>
          <div className="t-label" style={{ marginBottom: 10 }}>
            Scouting Tags
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((t) => (
              <span key={t} className="pill pill-gray">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      <PoweredFooter />
    </Shell>
  );
}
