import { ImageResponse } from "next/og";
import { getPublicAthlete, fmtScore } from "@/lib/vgm/public-profile";

export const alt = "Recruiting profile — The Virtual GM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { slug: string };
}) {
  const a = await getPublicAthlete(params.slug).catch(() => null);
  const name = a?.full_name ?? "The Virtual GM";
  const line = a
    ? [a.position, a.graduation_year ? `'${String(a.graduation_year).slice(-2)}` : null, a.school]
        .filter(Boolean)
        .join("  ·  ")
    : "We Scout From The Neck Up";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0b1830",
          borderTop: "10px solid #00c896",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", color: "#00c896", fontSize: 26, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
          Verified Recruiting Profile
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1, textTransform: "uppercase" }}>
            {name}
          </div>
          <div style={{ marginTop: 18, fontSize: 32, color: "#cdd5e1" }}>{line}</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {a
              ? [
                  { label: "OVR", value: fmtScore(a.ovr as number | null) },
                  { label: "PRO", value: fmtScore(a.neck_up_pro_score as number | null) },
                  { label: "NER", value: fmtScore(a.neck_up_ner as number | null) },
                ].map((s) => <Stat key={s.label} label={s.label} value={s.value} />)
              : null}
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#8892a4" }}>
            THE VIRTUAL GM
          </div>
        </div>
      </div>
    ),
    size
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 56 }}>
      <div style={{ fontSize: 72, fontWeight: 800, color: "#00c896", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 22, color: "#8892a4", letterSpacing: 2, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}
