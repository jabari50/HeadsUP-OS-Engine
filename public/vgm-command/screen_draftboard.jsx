// screen_draftboard.jsx → Team Roster
const { OvrBadge, TierBadge, EligibilityPill, Panel, Eyebrow } = window;
const { useState, useMemo } = React;

function Select({ label, value, options, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          appearance: "none", WebkitAppearance: "none",
          width: "100%", padding: "9px 30px 9px 12px", borderRadius: 8,
          background: "var(--navy-700)", color: "var(--white)",
          border: "1px solid var(--hair-2)", fontSize: 13, fontWeight: 500,
        }}>
          {options.map(o => <option key={o.v || o} value={o.v || o} style={{ background: "#142A4E" }}>{o.l || o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--gray)", fontSize: 10 }}>▼</span>
      </div>
    </label>
  );
}

function SortToggle({ value, onChange }) {
  const opts = [["ovr", "Rating"], ["gpa", "GPA"], ["eligibility", "Eligibility"], ["num", "Jersey #"]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Sort By</span>
      <div style={{ display: "inline-flex", background: "var(--navy-700)", border: "1px solid var(--hair-2)", borderRadius: 8, padding: 3, gap: 2 }}>
        {opts.map(([k, lbl]) => (
          <button key={k} onClick={() => onChange(k)} className="mono-cap" style={{
            border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 10.5,
            background: value === k ? "var(--teal)" : "transparent",
            color: value === k ? "#0C1830" : "var(--gray)",
            letterSpacing: "0.08em", transition: "all .15s",
          }}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

function GpaCell({ gpa }) {
  const pct = Math.max(0, Math.min(100, (gpa / 4) * 100));
  const color = gpa >= 3.0 ? "var(--teal)" : gpa >= 2.0 ? "var(--gold)" : "#FF6B5E";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999, animation: "barGrow 0.7s cubic-bezier(.2,.7,.2,1)" }}></div>
      </div>
      <span className="stat" style={{ fontSize: 14, color: "var(--white)", width: 34, textAlign: "right", flex: "0 0 auto" }}>{gpa.toFixed(2)}</span>
    </div>
  );
}

function RosterRow({ p }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: "grid",
      gridTemplateColumns: "44px 56px minmax(0,2.4fr) minmax(140px,1.4fr) 110px minmax(150px,1.3fr)",
      alignItems: "center", gap: 16,
      padding: "14px 18px",
      background: hover ? "var(--navy-700)" : "transparent",
      borderBottom: "1px solid var(--hair)",
      transition: "background .15s",
    }}>
      <span className="stat" style={{ fontSize: 22, color: "var(--gray)", textAlign: "center" }}>#{p.num}</span>
      <OvrBadge ovr={p.ovr} size={48} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--white)" }}>{p.name}</span>
          <TierBadge tier={p.tier} small />
        </div>
        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.pos} · {p.cls} · {p.ht} · {p.traits.join(" · ")}
        </div>
      </div>
      <div className="db-traits" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="mono-cap" style={{ fontSize: 9, color: "var(--gray)" }}>Grades Reported</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: p.reportedCount < p.classCount ? "var(--gold)" : "var(--white)" }}>{p.reportedCount}/{p.classCount} teachers</span>
      </div>
      <div className="db-activation"><EligibilityPill status={p.eligibility} small useShort /></div>
      <div className="db-fit"><GpaCell gpa={p.gpa} /></div>
    </div>
  );
}

const ELIG_ORDER = { INELIGIBLE: 0, WARNING: 1, PENDING: 2, ELIGIBLE: 3 };

function DraftBoardScreen() {
  const ALL = window.VGM.PLAYERS;
  const [pos, setPos] = useState("All");
  const [cls, setCls] = useState("All");
  const [role, setRole] = useState("All");
  const [elig, setElig] = useState("All");
  const [sort, setSort] = useState("ovr");

  const roleOpts = [{ v: "All", l: "All" }, ...window.VGM.ROLES.map(r => ({ v: r, l: window.VGM.TIERS[r].label }))];
  const eligOpts = [{ v: "All", l: "All" }, { v: "ELIGIBLE", l: "Eligible" }, { v: "WARNING", l: "On Watch" }, { v: "INELIGIBLE", l: "Ineligible" }, { v: "PENDING", l: "Awaiting Grades" }];

  const list = useMemo(() => {
    let r = ALL.filter(p =>
      (pos === "All" || p.pos === pos) &&
      (cls === "All" || p.cls === cls) &&
      (role === "All" || p.role === role) &&
      (elig === "All" || p.eligibility === elig)
    );
    const sorters = {
      ovr: (a, b) => b.ovr - a.ovr,
      gpa: (a, b) => b.gpa - a.gpa,
      eligibility: (a, b) => ELIG_ORDER[a.eligibility] - ELIG_ORDER[b.eligibility] || b.ovr - a.ovr,
      num: (a, b) => a.num - b.num,
    };
    return [...r].sort(sorters[sort]);
  }, [pos, cls, role, elig, sort]);

  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
        <div>
          <Eyebrow>Team Roster</Eyebrow>
          <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>Varsity Depth Chart</h1>
        </div>
        <span style={{ fontSize: 13, color: "var(--gray)" }}><b style={{ color: "var(--white)" }}>{list.length}</b> of {ALL.length} players</span>
      </div>

      <Panel pad="18px 20px">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(124px, 1fr))", gap: 14, flex: 1, minWidth: 260 }}>
            <Select label="Position" value={pos} options={["All", ...window.VGM.POSITIONS]} onChange={setPos} />
            <Select label="Class" value={cls} options={["All", ...window.VGM.CLASSES]} onChange={setCls} />
            <Select label="Role" value={role} options={roleOpts} onChange={setRole} />
            <Select label="Eligibility" value={elig} options={eligOpts} onChange={setElig} />
          </div>
          <SortToggle value={sort} onChange={setSort} />
        </div>
      </Panel>

      <Panel pad="0" style={{ overflow: "hidden" }}>
        <div className="db-headrow mono-cap" style={{
          display: "grid",
          gridTemplateColumns: "44px 56px minmax(0,2.4fr) minmax(140px,1.4fr) 110px minmax(150px,1.3fr)",
          gap: 16, padding: "12px 18px", fontSize: 9.5, color: "var(--gray)",
          borderBottom: "1px solid var(--hair-2)", background: "var(--navy-750)",
        }}>
          <span style={{ textAlign: "center" }}>No.</span>
          <span>Rating</span>
          <span>Player</span>
          <span>Accountability</span>
          <span>Eligibility</span>
          <span>GPA</span>
        </div>
        {list.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--gray)", fontSize: 14 }}>No players match these filters.</div>
        ) : list.map((p) => <RosterRow key={p.id} p={p} />)}
      </Panel>
    </div>
  );
}

window.RosterScreen = DraftBoardScreen;
