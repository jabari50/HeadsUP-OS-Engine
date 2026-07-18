// screen_dashboard.jsx
const { OvrBadge, TierBadge, EligibilityPill, PriorityBadge, FitBar, Panel, Eyebrow, GradingPeriodPill } = window;

function ProgramHeader() {
  const P = window.VGM.PROGRAM;
  const facts = [
    { k: "Head Coach", v: P.coach },
    { k: "Classification", v: `${P.classification} · ${P.district}` },
    { k: "Season Record", v: `${P.record} (${P.districtRecord})` },
    { k: "Offense", v: P.system },
  ];
  return (
    <Panel pad="26px 28px" style={{ borderTop: "2px solid var(--teal)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div>
          <Eyebrow>{P.region} · {P.standing}</Eyebrow>
          <h1 className="head" style={{ fontSize: "clamp(34px, 4.4vw, 52px)", margin: "8px 0 0", color: "var(--white)" }}>{P.team}</h1>
          <div style={{ fontSize: 13, color: "var(--gray)", marginTop: 6, fontWeight: 500 }}>{P.city} · Enrollment {P.enrollment}</div>
        </div>
        <GradingPeriodPill period={P.gradingPeriod} week={P.periodWeek} nextCheck={P.nextCheck} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--gap)", marginTop: 22, borderTop: "1px solid var(--hair)", paddingTop: 20 }}>
        {facts.map(f => (
          <div key={f.k}>
            <Eyebrow color="var(--gray)" style={{ fontSize: 9.5 }}>{f.k}</Eyebrow>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6, color: "var(--white)" }}>{f.v}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function QuickStatStrip() {
  const stats = window.VGM.QUICK_STATS;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--gap)" }}>
      {stats.map((s) => (
        <Panel key={s.label} pad="20px 22px">
          <Eyebrow color="var(--gray)" style={{ fontSize: 10 }}>{s.label}</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
            <span className="stat" style={{ fontSize: 42, color: "var(--teal)", lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 12, color: "var(--gray)", fontWeight: 500 }}>{s.sub}</span>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function WatchCard({ w }) {
  return (
    <Panel pad="18px 20px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span className="stat" style={{ fontSize: 19, color: "var(--gray)" }}>#{w.num}</span>
          <div style={{
            width: 38, height: 38, borderRadius: 9, flex: "0 0 auto",
            background: "var(--navy-700)", border: "1px solid var(--hair-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--white)",
          }}>{w.pos}</div>
        </div>
        <PriorityBadge level={w.priority} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: "var(--white)" }}>{w.name}</div>
        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>{w.subject} · {w.teacher}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--hair)", paddingTop: 12 }}>
        <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Current Grade</span>
        <span className="stat" style={{ fontSize: 24, color: w.grade < 70 ? "#FF6B5E" : "var(--gold)" }}>{w.grade}</span>
      </div>
    </Panel>
  );
}

function EligibilityWatch() {
  const watch = window.VGM.ELIGIBILITY_WATCH;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Eyebrow>Eligibility Watch — No Pass, No Play</Eyebrow>
        <span style={{ fontSize: 12, color: "var(--gray)" }}>{watch.filter(w => w.status === "INELIGIBLE").length} ineligible · {watch.filter(w => w.status === "WARNING").length} on watch</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--gap)" }}>
        {watch.map(w => <WatchCard key={w.num} w={w} />)}
      </div>
    </div>
  );
}

function ActionItems({ onNavigate }) {
  const actions = window.VGM.ACTION_ITEMS;
  return (
    <Panel style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      <Eyebrow>This Week's Action Items</Eyebrow>
      <p style={{ fontSize: 12, color: "var(--gray)", margin: "6px 0 16px", lineHeight: 1.5 }}>Prioritized by eligibility risk and game timing.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {actions.map((a, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, padding: "14px 0",
            borderTop: i === 0 ? "none" : "1px solid var(--hair)",
          }}>
            <span className="stat" style={{ fontSize: 26, color: "var(--teal)", lineHeight: 1, flex: "0 0 auto", width: 26 }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, color: "var(--white)" }}>{a.title}</div>
              <div style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.5, marginTop: 5 }}>{a.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onNavigate && onNavigate("academics")} style={{
        marginTop: 16, width: "100%", padding: "12px", borderRadius: 8,
        background: "var(--teal)", color: "#0C1830", border: "none",
        fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
      }}>Open Academic Report Cards →</button>
    </Panel>
  );
}

function DashboardScreen({ onNavigate }) {
  return (
    <div className="screen-enter dash-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: "var(--gap)", alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        <ProgramHeader />
        <QuickStatStrip />
        <EligibilityWatch />
      </div>
      <div className="dash-rail">
        <ActionItems onNavigate={onNavigate} />
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
