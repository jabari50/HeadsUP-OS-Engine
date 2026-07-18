// screen_development.jsx → Player Development Tracker
const { OvrBadge, TierBadge, EligibilityPill, Panel, Eyebrow } = window;
const { useState } = React;

function DeltaChip({ delta, suffix = "", invert }) {
  const good = invert ? delta < 0 : delta > 0;
  const flat = delta === 0;
  const color = flat ? "var(--gray)" : good ? "var(--teal)" : "#FF6B5E";
  const sign = delta > 0 ? "+" : "";
  return (
    <span className="mono-cap" style={{ fontSize: 9.5, color, display: "inline-flex", alignItems: "center", gap: 3 }}>
      {!flat && <span style={{ fontSize: 8 }}>{good ? "▲" : "▼"}</span>}{sign}{delta}{suffix}
    </span>
  );
}

function AttrBar({ a }) {
  const pct = ((a.value - 45) / (99 - 45)) * 100;
  const basePct = ((a.baseline - 45) / (99 - 45)) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--white)" }}>{a.key}</span>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
          <span className="stat" style={{ fontSize: 16, color: "var(--teal)" }}>{a.value}</span>
          <DeltaChip delta={a.delta} />
        </span>
      </div>
      <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: basePct + "%", background: "rgba(255,255,255,0.16)" }}></div>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct + "%", background: "var(--teal)", borderRadius: 999, animation: "barGrow .7s cubic-bezier(.2,.7,.2,1)" }}></div>
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  const W = 560, H = 120, pad = 14;
  const min = Math.min(...data) - 2, max = Math.max(...data) + 2;
  const x = i => pad + (i / (data.length - 1)) * (W - pad * 2);
  const y = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const line = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 110, display: "block" }}>
      <defs>
        <linearGradient id="devgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#devgrad)" />
      <polyline points={line} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 4 : 2.5} fill={i === data.length - 1 ? "var(--teal)" : "var(--navy-600)"} stroke="var(--teal)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

function PhysicalCell({ m }) {
  return (
    <div style={{ padding: "14px 16px", background: "var(--navy-750)", borderRadius: 10, border: "1px solid var(--hair)" }}>
      <span className="mono-cap" style={{ fontSize: 9, color: "var(--gray)" }}>{m.key}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
        <span className="stat" style={{ fontSize: 26, color: "var(--white)", lineHeight: 1 }}>{m.cur}</span>
        <span style={{ fontSize: 11, color: "var(--gray)" }}>{m.unit}</span>
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <DeltaChip delta={m.delta} invert={!m.higher} />
        <span style={{ fontSize: 10, color: "var(--gray)" }}>from {m.base}{m.unit === "s" ? "s" : ""}</span>
      </div>
    </div>
  );
}

const GOAL_STATUS = {
  "Achieved": { c: "var(--teal)", b: "var(--teal-dim)", l: "var(--teal-line)" },
  "On Track": { c: "var(--gold)", b: "rgba(245,197,24,0.12)", l: "rgba(245,197,24,0.4)" },
  "Behind":   { c: "#FF6B5E", b: "rgba(255,107,94,0.1)", l: "rgba(255,107,94,0.4)" },
};
function GoalRow({ g }) {
  const s = GOAL_STATUS[g.status];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 14, borderBottom: "1px solid var(--hair)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--white)" }}>{g.label}</div>
          <div style={{ fontSize: 11.5, color: "var(--gray)", marginTop: 2 }}>Target · {g.target}</div>
        </div>
        <span className="mono-cap" style={{ fontSize: 9, color: s.c, background: s.b, border: `1px solid ${s.l}`, borderRadius: 5, padding: "4px 9px", flex: "0 0 auto" }}>{g.status}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: g.progress + "%", height: "100%", background: s.c, borderRadius: 999, animation: "barGrow .7s cubic-bezier(.2,.7,.2,1)" }}></div>
        </div>
        <span className="stat" style={{ fontSize: 13, color: "var(--white)", width: 34, textAlign: "right" }}>{g.progress}%</span>
      </div>
    </div>
  );
}

