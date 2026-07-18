// screen_matchmaking.jsx → Academic Accountability (per-teacher report cards)
const { OvrBadge, GpaBadge, TierBadge, EligibilityPill, Panel, Eyebrow } = window;
const { useState } = React;

const PASS = 70;
function gradeColor(g) { return g < PASS ? "#FF6B5E" : g < 75 ? "var(--gold)" : g >= 90 ? "var(--teal)" : "var(--white)"; }
function conductStyle(c) {
  if (c === "Concern") return { color: "#FF6B5E", bd: "rgba(255,107,94,0.4)" };
  if (c === "Satisfactory") return { color: "var(--gold)", bd: "rgba(245,197,24,0.4)" };
  return { color: "var(--teal)", bd: "var(--teal-line)" };
}

function PlayerListItem({ p, active, onClick }) {
  const e = window.VGM.ELIGIBILITY[p.eligibility];
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
      padding: "11px 13px", borderRadius: 9, border: "1px solid " + (active ? "var(--teal-line)" : "transparent"),
      background: active ? "var(--teal-dim)" : "transparent", transition: "all .14s",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flex: "0 0 auto" }}></span>
      <span className="stat" style={{ fontSize: 15, color: "var(--gray)", width: 30, flex: "0 0 auto" }}>#{p.num}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? "var(--white)" : "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
        <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{p.pos} · {p.cls} · {p.gpa.toFixed(2)} GPA</div>
      </div>
      {p.reportedCount < p.classCount && <span title="Awaiting teacher grades" style={{ fontSize: 10, color: "var(--gold)", flex: "0 0 auto" }}>●</span>}
    </button>
  );
}

function ClassCard({ c }) {
  const cs = conductStyle(c.conduct);
  const reported = c.reported !== "Not reported";
  return (
    <Panel pad="0" style={{ overflow: "hidden", borderLeft: `3px solid ${gradeColor(c.grade)}`, opacity: reported ? 1 : 0.92 }}>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)" }}>{c.subject}</div>
            <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>{c.teacher}</div>
          </div>
          <div style={{ textAlign: "right", flex: "0 0 auto" }}>
            {reported ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                <span className="stat" style={{ fontSize: 34, color: gradeColor(c.grade), lineHeight: 1 }}>{c.grade}</span>
                <span style={{ fontSize: 13, color: c.trend === "up" ? "var(--teal)" : c.trend === "down" ? "#FF6B5E" : "var(--gray)" }}>{window.VGM.trendArrow(c.trend)}</span>
              </div>
            ) : (
              <span className="mono-cap" style={{ fontSize: 10, color: "var(--gold)", border: "1px solid rgba(245,197,24,0.4)", borderRadius: 5, padding: "6px 9px" }}>Not Reported</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--hair)", paddingTop: 11 }}>
          <span className="mono-cap" style={{ fontSize: 9, color: cs.color, border: `1px solid ${cs.bd}`, borderRadius: 5, padding: "3px 8px" }}>{c.conduct}</span>
          {c.missing > 0 && <span className="mono-cap" style={{ fontSize: 9, color: "#FF6B5E", border: "1px solid rgba(255,107,94,0.4)", borderRadius: 5, padding: "3px 8px" }}>{c.missing} Missing</span>}
          <span style={{ flex: 1 }}></span>
          <span style={{ fontSize: 10.5, color: "var(--gray)" }}>{reported ? `Reported ${c.reported}` : "Awaiting submission"}</span>
        </div>
        {c.comment && <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.5, fontStyle: "italic", borderTop: "1px solid var(--hair)", paddingTop: 11 }}>“{c.comment}”</div>}
      </div>
    </Panel>
  );
}

function VerdictBanner({ p }) {
  const e = window.VGM.ELIGIBILITY[p.eligibility];
  const failing = p.elig.failing, watch = p.elig.watch;
  let msg;
  if (p.eligibility === "INELIGIBLE") msg = `Below the 70 line in ${failing.map(c => c.subject).join(", ")}. Ineligible for UIL competition until a passing grade is posted (minimum 3-week hold).`;
  else if (p.eligibility === "WARNING") msg = `Borderline in ${watch.map(c => c.subject).join(", ")} (70–74). Eligible now, but at risk at the next 3-week check (${window.VGM.PROGRAM.nextCheck}).`;
  else if (p.eligibility === "PENDING") msg = `Passing all reported courses, but ${p.classCount - p.reportedCount} teacher report(s) outstanding — cannot certify until all grades post.`;
  else msg = `Passing all courses. Cleared for UIL competition through the current grading period.`;
  return (
    <div style={{ borderRadius: 12, padding: "16px 20px", background: e.bg, border: `1px solid ${e.line}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span className="mono-cap" style={{ fontSize: 10, color: e.color, border: `1px solid ${e.line}`, borderRadius: 5, padding: "5px 10px", flex: "0 0 auto" }}>{e.label}</span>
      <div style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.5, fontWeight: 500 }}>{msg}</div>
    </div>
  );
}

function MatchmakingScreen() {
  const ALL = window.VGM.PLAYERS;
  const [sel, setSel] = useState(ALL[0].id);
  const p = ALL.find(x => x.id === sel);
  const academics = p.classes.filter(c => c.subject !== "Athletics");
  const reportPct = Math.round((p.reportedCount / p.classCount) * 100);

  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div>
        <Eyebrow>Academic Accountability</Eyebrow>
        <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>Per-Teacher Report Cards</h1>
      </div>

      <div className="acad-grid" style={{ display: "grid", gridTemplateColumns: "286px minmax(0,1fr)", gap: "var(--gap)", alignItems: "start" }}>
        {/* Player rail */}
        <Panel pad="14px" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Eyebrow color="var(--gray)" style={{ fontSize: 9.5, padding: "4px 8px 10px" }}>Roster · select a player</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "62vh", overflowY: "auto" }}>
            {ALL.map(x => <PlayerListItem key={x.id} p={x} active={x.id === sel} onClick={() => setSel(x.id)} />)}
          </div>
        </Panel>

        {/* Report card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <Panel pad="20px 24px" style={{ borderTop: "2px solid var(--teal)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <GpaBadge gpa={p.gpa} size={56} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="stat" style={{ fontSize: 18, color: "var(--gray)" }}>#{p.num}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--white)" }}>{p.name}</span>
                    <TierBadge tier={p.tier} small />
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--gray)", marginTop: 4 }}>{p.pos} · {p.cls} · {p.ht}</div>
                </div>
              </div>
              <EligibilityPill status={p.eligibility} />
            </div>

            {/* teacher reporting progress */}
            <div style={{ marginTop: 18, borderTop: "1px solid var(--hair)", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Teacher Grade Reporting · this period</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: p.reportedCount < p.classCount ? "var(--gold)" : "var(--teal)" }}>{p.reportedCount} of {p.classCount} teachers reported</span>
              </div>
              <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: reportPct + "%", height: "100%", background: p.reportedCount < p.classCount ? "var(--gold)" : "var(--teal)", borderRadius: 999, animation: "barGrow .7s cubic-bezier(.2,.7,.2,1)" }}></div>
              </div>
            </div>
          </Panel>

          <VerdictBanner p={p} />

          <Eyebrow>Course Grades — by Teacher of Record</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--gap)" }}>
            {academics.map((c, i) => <ClassCard key={i} c={c} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

window.AcademicsScreen = MatchmakingScreen;
