// screen_activation.jsx → Eligibility Manager (UIL No Pass, No Play)
const { OvrBadge, GpaBadge, TierBadge, EligibilityPill, Panel, Eyebrow, Avatar } = window;
const { useState, useMemo } = React;

const PLAN = ["NONE", "TUTORING", "STUDY", "CLEARED"];
const PLAN_LABEL = { NONE: "No Plan", TUTORING: "Tutoring", STUDY: "Study Hall", CLEARED: "Cleared" };
const usesSlot = (s) => s === "TUTORING" || s === "STUDY";

function PlanStepper({ value, onSet }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, background: "var(--navy-900)", borderRadius: 8, padding: 4 }}>
      {PLAN.map(s => {
        const active = s === value;
        const c = s === "CLEARED" ? "var(--teal)" : s === "NONE" ? "var(--gray)" : "var(--gold)";
        return (
          <button key={s} onClick={() => onSet(s)} className="mono-cap" style={{
            border: "none", borderRadius: 6, padding: "8px 4px", fontSize: 9,
            letterSpacing: "0.04em", lineHeight: 1.3,
            background: active ? c : "transparent",
            color: active ? "#0C1830" : "var(--gray)",
            transition: "all .15s",
          }}>{PLAN_LABEL[s]}</button>
        );
      })}
    </div>
  );
}

function AthleteCard({ p, plan, onSet }) {
  const e = window.VGM.ELIGIBILITY[p.eligibility];
  const lowest = p.elig.failing[0] || p.elig.watch[0] || null;
  return (
    <Panel pad="0" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 110, background: "repeating-linear-gradient(135deg, var(--navy-700) 0 9px, var(--navy-750) 9px 18px)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `2px solid ${e.color}` }}>
        <Avatar name={p.name} size={60} square />
        <div style={{ position: "absolute", top: 12, right: 12 }}><GpaBadge gpa={p.gpa} size={42} /></div>
        <span className="stat" style={{ position: "absolute", top: 12, left: 12, fontSize: 18, color: "rgba(255,255,255,0.6)" }}>#{p.num}</span>
        <span className="mono-cap" style={{ position: "absolute", bottom: 9, left: 12, fontSize: 9, color: "var(--gray)" }}>Photo</span>
      </div>
      <div style={{ padding: "15px 16px 17px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--white)" }}>{p.name}</span>
            <EligibilityPill status={p.eligibility} small useShort />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--gray)", marginTop: 4 }}>{p.pos} · {p.cls} · {window.VGM.TIERS[p.tier].label}</div>
        </div>
        <div style={{ fontSize: 11.5, color: lowest ? "var(--gold)" : "var(--gray)", minHeight: 16 }}>
          {lowest ? `${lowest.subject} ${lowest.grade} · ${lowest.teacher}` : "All courses passing"}
        </div>
        <PlanStepper value={plan} onSet={(s) => onSet(p.id, s)} />
      </div>
    </Panel>
  );
}

const FILTERS = [
  ["all", "All"], ["ELIGIBLE", "Eligible"], ["WARNING", "On Watch"], ["INELIGIBLE", "Ineligible"], ["PENDING", "Awaiting Grades"],
];

function ActivationScreen() {
  const ALL = window.VGM.PLAYERS;
  const TOTAL_SLOTS = 12;
  const [plans, setPlans] = useState(() => Object.fromEntries(ALL.map(p => [p.id, p.eligibility === "INELIGIBLE" ? "TUTORING" : "NONE"])));
  const [filter, setFilter] = useState("all");
  const [flash, setFlash] = useState(false);

  const usedSlots = useMemo(() => Object.values(plans).filter(usesSlot).length, [plans]);
  const remaining = TOTAL_SLOTS - usedSlots;

  function setPlan(id, next) {
    const cur = plans[id];
    if (cur === next) return;
    const willUse = usesSlot(next) && !usesSlot(cur);
    if (willUse && remaining <= 0) { setFlash(true); setTimeout(() => setFlash(false), 600); return; }
    setPlans(s => ({ ...s, [id]: next }));
  }

  const list = useMemo(() => filter === "all" ? ALL : ALL.filter(p => p.eligibility === filter), [filter]);
  const counts = useMemo(() => {
    const c = { ELIGIBLE: 0, WARNING: 0, INELIGIBLE: 0, PENDING: 0 };
    ALL.forEach(p => c[p.eligibility]++); return c;
  }, []);

  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <Eyebrow>Eligibility Manager</Eyebrow>
          <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>No Pass, No Play</h1>
          <div style={{ fontSize: 12.5, color: "var(--gray)", marginTop: 6 }}>{window.VGM.PROGRAM.gradingPeriod} · {window.VGM.PROGRAM.periodWeek} · next UIL check {window.VGM.PROGRAM.nextCheck}</div>
        </div>
        <Panel pad="12px 20px" style={{
          display: "flex", alignItems: "center", gap: 12,
          borderColor: flash ? "#FF6B5E" : "var(--hair)", transition: "border-color .2s",
        }}>
          <div style={{ textAlign: "right" }}>
            <span className="stat" style={{ fontSize: 30, color: remaining <= 2 ? "var(--gold)" : "var(--teal)", lineHeight: 1 }}>{remaining}</span>
          </div>
          <div style={{ borderLeft: "1px solid var(--hair)", paddingLeft: 12 }}>
            <div className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Tutoring Slots</div>
            <div className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Available</div>
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map(([k, lbl]) => {
          const active = filter === k;
          const n = k === "all" ? ALL.length : counts[k];
          return (
            <button key={k} onClick={() => setFilter(k)} style={{
              border: `1px solid ${active ? "var(--teal-line)" : "var(--hair-2)"}`,
              background: active ? "var(--teal-dim)" : "transparent",
              color: active ? "var(--teal)" : "var(--gray)",
              borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              {lbl}<span style={{ fontSize: 11, opacity: 0.7 }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))", gap: "var(--gap)" }}>
        {list.map(p => <AthleteCard key={p.id} p={p} plan={plans[p.id]} onSet={setPlan} />)}
      </div>
      {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--gray)" }}>No players in this status.</div>}
    </div>
  );
}

window.EligibilityScreen = ActivationScreen;
