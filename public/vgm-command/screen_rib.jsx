// screen_rib.jsx → Coach's Brief (weekly editorial)
const { Eyebrow } = window;

function BriefSection({ num, title, count, children }) {
  return (
    <section style={{ marginTop: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, borderBottom: "2px solid #112240", paddingBottom: 8 }}>
        <span className="stat" style={{ fontSize: 18, color: "var(--teal)" }}>{num}</span>
        <h3 className="mono-cap" style={{ margin: 0, fontSize: 13, color: "#112240", letterSpacing: "0.1em", flex: 1 }}>{title}</h3>
        {count != null && <span style={{ fontSize: 11.5, color: "#6A7180", fontWeight: 600 }}>{count}</span>}
      </div>
      {children}
    </section>
  );
}

function SeverityDot({ s }) {
  const map = { "Ineligible": "#E2564B", "On watch": "var(--gold)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: map[s] }}></span>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#3A414E" }}>{s}</span>
    </span>
  );
}

function RibScreen() {
  const R = window.VGM.BRIEF;
  const P = window.VGM.PROGRAM;
  const ink = "#112240", meta = "#6A7180", line = "rgba(17,34,64,0.12)";
  const rowBase = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "13px 0", borderBottom: `1px solid ${line}` };

  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div>
        <Eyebrow>Coach's Brief</Eyebrow>
        <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>Weekly Program Brief</h1>
      </div>

      <div style={{ background: "var(--offwhite)", borderRadius: 14, padding: "clamp(24px, 4vw, 48px)", color: ink, maxWidth: 960, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        {/* Masthead */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", borderBottom: `3px solid ${ink}`, paddingBottom: 18 }}>
          <div>
            <div className="mono-cap" style={{ fontSize: 10.5, color: "var(--teal)", letterSpacing: "0.2em" }}>Roster Intelligence Brief</div>
            <h2 className="head" style={{ fontSize: "clamp(28px,4vw,40px)", margin: "8px 0 0", color: ink }}>{P.team}</h2>
            <div style={{ fontSize: 12, color: meta, marginTop: 6, fontWeight: 600 }}>{P.classification} · {P.district} · {P.region}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono-cap" style={{ fontSize: 10, color: meta }}>{R.week}</div>
            <div style={{ fontSize: 12, color: meta, marginTop: 6, fontWeight: 600 }}>Coach {P.coach}</div>
          </div>
        </div>

        {/* 01 — Eligibility Alerts */}
        <BriefSection num="01" title="Eligibility Alerts — No Pass, No Play" count={`${R.eligibilityAlerts.length} flagged`}>
          {R.eligibilityAlerts.map((m, i) => (
            <div key={i} style={rowBase}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="stat" style={{ fontSize: 19, color: m.grade < 70 ? "#E2564B" : "var(--gold)", width: 38 }}>{m.grade}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>#{m.num} {m.player} <span style={{ color: meta, fontWeight: 500, fontSize: 13 }}>· {m.pos}</span></div>
                  <div style={{ fontSize: 12, color: meta, marginTop: 2 }}>{m.issue}</div>
                </div>
              </div>
              <SeverityDot s={m.severity} />
            </div>
          ))}
        </BriefSection>

        {/* 02 — Grade Movement */}
        <BriefSection num="02" title="Grade Movement This Period" count={`${R.gradeMoves.length} changes`}>
          {R.gradeMoves.map((c, i) => (
            <div key={i} style={rowBase}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{c.player} <span style={{ color: meta, fontWeight: 500, fontSize: 13 }}>· {c.subject}</span></div>
                <div style={{ fontSize: 12, color: meta, marginTop: 2 }}>{c.note}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="stat" style={{ fontSize: 20, color: meta }}>{c.from}</span>
                <span style={{ color: c.dir === "up" ? "var(--teal)" : "#E2564B", fontSize: 18, fontWeight: 700 }}>→</span>
                <span className="stat" style={{ fontSize: 22, color: c.dir === "up" ? "var(--teal)" : "#E2564B" }}>{c.to}</span>
                <span style={{ fontSize: 14, color: c.dir === "up" ? "var(--teal)" : "#E2564B" }}>{c.dir === "up" ? "▲" : "▼"}</span>
              </div>
            </div>
          ))}
        </BriefSection>

        {/* 03 — Schedule */}
        <BriefSection num="03" title="Upcoming District Schedule" count={`${R.schedule.length} games`}>
          {R.schedule.map((s, i) => (
            <div key={i} style={rowBase}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.where === "Home" ? "vs" : "@"} {s.opp}</div>
                <div style={{ fontSize: 12, color: meta, marginTop: 2 }}>{s.note}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12.5, color: meta }}>{s.when}</span>
                {s.district && <span className="mono-cap" style={{ fontSize: 10, color: ink, background: "rgba(17,34,64,0.08)", border: `1px solid ${line}`, borderRadius: 4, padding: "4px 9px" }}>District</span>}
              </div>
            </div>
          ))}
        </BriefSection>

        {/* 04 — Recommended Actions */}
        <BriefSection num="04" title="Top 3 Recommended Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {R.actions.map((a, i) => (
              <div key={i} style={{ borderLeft: "3px solid var(--teal)", paddingLeft: 16, paddingTop: 2, paddingBottom: 2 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span className="stat" style={{ fontSize: 18, color: "var(--teal)" }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ fontSize: 12.5, color: meta, marginTop: 4, lineHeight: 1.5 }}>{a.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BriefSection>

        {/* Footer */}
        <div style={{ marginTop: 34, paddingTop: 16, borderTop: `1px solid ${line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span className="mono-cap" style={{ fontSize: 10, color: meta }}>Powered by HeadsUP OS</span>
          <span className="mono-cap" style={{ fontSize: 10, color: meta }}>HeadsUP Media &amp; Scouting</span>
        </div>
      </div>
    </div>
  );
}

window.RibScreen = RibScreen;