function PlayerRailItem({ p, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
      padding: "11px 13px", borderRadius: 9, border: "1px solid " + (active ? "var(--teal-line)" : "transparent"),
      background: active ? "var(--teal-dim)" : "transparent", transition: "all .14s",
    }}>
      <span className="stat" style={{ fontSize: 15, color: "var(--gray)", width: 30, flex: "0 0 auto" }}>#{p.num}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
        <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{p.pos} · {p.cls}</div>
      </div>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, flex: "0 0 auto" }}>
        <span className="stat" style={{ fontSize: 15, color: "var(--teal)" }}>{p.ovr}</span>
        <span className="mono-cap" style={{ fontSize: 8, color: p.dev.indexDelta > 0 ? "var(--teal)" : "var(--gray)" }}>{p.dev.indexDelta > 0 ? "+" + p.dev.indexDelta : ""}</span>
      </span>
    </button>
  );
}

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function DevelopmentScreen() {
  const ALL = window.VGM.PLAYERS;
  const [sel, setSel] = useState(ALL[0].id);
  const [logs, setLogs] = useState({}); // id -> [extra evals]
  const [draft, setDraft] = useState("");
  const p = ALL.find(x => x.id === sel);
  const d = p.dev;
  const evals = [...(logs[sel] || []), ...d.evals];

  function addLog() {
    if (!draft.trim()) return;
    setLogs(s => ({ ...s, [sel]: [{ date: "Today", coach: "Coach Briggs", note: draft.trim() }, ...(s[sel] || [])] }));
    setDraft("");
  }

  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div>
        <Eyebrow>Player Development</Eyebrow>
        <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>Development Tracker</h1>
      </div>

      <div className="acad-grid" style={{ display: "grid", gridTemplateColumns: "286px minmax(0,1fr)", gap: "var(--gap)", alignItems: "start" }}>
        {/* Player rail */}
        <Panel pad="14px" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Eyebrow color="var(--gray)" style={{ fontSize: 9.5, padding: "4px 8px 10px" }}>Roster · index & season change</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "62vh", overflowY: "auto" }}>
            {ALL.map(x => <PlayerRailItem key={x.id} p={x} active={x.id === sel} onClick={() => setSel(x.id)} />)}
          </div>
        </Panel>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {/* Header + trend */}
          <Panel pad="22px 24px" style={{ borderTop: "2px solid var(--teal)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <OvrBadge ovr={d.index} size={58} label="DEV INDEX" />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="stat" style={{ fontSize: 18, color: "var(--gray)" }}>#{p.num}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--white)" }}>{p.name}</span>
                    <TierBadge tier={p.tier} small />
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--gray)", marginTop: 4 }}>{p.pos} · {p.cls} · {p.ht}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "flex-end" }}>
                  <DeltaChip delta={d.indexDelta} />
                  <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>since season start</span>
                </div>
                <EligibilityPill status={p.eligibility} small useShort />
              </div>
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--hair)", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Development Index · 6-month trend</span>
              </div>
              <TrendChart data={d.idxHist} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px" }}>
                {MONTHS.map(m => <span key={m} className="mono-cap" style={{ fontSize: 9, color: "var(--gray)" }}>{m}</span>)}
              </div>
            </div>
          </Panel>

          {/* Skills */}
          <Panel pad="22px 24px">
            <Eyebrow style={{ marginBottom: 18 }}>Skill Attributes <span style={{ color: "var(--gray)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· faded bar = season baseline</span></Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px 32px" }}>
              {d.attrs.map(a => <AttrBar key={a.key} a={a} />)}
            </div>
          </Panel>

          {/* Physical + Goals */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--gap)", alignItems: "start" }}>
            <Panel pad="22px 24px">
              <Eyebrow style={{ marginBottom: 16 }}>Physical Testing</Eyebrow>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {d.physical.map(m => <PhysicalCell key={m.key} m={m} />)}
              </div>
            </Panel>
            <Panel pad="22px 24px">
              <Eyebrow style={{ marginBottom: 16 }}>Development Goals</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {d.goals.map((g, i) => <GoalRow key={i} g={g} />)}
              </div>
            </Panel>
          </div>

          {/* Evaluations */}
          <Panel pad="22px 24px">
            <Eyebrow style={{ marginBottom: 16 }}>Coach Evaluations</Eyebrow>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && addLog()} placeholder="Log a development note…" style={{
                flex: 1, padding: "11px 13px", borderRadius: 8, background: "var(--navy-700)", color: "var(--white)", border: "1px solid var(--hair-2)", fontSize: 13,
              }} />
              <button onClick={addLog} style={{ padding: "11px 20px", borderRadius: 8, border: "none", background: "var(--teal)", color: "#0C1830", fontWeight: 700, fontSize: 13 }}>Log</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {evals.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16, marginBottom: 16, borderBottom: i < evals.length - 1 ? "1px solid var(--hair)" : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto", width: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "var(--teal)" : "var(--navy-600)", border: "2px solid var(--teal)", marginTop: 4 }}></span>
                    {i < evals.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--hair)", marginTop: 4 }}></span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="mono-cap" style={{ fontSize: 10, color: "var(--teal)" }}>{e.date}</span>
                      <span style={{ fontSize: 11.5, color: "var(--gray)" }}>{e.coach}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--white)", lineHeight: 1.5, marginTop: 5 }}>{e.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

window.DevelopmentScreen = DevelopmentScreen;
