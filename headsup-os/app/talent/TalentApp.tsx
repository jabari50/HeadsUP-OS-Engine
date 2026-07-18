"use client";

// Talent Intelligence module — React port of the "HeadsUp OS.dc.html" Claude
// Design prototype (project: Talent Intelligence Platform Design). Visuals and
// scoring are kept 1:1 with the reviewed design; persistence is localStorage
// (hu_intakes / hu_evals), matching the prototype's contract.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import playersJson from "@/lib/talent/players.json";
import alumniJson from "@/lib/talent/alumni.json";
import {
  EMPTY_INTAKE, LETTERS, LPTS, SKILLS, TRAITS, XPL,
  gcolor, intakeToPlayer, neckUpFrom, scolor, xp, xpLevel, xpMilestones,
  type Alumnus, type Grade, type IntakeForm, type Player,
} from "@/lib/talent/engine";

const BASE_PLAYERS = playersJson as unknown as Player[];
const ALUMNI = alumniJson as unknown as Alumnus[];

type View = "dashboard" | "database" | "alumni" | "compare" | "onboard" | "eval" | "profile";
type Tier = "NBA" | "G League" | "NCAA D1";

const TIER_COLORS: Record<Tier, string> = {
  NBA: "#2fbf8f", "G League": "#5aa0e8", "NCAA D1": "#9a92f0",
};
const TIERS: Tier[] = ["NBA", "G League", "NCAA D1"];

const cond: CSSProperties = { fontFamily: "var(--font-barlow-cond), sans-serif" };
const card: CSSProperties = {
  background: "#181b17", border: "1px solid #2a2d28", borderRadius: 12, overflow: "hidden",
};
const cardHead: CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid #23261f",
  display: "flex", alignItems: "center", gap: 8,
};
const cardTitle: CSSProperties = {
  ...cond, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
};
const dot = (c: string): CSSProperties => ({
  width: 7, height: 7, borderRadius: "50%", background: c,
});
const kicker: CSSProperties = {
  fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#71705f", marginBottom: 4,
};
const h1: CSSProperties = {
  ...cond, fontSize: 32, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
};
const inputStyle: CSSProperties = {
  background: "#181b17", border: "1px solid #2a2d28", borderRadius: 8, padding: "9px 14px",
  color: "#e8e6dd", fontFamily: "var(--font-barlow), sans-serif", fontSize: 13,
};
const formField: CSSProperties = {
  width: "100%", background: "#101210", border: "1px solid #2a2d28", borderRadius: 8,
  padding: "10px 12px", color: "#e8e6dd", fontFamily: "var(--font-barlow), sans-serif", fontSize: 14,
};
const formLabel: CSSProperties = {
  fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: "#8a897f", marginBottom: 4,
};
const selectStyle: CSSProperties = {
  background: "#181b17", border: "1px solid #2a2d28", borderRadius: 8, padding: "8px 10px",
  color: "#e8e6dd", fontFamily: "var(--font-barlow), sans-serif", fontSize: 13,
};

function Field({
  label, value, onChange, placeholder, area, rows,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; area?: boolean; rows?: number;
}) {
  return (
    <div>
      <div style={formLabel}>{label}</div>
      {area ? (
        <textarea
          value={value} rows={rows ?? 3} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...formField, resize: "vertical" }}
        />
      ) : (
        <input
          value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={formField}
        />
      )}
    </div>
  );
}

function GradeBar({ name, grade, big }: { name: string; grade?: Grade | null; big?: boolean }) {
  const color = gcolor(grade);
  const pct = grade ? ((LPTS[grade] - 60) / 40) * 100 + "%" : "0%";
  return (
    <div style={{ padding: big ? "6px 0" : "5px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, color: "#c9c7bb" }}>{name}</span>
        <span style={{ ...cond, fontSize: big ? 19 : 18, fontWeight: 800, color }}>
          {grade || "·"}
        </span>
      </div>
      <div style={{ height: 3, background: "#101210", borderRadius: 2, marginTop: 4 }}>
        <div style={{ height: 3, borderRadius: 2, background: color, width: pct }} />
      </div>
    </div>
  );
}

const DB_GRID = "2.4fr .7fr .7fr .7fr .7fr .7fr .9fr .9fr 1.2fr";
const AL_GRID = "1.6fr 1.4fr 1.5fr 1.5fr .5fr .6fr";

export default function TalentApp({
  coachView = false,
  pendingFirst = false,
}: {
  coachView?: boolean;
  pendingFirst?: boolean;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [selId, setSelId] = useState<string | null>(null);

  // database filters
  const [q, setQ] = useState("");
  const [fClass, setFClass] = useState("All");
  const [fPos, setFPos] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [sortKey, setSortKey] = useState("nu");
  const [sortDir, setSortDir] = useState(-1); // -1 = descending

  // compare
  const [cmpA, setCmpA] = useState("");
  const [cmpB, setCmpB] = useState("");

  // onboarding
  const [obStep, setObStep] = useState(1);
  const [obDone, setObDone] = useState(false);
  const [obDoneId, setObDoneId] = useState<string | null>(null);
  const [obError, setObError] = useState("");
  const [ob, setOb] = useState<IntakeForm>(EMPTY_INTAKE);

  // alumni
  const [aTier, setATier] = useState<Tier>("NBA");
  const [aQ, setAQ] = useState("");

  // evaluator
  const [evId, setEvId] = useState<string | null>(null);
  const [evTraits, setEvTraits] = useState<Partial<Record<string, Grade>>>({});
  const [evSkills, setEvSkills] = useState<Partial<Record<string, Grade>>>({});
  const [evNotes, setEvNotes] = useState("");
  const [evSaved, setEvSaved] = useState(false);

  // Hydrate from localStorage after mount — localStorage is unavailable during
  // SSR, so this cannot move into the useState initializer.
  useEffect(() => {
    let intakes: Player[] = [];
    let evals: Record<string, { traits: Partial<Record<string, Grade>>; skills: Partial<Record<string, Grade>>; notes: string }> = {};
    try { intakes = JSON.parse(localStorage.getItem("hu_intakes") || "[]"); } catch {}
    try { evals = JSON.parse(localStorage.getItem("hu_evals") || "{}"); } catch {}
    const base = [...intakes, ...BASE_PLAYERS];
    const merged = base.map((p) => {
      const ev = evals[p.id];
      if (!ev) return p;
      const traits = { ...p.traits, ...ev.traits };
      return {
        ...p, traits, skills: { ...p.skills, ...ev.skills },
        evalNotes: ev.notes, evaluated: true, neckUp: neckUpFrom(traits),
      };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayers(merged);
    setLoaded(true);
  }, []);

  const byId = (id: string | null) => (id ? players.find((p) => p.id === id) : undefined);
  const pending = players.filter((p) => !p.evaluated);

  const openProfile = (id: string) => { setView("profile"); setSelId(id); };

  function submitIntake() {
    const p = intakeToPlayer(ob);
    try {
      const intakes = JSON.parse(localStorage.getItem("hu_intakes") || "[]");
      intakes.unshift(p);
      localStorage.setItem("hu_intakes", JSON.stringify(intakes));
    } catch {}
    setPlayers((prev) => [p, ...prev]);
    setObDone(true);
    setObDoneId(p.id);
    setObError("");
  }

  function saveEval() {
    if (!evId) return;
    try {
      const evals = JSON.parse(localStorage.getItem("hu_evals") || "{}");
      evals[evId] = { traits: evTraits, skills: evSkills, notes: evNotes };
      localStorage.setItem("hu_evals", JSON.stringify(evals));
    } catch {}
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== evId) return p;
        const traits = { ...(p.traits || {}), ...evTraits };
        return {
          ...p, traits, skills: { ...(p.skills || {}), ...evSkills },
          evalNotes: evNotes, evaluated: true, neckUp: neckUpFrom(traits),
        };
      })
    );
    setEvSaved(true);
    setTimeout(() => setEvSaved(false), 2500);
  }

  // ---- derived: database rows ----
  const dbRows = useMemo(() => {
    const ql = q.toLowerCase();
    const rows = players.filter((p) => {
      if (ql && !(p.name + " " + (p.school || "") + " " + (p.aau || "")).toLowerCase().includes(ql)) return false;
      if (fClass !== "All" && String(p.class) !== fClass) return false;
      if (fPos !== "All" && p.pos !== fPos) return false;
      if (fStatus === "Evaluated" && !p.evaluated) return false;
      if (fStatus === "Pending" && p.evaluated) return false;
      if (fStatus === "NIL" && !p.nil) return false;
      return true;
    });
    const keyFns: Record<string, (p: Player) => string | number> = {
      name: (p) => p.name, class: (p) => p.class || 0, pos: (p) => p.pos,
      ht: (p) => p.hin || 0, gpa: (p) => p.gpa || 0,
      ppg: (p) => (p.stats && p.stats.ppg) || 0,
      nu: (p) => p.neckUp || 0, nd: (p) => p.neckDown || 0,
    };
    const kf = keyFns[sortKey] || keyFns.nu;
    rows.sort((a, b) => {
      const x = kf(a), y = kf(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });
    if (pendingFirst) rows.sort((a, b) => (a.evaluated ? 1 : 0) - (b.evaluated ? 1 : 0));
    return rows;
  }, [players, q, fClass, fPos, fStatus, sortKey, sortDir, pendingFirst]);

  const posOpts = useMemo(
    () => ["All", ...[...new Set(players.map((p) => p.pos))].filter((p) => p && p !== "—").sort()],
    [players]
  );

  if (!loaded) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101210", color: "#71705f", fontFamily: "var(--font-barlow), sans-serif" }}>
        Loading pipeline…
      </div>
    );
  }

  // ---- nav ----
  const navDefs: [View, string, number?][] = [
    ["dashboard", "Dashboard"], ["database", "Database"], ["alumni", "Alumni"], ["compare", "Compare"],
    ...(coachView ? [] : ([["onboard", "Onboarding"], ["eval", "Evaluator", pending.length]] as [View, string, number?][])),
  ];

  const sel = view === "profile" ? byId(selId) : undefined;
  const ep = byId(evId);

  return (
    <div
      className="hu-talent"
      style={{
        display: "flex", height: "100vh", background: "#101210", color: "#e8e6dd",
        fontFamily: "var(--font-barlow), sans-serif", overflow: "hidden",
      }}
    >
      <style>{`
        .hu-talent ::-webkit-scrollbar{width:10px;height:10px;}
        .hu-talent ::-webkit-scrollbar-thumb{background:#2a2d28;border-radius:5px;}
        .hu-talent ::-webkit-scrollbar-track{background:transparent;}
        .hu-talent input:focus,.hu-talent select:focus,.hu-talent textarea:focus{outline:1px solid #2fbf8f;outline-offset:0;}
        .hu-talent input::placeholder,.hu-talent textarea::placeholder{color:#5c5b52;}
        .hu-talent select option{background:#181b17;}
        .hu-talent a{color:#2fbf8f;text-decoration:none;}
        .hu-talent a:hover{color:#5ad6ac;}
      `}</style>

      {/* ============ SIDEBAR ============ */}
      <div style={{ width: 216, flex: "none", display: "flex", flexDirection: "column", background: "#141613", borderRight: "1px solid #23261f" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg,#1D9E75 0%,#378ADD 30%,#7F77DD 60%,#D4537E 80%,#D85A30 100%)" }} />
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #23261f" }}>
          <div style={{ ...cond, fontSize: 22, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", lineHeight: 1 }}>
            HeadsUp <span style={{ color: "#2fbf8f" }}>OS</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#71705f", marginTop: 5 }}>
            Talent Intelligence
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 10px" }}>
          {navDefs.map(([v, label, badge]) => {
            const active = view === v || (v === "database" && view === "profile");
            return (
              <div
                key={v}
                onClick={() => setView(v)}
                className="hover:bg-[#1d201c]"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                  background: active ? "#1f2b23" : "transparent",
                }}
              >
                <span style={{ ...cond, fontSize: 14, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: active ? "#2fbf8f" : "#8a897f" }}>
                  {label}
                </span>
                {!!badge && (
                  <span style={{ ...cond, fontSize: 11, fontWeight: 700, background: "#3a2c14", color: "#d99a3d", borderRadius: 9, padding: "1px 7px" }}>
                    {badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", padding: "16px 18px", borderTop: "1px solid #23261f" }}>
          <div style={{ ...cond, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#71705f" }}>
            Neural Data Agency
          </div>
          <div style={{ fontSize: 10, color: "#4f4e45", marginTop: 2 }}>
            25 yrs behavioral intel · Dallas, TX
          </div>
        </div>
      </div>

      {/* ============ MAIN ============ */}
      <div style={{ flex: 1, overflowY: "auto", padding: "26px 32px 60px", minWidth: 0 }}>
        {view === "dashboard" && (
          <Dashboard
            players={players} pending={pending}
            onOpen={openProfile} onGo={setView}
          />
        )}

        {view === "database" && (
          <>
            <div style={kicker}>Player Database</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16 }}>
              <div style={h1}>Roster Intelligence</div>
              <div style={{ fontSize: 13, color: "#8a897f" }}>{dbRows.length} players shown</div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, school, AAU program…"
                style={{ ...inputStyle, width: 280 }}
              />
              <div style={{ display: "flex", gap: 4 }}>
                {["All", "2025", "2026", "2027", "2028"].map((c) => {
                  const on = fClass === c;
                  return (
                    <div
                      key={c} onClick={() => setFClass(c)}
                      style={{
                        ...cond, fontSize: 13, fontWeight: 600, letterSpacing: 1, padding: "6px 13px",
                        borderRadius: 16, cursor: "pointer",
                        border: `1px solid ${on ? "#2fbf8f" : "#2a2d28"}`,
                        background: on ? "#1f2b23" : "transparent",
                        color: on ? "#2fbf8f" : "#8a897f",
                      }}
                    >
                      {c === "All" ? "All Classes" : c}
                    </div>
                  );
                })}
              </div>
              <select value={fPos} onChange={(e) => setFPos(e.target.value)} style={selectStyle}>
                {posOpts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={selectStyle}>
                <option value="All">All statuses</option>
                <option value="Evaluated">Evaluated</option>
                <option value="Pending">Evaluation pending</option>
                <option value="NIL">NIL interested</option>
              </select>
            </div>

            <div style={card}>
              <div style={{ display: "grid", gridTemplateColumns: DB_GRID, padding: "10px 16px", borderBottom: "1px solid #2a2d28", background: "#141613" }}>
                {([["name", "Player"], ["class", "Class"], ["pos", "Pos"], ["ht", "HT"], ["gpa", "GPA"], ["ppg", "PPG"], ["nu", "Neck Up"], ["nd", "Neck Dn"], ["st", "Status"]] as [string, string][]).map(([k, label]) => (
                  <div
                    key={k}
                    onClick={() => {
                      if (k === "st") return;
                      if (sortKey === k) setSortDir(-sortDir);
                      else { setSortKey(k); setSortDir(-1); }
                    }}
                    style={{ ...cond, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: sortKey === k ? "#2fbf8f" : "#71705f", cursor: "pointer", userSelect: "none" }}
                  >
                    {label}{sortKey === k ? (sortDir === -1 ? " ↓" : " ↑") : ""}
                  </div>
                ))}
              </div>
              {dbRows.map((p) => (
                <div
                  key={p.id}
                  onClick={() => openProfile(p.id)}
                  className="hover:bg-[#1d201c]"
                  style={{ display: "grid", gridTemplateColumns: DB_GRID, padding: "9px 16px", borderBottom: "1px solid #1e211c", cursor: "pointer", alignItems: "center" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: "#71705f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {[p.school, p.aau && "AAU: " + p.aau.slice(0, 26)].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#c9c7bb" }}>{p.class || "—"}</div>
                  <div style={{ ...cond, fontSize: 13, fontWeight: 600, letterSpacing: 1, color: "#c9c7bb" }}>{p.pos}</div>
                  <div style={{ fontSize: 13, color: "#c9c7bb" }}>{p.height || "—"}</div>
                  <div style={{ fontSize: 13, color: p.gpa != null ? (p.gpa >= 3.5 ? "#2fbf8f" : p.gpa >= 3.0 ? "#c9c7bb" : "#d99a3d") : "#4f4e45" }}>
                    {p.gpa != null ? p.gpa.toFixed(2) : "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "#c9c7bb" }}>{p.stats && p.stats.ppg != null ? p.stats.ppg : "—"}</div>
                  <div style={{ ...cond, fontSize: 16, fontWeight: 800, color: p.neckUp ? scolor(p.neckUp) : "#4f4e45" }}>{p.neckUp ?? "—"}</div>
                  <div style={{ ...cond, fontSize: 16, fontWeight: 800, color: "#5aa0e8" }}>{p.neckDown ?? "—"}</div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: p.evaluated ? "#152e24" : "#3a2c14", color: p.evaluated ? "#2fbf8f" : "#d99a3d" }}>
                      {p.evaluated ? (p.nil ? "Evaluated · NIL" : "Evaluated") : "Pending Eval"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === "alumni" && (
          <>
            <div style={kicker}>Historical · Longitudinal · Manually Scouted</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16 }}>
              <div style={h1}>The Proof — DFW Alumni Ledger</div>
              <div style={{ fontSize: 13, color: "#8a897f" }}>Every name below came through this pipeline</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              {TIERS.map((t) => {
                const on = aTier === t;
                const count = ALUMNI.filter((a) => a.level === t).length;
                return (
                  <div
                    key={t} onClick={() => setATier(t)}
                    style={{
                      display: "flex", alignItems: "baseline", gap: 8, padding: "10px 18px",
                      borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${on ? TIER_COLORS[t] : "#2a2d28"}`,
                      background: on ? "#181b17" : "transparent",
                    }}
                  >
                    <span style={{ ...cond, fontSize: 24, fontWeight: 800, lineHeight: 1, color: on ? TIER_COLORS[t] : "#71705f" }}>{count}</span>
                    <span style={{ ...cond, fontSize: 14, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: on ? "#e8e6dd" : "#71705f" }}>{t}</span>
                  </div>
                );
              })}
              <input
                value={aQ} onChange={(e) => setAQ(e.target.value)}
                placeholder="Search player, high school, college…"
                style={{ ...inputStyle, padding: "10px 14px", width: 280, marginLeft: "auto" }}
              />
            </div>
            <div style={card}>
              <div style={{ display: "grid", gridTemplateColumns: AL_GRID, padding: "10px 16px", borderBottom: "1px solid #2a2d28", background: "#141613" }}>
                {["Player", "DFW High School", "College Path", "Current Team", "HT", "Pos"].map((h) => (
                  <div key={h} style={{ ...cond, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#71705f" }}>{h}</div>
                ))}
              </div>
              {ALUMNI.filter((a) => a.level === aTier)
                .filter((a) => {
                  const s = aQ.toLowerCase();
                  return !s || (a.name + " " + a.hs + " " + a.college + " " + a.team).toLowerCase().includes(s);
                })
                .map((a) => (
                  <div key={a.name + a.hs} className="hover:bg-[#1d201c]" style={{ display: "grid", gridTemplateColumns: AL_GRID, padding: "9px 16px", borderBottom: "1px solid #1e211c", alignItems: "center" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 12.5, color: "#c9c7bb" }}>{a.hs}</div>
                    <div style={{ fontSize: 12.5, color: "#8a897f" }}>{a.college}</div>
                    <div style={{ display: "flex" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, padding: "3px 9px", borderRadius: 4, background: aTier === "NBA" ? "#152e24" : aTier === "G League" ? "#16273a" : "#221f2e", color: TIER_COLORS[aTier] }}>
                        {a.team}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#c9c7bb" }}>{a.height || "—"}</div>
                    <div style={{ ...cond, fontSize: 13, fontWeight: 600, letterSpacing: 1, color: "#c9c7bb" }}>{a.pos || "—"}</div>
                  </div>
                ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: "#71705f" }}>
              NBA & G League physicals from public listings · NCAA D1 measurables pending verification sweep.
            </div>
          </>
        )}

        {view === "profile" && sel && (
          <Profile
            p={sel} coachView={coachView}
            onBack={() => setView("database")}
            onGrade={() => {
              setView("eval"); setEvId(sel.id);
              setEvTraits({ ...(sel.traits || {}) });
              setEvSkills({ ...(sel.skills || {}) });
              setEvNotes(sel.evalNotes || "");
              setEvSaved(false);
            }}
            onCompare={() => { setView("compare"); setCmpA(sel.id); }}
          />
        )}

        {view === "compare" && (
          <Compare players={players} cmpA={cmpA} cmpB={cmpB} setCmpA={setCmpA} setCmpB={setCmpB} />
        )}

        {view === "onboard" && !coachView && (
          <Onboarding
            ob={ob} setOb={setOb} step={obStep} setStep={setObStep}
            done={obDone} error={obError} setError={setObError}
            doneP={byId(obDoneId)}
            onSubmit={submitIntake}
            onViewProfile={() => {
              if (obDoneId) { setView("profile"); setSelId(obDoneId); }
              setObDone(false); setObStep(1);
              setOb((o) => ({ ...o, name: "" }));
            }}
            onReset={() => { setObDone(false); setObStep(1); setObError(""); setOb(EMPTY_INTAKE); }}
          />
        )}

        {view === "eval" && !coachView && (
          <Evaluator
            players={players} evId={evId} ep={ep}
            evTraits={evTraits} evSkills={evSkills} evNotes={evNotes} evSaved={evSaved}
            onPick={(p) => {
              setEvId(p.id);
              setEvTraits({ ...(p.traits || {}) });
              setEvSkills({ ...(p.skills || {}) });
              setEvNotes(p.evalNotes || "");
              setEvSaved(false);
            }}
            setTrait={(t, l) => setEvTraits((prev) => ({ ...prev, [t]: l }))}
            setSkill={(s, l) => setEvSkills((prev) => ({ ...prev, [s]: l }))}
            setNotes={setEvNotes}
            onSave={saveEval}
          />
        )}
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */

function Dashboard({
  players, pending, onOpen, onGo,
}: {
  players: Player[]; pending: Player[];
  onOpen: (id: string) => void; onGo: (v: View) => void;
}) {
  const gpas = players.filter((p) => p.gpa != null).map((p) => p.gpa as number);
  const avgGpa = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : "—";
  const dashStats = [
    { value: players.length, label: "Players in Network", color: "#e8e6dd" },
    { value: players.filter((p) => p.evaluated).length, label: "Neck Up Evaluated", color: "#2fbf8f" },
    { value: pending.length, label: "Evaluations Pending", color: "#d99a3d" },
    { value: players.filter((p) => p.nil).length, label: "NIL Interested", color: "#e0699a" },
    { value: avgGpa, label: "Average GPA", color: "#9a92f0" },
  ];
  const alerts: { label: string; count: number; color: string; go: () => void }[] = [
    { label: "Players awaiting Neck Up evaluation", count: pending.length, color: "#d99a3d", go: () => onGo("eval") },
    { label: "Missing season stats", count: players.filter((p) => !p.stats || p.stats.ppg == null).length, color: "#e0713f", go: () => onGo("database") },
    { label: "Awaiting combine / athletic testing", count: players.length, color: "#5aa0e8", go: () => onGo("database") },
  ];
  const mkTop = (key: "neckUp" | "neckDown", n: number) =>
    players.filter((p) => p[key] != null)
      .sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n)
      .map((p) => ({
        id: p.id, name: p.name,
        meta: [p.class && "'" + String(p.class).slice(2), p.pos, p.school].filter(Boolean).join(" · ").slice(0, 38),
        score: p[key] as number,
      }));
  const topNU = mkTop("neckUp", 5);
  const topND = mkTop("neckDown", 5);

  const distMap: Record<string, number> = {};
  players.forEach((p) => { if (p.class) distMap[p.class] = (distMap[p.class] || 0) + 1; });
  const maxD = Math.max(1, ...Object.values(distMap));
  const classDist = Object.keys(distMap).sort().map((y) => ({
    year: y, count: distMap[y], pct: Math.round((distMap[y] / maxD) * 100) + "%",
  }));

  const recent = [...players].filter((p) => p.intakeDate)
    .sort((a, b) => ((b.intakeDate as string) < (a.intakeDate as string) ? -1 : 1)).slice(0, 5)
    .map((p) => ({
      id: p.id, name: p.name,
      meta: [p.class && "'" + String(p.class).slice(2), p.pos, p.src].filter(Boolean).join(" · "),
      date: p.intakeDate as string,
    }));

  const proofStats = TIERS.map((t) => ({
    label: t, count: ALUMNI.filter((a) => a.level === t).length, color: TIER_COLORS[t],
  }));

  const xpTop = [...players].map((p) => ({ p, x: xp(p) })).sort((a, b) => b.x - a.x).slice(0, 5)
    .map(({ p, x }) => {
      const lvl = xpLevel(x);
      return {
        id: p.id, name: p.name,
        meta: [p.class && "'" + String(p.class).slice(2), p.pos, p.school].filter(Boolean).join(" · ").slice(0, 34),
        xp: x, level: lvl.name, lvlColor: lvl.color,
      };
    });

  const rowStyle: CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0", borderBottom: "1px solid #1e211c", cursor: "pointer",
  };

  return (
    <>
      <div style={kicker}>Pipeline Overview</div>
      <div style={{ ...h1, marginBottom: 20 }}>Command Center</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 12 }}>
        {dashStats.map((st) => (
          <div key={st.label} style={{ ...card, padding: "16px 18px" }}>
            <div style={{ ...cond, fontSize: 34, fontWeight: 800, lineHeight: 1, color: st.color }}>{st.value}</div>
            <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#8a897f", marginTop: 6, lineHeight: 1.3 }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div
        onClick={() => onGo("alumni")}
        className="hover:border-[#2fbf8f]"
        style={{ ...card, display: "flex", alignItems: "center", gap: 24, padding: "14px 20px", marginBottom: 12, cursor: "pointer" }}
      >
        <div style={{ ...cond, fontSize: 15, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#e8e6dd" }}>The Longitudinal Proof</div>
        <div style={{ fontSize: 12, color: "#8a897f", flex: 1 }}>Manually scouted DFW alumni tracked from HS intake to the highest levels</div>
        <div style={{ display: "flex", gap: 22 }}>
          {proofStats.map((ps) => (
            <div key={ps.label} style={{ textAlign: "center" }}>
              <div style={{ ...cond, fontSize: 24, fontWeight: 800, lineHeight: 1, color: ps.color }}>{ps.count}</div>
              <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#71705f", marginTop: 2 }}>{ps.label}</div>
            </div>
          ))}
        </div>
        <div style={{ ...cond, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#2fbf8f" }}>View Ledger →</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
        <div style={card}>
          <div style={cardHead}><div style={dot("#d99a3d")} /><div style={cardTitle}>Action Queue</div></div>
          <div style={{ padding: "8px 16px 14px" }}>
            {alerts.map((al) => (
              <div key={al.label} onClick={al.go} className="hover:bg-[#1d201c]" style={{ ...rowStyle, padding: "8px 0" }}>
                <span style={{ fontSize: 13, color: "#c9c7bb" }}>{al.label}</span>
                <span style={{ ...cond, fontSize: 17, fontWeight: 800, color: al.color }}>{al.count}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#71705f", marginTop: 10 }}>Click a row to jump to the queue.</div>
          </div>
        </div>

        {([["Top Neck Up", "#2fbf8f", topNU], ["Top Neck Down", "#5aa0e8", topND]] as [string, string, typeof topNU][]).map(([title, color, list]) => (
          <div key={title} style={card}>
            <div style={cardHead}><div style={dot(color)} /><div style={cardTitle}>{title}</div></div>
            <div style={{ padding: "6px 16px 12px" }}>
              {list.map((p) => (
                <div key={p.id} onClick={() => onOpen(p.id)} className="hover:bg-[#1d201c]" style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e6dd" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#71705f", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.meta}</div>
                  </div>
                  <span style={{ ...cond, fontSize: 19, fontWeight: 800, color }}>{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
        <div style={card}>
          <div style={cardHead}><div style={dot("#d99a3d")} /><div style={cardTitle}>XP Leaders — Development</div></div>
          <div style={{ padding: "6px 16px 12px" }}>
            {xpTop.map((p) => (
              <div key={p.id} onClick={() => onOpen(p.id)} className="hover:bg-[#1d201c]" style={rowStyle}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#71705f", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.meta}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...cond, fontSize: 17, fontWeight: 800, color: "#d99a3d", lineHeight: 1 }}>{p.xp} XP</div>
                  <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: p.lvlColor }}>{p.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={cardHead}><div style={dot("#9a92f0")} /><div style={cardTitle}>Pipeline by Class</div></div>
          <div style={{ padding: "12px 16px 16px" }}>
            {classDist.map((c) => (
              <div key={c.year} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <span style={{ ...cond, fontSize: 15, fontWeight: 700, width: 44, color: "#c9c7bb" }}>{c.year}</span>
                <div style={{ flex: 1, height: 8, background: "#101210", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: 8, borderRadius: 4, background: "#9a92f0", width: c.pct }} />
                </div>
                <span style={{ ...cond, fontSize: 15, fontWeight: 700, width: 30, textAlign: "right", color: "#9a92f0" }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={cardHead}><div style={dot("#e0699a")} /><div style={cardTitle}>Latest Intakes</div></div>
          <div style={{ padding: "6px 16px 12px" }}>
            {recent.map((p) => (
              <div key={p.id} onClick={() => onOpen(p.id)} className="hover:bg-[#1d201c]" style={rowStyle}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#71705f", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.meta}</div>
                </div>
                <span style={{ fontSize: 11, color: "#8a897f" }}>{p.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= PROFILE ================= */

function Profile({
  p, coachView, onBack, onGrade, onCompare,
}: {
  p: Player; coachView: boolean;
  onBack: () => void; onGrade: () => void; onCompare: () => void;
}) {
  const evLabels: [keyof NonNullable<Player["qa"]>, string, string][] = [
    ["commentary", "Self-Scout — Why a coach wants me", "#2fbf8f"],
    ["coachGets", "What a coach gets", "#2fbf8f"],
    ["comp", "NBA Comparison", "#5aa0e8"],
    ["support", "Support System", "#e0699a"],
    ["challenge", "Biggest Obstacle", "#d99a3d"],
    ["hidden", "Hidden Talent", "#9a92f0"],
    ["interests", "Outside the Game", "#9a92f0"],
    ["pivot", "Life-After Pivot", "#e0713f"],
    ["advice", "Advice to the Next Kid", "#c9c7bb"],
    ["lookingFor", "Looking For in a College", "#5aa0e8"],
  ];
  const evidence = evLabels
    .filter(([k]) => p.qa && p.qa[k])
    .map(([k, label, color]) => ({ label, color, text: (p.qa![k] as string).slice(0, 420) }));

  const spXp = xp(p);
  const spLvl = xpLevel(spXp);
  const nextT = XPL.map((x) => x[0]).filter((t) => t > spXp).sort((a, b) => a - b)[0];
  const nextName = nextT ? XPL.find((x) => x[0] === nextT)![1] : null;
  const pathPills = (p.pathways || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const milestones = xpMilestones(p);

  const chips = [
    p.class && "Class of " + p.class, p.posFull || p.pos,
    p.height !== "—" && p.height, p.weight && p.weight + " lbs",
    p.gpa != null && p.gpa.toFixed(2) + " GPA", p.school,
    p.nil && "NIL Interested", p.src,
  ].filter(Boolean) as string[];

  return (
    <>
      <div
        onClick={onBack}
        className="hover:text-[#2fbf8f]"
        style={{ ...cond, display: "inline-block", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a897f", cursor: "pointer", marginBottom: 14 }}
      >
        ← Back to Database
      </div>

      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#1D9E75 0%,#378ADD 40%,#7F77DD 70%,#D4537E 100%)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ ...cond, fontSize: 36, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1 }}>{p.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {chips.map((c) => (
                <span key={c} style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", padding: "3px 9px", borderRadius: 4, background: "#101210", border: "1px solid #2a2d28", color: "#c9c7bb" }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ textAlign: "center", background: "#101210", border: "1px solid #1f4a3a", borderRadius: 12, padding: "12px 22px" }}>
              <div style={{ ...cond, fontSize: 40, fontWeight: 800, lineHeight: 1, color: "#2fbf8f" }}>{p.neckUp ?? "—"}</div>
              <div style={{ fontSize: 9.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a897f", marginTop: 4 }}>Neck Up</div>
            </div>
            <div style={{ textAlign: "center", background: "#101210", border: "1px solid #1f3a55", borderRadius: 12, padding: "12px 22px" }}>
              <div style={{ ...cond, fontSize: 40, fontWeight: 800, lineHeight: 1, color: "#5aa0e8" }}>{p.neckDown ?? "—"}</div>
              <div style={{ fontSize: 9.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a897f", marginTop: 4 }}>Neck Down</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" }}>
        {/* NECK UP column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={card}>
            <div style={{ ...cardHead, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={dot("#2fbf8f")} />
                <div style={cardTitle}>Neck Up — Behavioral Profile</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: p.evaluated ? "#152e24" : "#3a2c14", color: p.evaluated ? "#2fbf8f" : "#d99a3d" }}>
                {p.evaluated ? "Evaluated" : "Pending Evaluation"}
              </span>
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              {TRAITS.map((t) => (
                <GradeBar key={t} name={t} grade={p.traits?.[t] as Grade | undefined} big />
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={cardHead}>
              <div style={dot("#e0699a")} />
              <div style={cardTitle}>Qualitative Evidence — In Their Words</div>
            </div>
            <div style={{ padding: "10px 16px 16px" }}>
              {evidence.map((ev) => (
                <div key={ev.label} style={{ padding: "9px 0", borderBottom: "1px solid #1e211c" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: ev.color, marginBottom: 4 }}>{ev.label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#c9c7bb" }}>&ldquo;{ev.text}&rdquo;</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NECK DOWN column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={card}>
            <div style={cardHead}>
              <div style={dot("#5aa0e8")} />
              <div style={cardTitle}>Neck Down — Physical Profile</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", borderBottom: "1px solid #23261f" }}>
              {[
                { value: p.stats?.ppg ?? "—", label: "PPG" },
                { value: p.stats?.rpg ?? "—", label: "RPG" },
                { value: p.stats?.apg ?? "—", label: "APG" },
                { value: p.stats?.fg != null ? p.stats.fg + "%" : "—", label: "FG" },
                { value: p.stats?.tp != null ? p.stats.tp + "%" : "—", label: "3PT" },
              ].map((s) => (
                <div key={s.label} style={{ padding: "14px 8px", textAlign: "center", borderRight: "1px solid #1e211c" }}>
                  <div style={{ ...cond, fontSize: 24, fontWeight: 800, lineHeight: 1, color: "#e8e6dd" }}>{s.value}</div>
                  <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#71705f", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#71705f", marginBottom: 8 }}>Skill Grades</div>
              {SKILLS.map((t) => (
                <GradeBar key={t} name={t} grade={p.skills?.[t] as Grade | undefined} />
              ))}
              <div style={{ marginTop: 12, padding: "10px 12px", background: "#101210", border: "1px dashed #2a2d28", borderRadius: 8, fontSize: 11.5, color: "#71705f" }}>
                Athletic testing (vertical · sprint · agility) — <span style={{ color: "#d99a3d" }}>awaiting combine data</span>. Injury history: {p.injuries || "none reported at intake"}.
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ ...cardHead, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={dot("#d99a3d")} />
                <div style={cardTitle}>Development — XP Track</div>
              </div>
              <span style={{ ...cond, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: spLvl.color }}>{spLvl.name}</span>
            </div>
            <div style={{ padding: "14px 16px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ ...cond, fontSize: 26, fontWeight: 800, color: "#d99a3d", lineHeight: 1 }}>{spXp} XP</span>
                <span style={{ fontSize: 11, color: "#71705f" }}>
                  {nextT ? nextT - spXp + " XP to " + nextName : "Max level reached"}
                </span>
              </div>
              <div style={{ height: 6, background: "#101210", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: 6, borderRadius: 3, background: "linear-gradient(90deg,#d99a3d,#e0713f)", width: nextT ? Math.round((spXp / nextT) * 100) + "%" : "100%" }} />
              </div>
              {milestones.map((m) => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1e211c" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", flex: "none", border: `1px solid ${m.done ? "#2fbf8f" : "#2a2d28"}`, background: m.done ? "#152e24" : "transparent" }} />
                    <span style={{ fontSize: 12.5, color: m.done ? "#c9c7bb" : "#71705f" }}>{m.label}</span>
                  </div>
                  <span style={{ ...cond, fontSize: 13, fontWeight: 700, color: m.done ? "#2fbf8f" : "#4f4e45" }}>
                    {(m.done ? "+" : "") + m.pts}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={cardHead}>
              <div style={dot("#9a92f0")} />
              <div style={cardTitle}>Career Pathway & Education</div>
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div style={{ background: "#101210", border: "1px solid #2a2d28", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#71705f", marginBottom: 3 }}>Desired Major / Industry</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e8e6dd" }}>{p.major || "Not captured at intake"}</div>
                </div>
                <div style={{ background: "#101210", border: "1px solid #2a2d28", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#71705f", marginBottom: 3 }}>Academic Standing</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: p.gpa != null ? (p.gpa >= 3.5 ? "#2fbf8f" : p.gpa >= 3.0 ? "#e8e6dd" : "#d99a3d") : "#71705f" }}>
                    {p.gpa != null
                      ? p.gpa.toFixed(2) + " GPA · " + ((p.traits && p.traits["Academic Discipline"]) || "ungraded")
                      : "GPA not on file"}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#71705f", marginBottom: 6 }}>
                Professional Pathway Interests — Global Network
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(pathPills.length ? pathPills : ["Not yet explored — flag for GoPRO outreach"]).map((pp) => (
                  <span key={pp} style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, padding: "4px 10px", borderRadius: 14, background: "#221f2e", border: "1px solid #4a4470", color: "#9a92f0" }}>{pp}</span>
                ))}
              </div>
            </div>
          </div>

          {!!p.accolades && (
            <div style={card}>
              <div style={cardHead}>
                <div style={dot("#d99a3d")} />
                <div style={cardTitle}>Accolades</div>
              </div>
              <div style={{ padding: "12px 16px", fontSize: 13, lineHeight: 1.6, color: "#c9c7bb", whiteSpace: "pre-line" }}>{p.accolades}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {!coachView && (
              <div
                onClick={onGrade}
                className="hover:bg-[#256049]"
                style={{ ...cond, flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: 11, borderRadius: 8, background: "#1f4a3a", color: "#2fbf8f", cursor: "pointer" }}
              >
                Open in Evaluator
              </div>
            )}
            <div
              onClick={onCompare}
              className="hover:bg-[#264a6e]"
              style={{ ...cond, flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: 11, borderRadius: 8, background: "#1f3a55", color: "#5aa0e8", cursor: "pointer" }}
            >
              Add to Compare
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= COMPARE ================= */

function Compare({
  players, cmpA, cmpB, setCmpA, setCmpB,
}: {
  players: Player[]; cmpA: string; cmpB: string;
  setCmpA: (v: string) => void; setCmpB: (v: string) => void;
}) {
  const allOpts = [...players].sort((a, b) => (a.name < b.name ? -1 : 1)).map((p) => ({
    id: p.id,
    label: p.name + (p.class ? " '" + String(p.class).slice(2) : "") + " · " + p.pos,
  }));
  const pa = players.find((p) => p.id === cmpA);
  const pb = players.find((p) => p.id === cmpB);
  const ready = !!(pa && pb);

  interface Row {
    label: string; a: string | number; b: string | number;
    aColor: string; bColor: string; aW: number; bW: number; bg: string;
  }
  let rows: Row[] = [];
  if (pa && pb) {
    const num = (v: number | null | undefined) => (v == null ? "—" : v);
    const mk = (label: string, a: number | null | undefined, b: number | null | undefined, section?: boolean, dispA?: string | number, dispB?: string | number): Row => {
      const an = a == null ? NaN : a, bn = b == null ? NaN : b;
      const cmp = !isNaN(an) && !isNaN(bn) && an !== bn;
      const aWin = cmp && an > bn;
      const bWin = cmp && !aWin;
      return {
        label, a: dispA ?? num(a), b: dispB ?? num(b),
        aColor: aWin ? "#2fbf8f" : "#c9c7bb", bColor: bWin ? "#e0699a" : "#c9c7bb",
        aW: aWin ? 800 : 500, bW: bWin ? 800 : 500,
        bg: section ? "#141613" : "transparent",
      };
    };
    const gradeRow = (t: string, from: "traits" | "skills"): Row => {
      const a = (pa[from] && pa[from]![t]) || "—";
      const b = (pb[from] && pb[from]![t]) || "—";
      const av = LPTS[a as Grade] || 0, bv = LPTS[b as Grade] || 0;
      return {
        label: t, a, b,
        aColor: av > bv && bv ? "#2fbf8f" : gcolor(a !== "—" ? a : null),
        bColor: bv > av && av ? "#e0699a" : gcolor(b !== "—" ? b : null),
        aW: av > bv ? 800 : 500, bW: bv > av ? 800 : 500, bg: "transparent",
      };
    };
    rows = [
      mk("Neck Up Score", pa.neckUp, pb.neckUp, true),
      ...TRAITS.map((t) => gradeRow(t, "traits")),
      mk("Neck Down Score", pa.neckDown, pb.neckDown, true),
      mk("Height", pa.hin, pb.hin, false, pa.height || "—", pb.height || "—"),
      mk("GPA", pa.gpa, pb.gpa),
      mk("PPG", pa.stats?.ppg, pb.stats?.ppg),
      mk("RPG", pa.stats?.rpg, pb.stats?.rpg),
      mk("APG", pa.stats?.apg, pb.stats?.apg),
      ...SKILLS.map((t) => gradeRow(t, "skills")),
    ];
  }

  return (
    <>
      <div style={kicker}>Side by Side</div>
      <div style={{ ...h1, marginBottom: 20 }}>Compare Players</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select
          value={cmpA} onChange={(e) => setCmpA(e.target.value)}
          style={{ flex: 1, background: "#181b17", border: "1px solid #1f4a3a", borderRadius: 8, padding: "10px 12px", color: "#2fbf8f", fontFamily: "var(--font-barlow), sans-serif", fontSize: 14, fontWeight: 600 }}
        >
          <option value="">Select Player A…</option>
          {allOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select
          value={cmpB} onChange={(e) => setCmpB(e.target.value)}
          style={{ flex: 1, background: "#181b17", border: "1px solid #4a2c3a", borderRadius: 8, padding: "10px 12px", color: "#e0699a", fontFamily: "var(--font-barlow), sans-serif", fontSize: 14, fontWeight: 600 }}
        >
          <option value="">Select Player B…</option>
          {allOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      {ready ? (
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid #2a2d28", background: "#141613" }}>
            <div />
            <div style={{ ...cond, textAlign: "center", fontSize: 19, fontWeight: 800, textTransform: "uppercase", color: "#2fbf8f" }}>{pa!.name}</div>
            <div style={{ ...cond, textAlign: "center", fontSize: 19, fontWeight: 800, textTransform: "uppercase", color: "#e0699a" }}>{pb!.name}</div>
          </div>
          {rows.map((r, i) => (
            <div key={r.label + i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "8px 20px", borderBottom: "1px solid #1e211c", alignItems: "center", background: r.bg }}>
              <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#8a897f" }}>{r.label}</div>
              <div style={{ ...cond, textAlign: "center", fontSize: 18, fontWeight: r.aW, color: r.aColor }}>{r.a}</div>
              <div style={{ ...cond, textAlign: "center", fontSize: 18, fontWeight: r.bW, color: r.bColor }}>{r.b}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "#71705f", fontSize: 14, border: "1px dashed #2a2d28", borderRadius: 12 }}>
          Pick two players above to run a head-to-head.
        </div>
      )}
    </>
  );
}

/* ================= ONBOARDING ================= */

function Onboarding({
  ob, setOb, step, setStep, done, error, setError, doneP, onSubmit, onViewProfile, onReset,
}: {
  ob: IntakeForm; setOb: (fn: (o: IntakeForm) => IntakeForm) => void;
  step: number; setStep: (n: number) => void;
  done: boolean; error: string; setError: (s: string) => void;
  doneP?: Player;
  onSubmit: () => void; onViewProfile: () => void; onReset: () => void;
}) {
  const set = (k: keyof IntakeForm) => (v: string) => setOb((o) => ({ ...o, [k]: v }));
  const stepLabels = ["Who You Are", "Neck Down", "Neck Up"];

  const next = () => {
    if (step === 1 && !ob.name.trim()) { setError("Full name is required to continue."); return; }
    if (step < 3) { setStep(step + 1); setError(""); }
    else onSubmit();
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={kicker}>GoPRO Global Talent Network</div>
        <div style={{ ...cond, fontSize: 30, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Player Intake</div>
        <div style={{ fontSize: 12, color: "#8a897f", marginTop: 4 }}>Mobile-friendly · 3 steps · ~5 minutes</div>
      </div>

      {!done ? (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {stepLabels.map((label, i) => (
              <div key={label} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, background: step > i ? "#2fbf8f" : "#2a2d28", marginBottom: 6 }} />
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: step === i + 1 ? "#2fbf8f" : "#71705f" }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#181b17", border: "1px solid #2a2d28", borderRadius: 14, padding: 20 }}>
            {step === 1 && (
              <>
                <div style={{ ...cond, fontSize: 17, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, color: "#2fbf8f" }}>Step 1 · Who You Are</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <Field label="Full Name" value={ob.name} onChange={set("name")} placeholder="First Last" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Class Of" value={ob.classYr} onChange={set("classYr")} placeholder="2027" />
                    <Field label="Primary Position" value={ob.pos} onChange={set("pos")} placeholder="Point guard" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <Field label="Height" value={ob.height} onChange={set("height")} placeholder={'6\'3"'} />
                    <Field label="Weight" value={ob.weight} onChange={set("weight")} placeholder="185" />
                    <Field label="GPA" value={ob.gpa} onChange={set("gpa")} placeholder="3.4" />
                  </div>
                  <Field label="Current School" value={ob.school} onChange={set("school")} placeholder="High school / college" />
                  <Field label="AAU / Grassroots Program" value={ob.aau} onChange={set("aau")} placeholder="Program + coach" />
                  <Field label="Social Handles (X / IG)" value={ob.social} onChange={set("social")} placeholder="@handle" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ ...cond, fontSize: 17, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2, color: "#5aa0e8" }}>Step 2 · Neck Down</div>
                <div style={{ fontSize: 12, color: "#8a897f", marginBottom: 14 }}>Your body of work — stats and physical tools.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <Field label="PPG" value={ob.ppg} onChange={set("ppg")} placeholder="14.2" />
                    <Field label="RPG" value={ob.rpg} onChange={set("rpg")} placeholder="6.1" />
                    <Field label="APG" value={ob.apg} onChange={set("apg")} placeholder="3.5" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="FG %" value={ob.fg} onChange={set("fg")} placeholder="48" />
                    <Field label="3PT %" value={ob.tp} onChange={set("tp")} placeholder="35" />
                  </div>
                  <Field label="Accolades / Awards" value={ob.accolades} onChange={set("accolades")} placeholder="All-district, MVP, rankings…" area />
                  <Field label="Injury History" value={ob.injuries} onChange={set("injuries")} placeholder="None / describe" />
                  <div style={{ padding: "9px 12px", background: "#101210", border: "1px dashed #2a2d28", borderRadius: 8, fontSize: 11.5, color: "#71705f" }}>
                    Athletic testing (vertical, sprint, agility) is captured later at a HeadsUp combine session.
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ ...cond, fontSize: 17, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2, color: "#e0699a" }}>Step 3 · Neck Up</div>
                <div style={{ fontSize: 12, color: "#8a897f", marginBottom: 14 }}>Who you are between the ears. Real answers only — this is what separates you.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <Field label="Why should a coach want YOU on their team?" value={ob.commentary} onChange={set("commentary")} area />
                  <Field label="What NBA player do you compare your game to, and why?" value={ob.comp} onChange={set("comp")} area rows={2} />
                  <Field label="Describe your support system and what it means to you" value={ob.support} onChange={set("support")} area rows={2} />
                  <Field label="Biggest challenge in your life so far — and how you overcame it" value={ob.challenge} onChange={set("challenge")} area />
                  <Field label="Your hidden talent — something we may not know about you" value={ob.hidden} onChange={set("hidden")} area rows={2} />
                  <Field label="When the ball stops bouncing — what's your 'life after' pivot?" value={ob.pivot} onChange={set("pivot")} area rows={2} />
                  <Field label="Desired academic major / industry" value={ob.major} onChange={set("major")} placeholder="Business, Kinesiology, Media…" />
                  <Field label="Career pathways you'd explore in our global network" value={ob.pathways} onChange={set("pathways")} placeholder="Coaching, Player Development, Scouting, Media…" />
                  <div
                    onClick={() => setOb((o) => ({ ...o, nil: !o.nil }))}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 12px", background: "#101210", border: "1px solid #2a2d28", borderRadius: 8, cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 13, color: "#c9c7bb" }}>Interested in NIL partnership opportunities?</span>
                    <span style={{ ...cond, fontSize: 14, fontWeight: 700, letterSpacing: 1, color: ob.nil ? "#2fbf8f" : "#71705f" }}>{ob.nil ? "YES" : "NO"}</span>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              {step > 1 && (
                <div
                  onClick={() => setStep(step - 1)}
                  className="hover:text-[#e8e6dd]"
                  style={{ ...cond, flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: 12, borderRadius: 8, background: "#101210", border: "1px solid #2a2d28", color: "#8a897f", cursor: "pointer" }}
                >
                  Back
                </div>
              )}
              <div
                onClick={next}
                className="hover:bg-[#5ad6ac]"
                style={{ ...cond, flex: 2, textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: 12, borderRadius: 8, background: "#2fbf8f", color: "#0d1410", cursor: "pointer" }}
              >
                {step < 3 ? "Continue" : "Submit to Network"}
              </div>
            </div>
            {!!error && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#e0713f", textAlign: "center" }}>{error}</div>
            )}
          </div>
        </>
      ) : (
        <div style={{ background: "#181b17", border: "1px solid #1f4a3a", borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ ...cond, fontSize: 26, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#2fbf8f" }}>You&rsquo;re In The Network</div>
          <div style={{ fontSize: 13, color: "#c9c7bb", lineHeight: 1.6, marginTop: 10 }}>
            {doneP?.name} has been added to the pipeline with a provisional Neck Down score of{" "}
            <span style={{ color: "#5aa0e8", fontWeight: 700 }}>{doneP?.neckDown}</span>. Neck Up evaluation is now queued for an evaluator session.
          </div>
          <div style={{ ...cond, display: "inline-block", marginTop: 14, fontSize: 15, fontWeight: 700, letterSpacing: 1, padding: "6px 16px", borderRadius: 16, background: "#3a2c14", color: "#d99a3d" }}>
            +{doneP ? xp(doneP) : 100} XP EARNED · {doneP ? xpLevel(xp(doneP)).name.toUpperCase() : "ROOKIE"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
            <div onClick={onViewProfile} style={{ ...cond, fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "11px 20px", borderRadius: 8, background: "#1f4a3a", color: "#2fbf8f", cursor: "pointer" }}>
              View Profile
            </div>
            <div onClick={onReset} style={{ ...cond, fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "11px 20px", borderRadius: 8, background: "#101210", border: "1px solid #2a2d28", color: "#8a897f", cursor: "pointer" }}>
              Add Another
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= EVALUATOR ================= */

function Evaluator({
  players, evId, ep, evTraits, evSkills, evNotes, evSaved,
  onPick, setTrait, setSkill, setNotes, onSave,
}: {
  players: Player[]; evId: string | null; ep?: Player;
  evTraits: Partial<Record<string, Grade>>; evSkills: Partial<Record<string, Grade>>;
  evNotes: string; evSaved: boolean;
  onPick: (p: Player) => void;
  setTrait: (t: string, l: Grade) => void; setSkill: (s: string, l: Grade) => void;
  setNotes: (s: string) => void; onSave: () => void;
}) {
  const queue = [...players].sort((a, b) => (a.evaluated ? 1 : 0) - (b.evaluated ? 1 : 0)).slice(0, 60);
  const filledT = TRAITS.filter((t) => evTraits[t]);
  const liveScore = filledT.length
    ? Math.round(filledT.reduce((a, t) => a + LPTS[evTraits[t] as Grade], 0) / filledT.length)
    : "—";

  const gradeCells = (name: string, cur: Grade | undefined, onPickCell: (l: Grade) => void, hoverColor: string) => (
    <div style={{ display: "flex", gap: 4 }}>
      {LETTERS.map((l) => {
        const on = cur === l;
        return (
          <div
            key={l}
            onClick={() => onPickCell(l)}
            className={hoverColor === "#2fbf8f" ? "hover:border-[#2fbf8f]" : "hover:border-[#5aa0e8]"}
            style={{
              ...cond, fontSize: 13, fontWeight: 700, width: 36, textAlign: "center",
              padding: "5px 0", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${on ? gcolor(l) : "#2a2d28"}`,
              background: on ? "#101210" : "transparent",
              color: on ? gcolor(l) : "#71705f",
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div style={kicker}>Neck Up Grading</div>
      <div style={{ ...h1, marginBottom: 20 }}>Evaluator Session</div>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 10, alignItems: "start" }}>
        <div style={card}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #23261f", ...cardTitle }}>Queue — Pending First</div>
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {queue.map((p) => (
              <div
                key={p.id}
                onClick={() => onPick(p)}
                className="hover:bg-[#1d201c]"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 16px", borderBottom: "1px solid #1e211c", cursor: "pointer",
                  background: evId === p.id ? "#1f2b23" : "transparent",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: evId === p.id ? "#2fbf8f" : "#e8e6dd" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#71705f", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {[p.class && "'" + String(p.class).slice(2), p.pos, p.school].filter(Boolean).join(" · ").slice(0, 34)}
                  </div>
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, background: p.evaluated ? "#152e24" : "#3a2c14", color: p.evaluated ? "#2fbf8f" : "#d99a3d" }}>
                  {p.evaluated ? "Done" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {ep ? (
          <div style={card}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #23261f", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ ...cond, fontSize: 22, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{ep.name}</div>
                <div style={{ fontSize: 11, color: "#71705f" }}>
                  {[ep.class && "Class of " + ep.class, ep.posFull || ep.pos, ep.school].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ ...cond, fontSize: 28, fontWeight: 800, color: "#2fbf8f", lineHeight: 1 }}>{liveScore}</div>
                <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#8a897f" }}>Live Neck Up</div>
              </div>
            </div>
            <div style={{ padding: "14px 20px" }}>
              {TRAITS.map((t) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1e211c", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, color: "#c9c7bb", minWidth: 150 }}>{t}</span>
                  {gradeCells(t, evTraits[t], (l) => setTrait(t, l), "#2fbf8f")}
                </div>
              ))}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#71705f", margin: "14px 0 6px" }}>
                Skill Grades (Neck Down)
              </div>
              {SKILLS.map((s) => (
                <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1e211c", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, color: "#c9c7bb", minWidth: 150 }}>{s}</span>
                  {gradeCells(s, evSkills[s], (l) => setSkill(s, l), "#5aa0e8")}
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={formLabel}>Evaluator Notes</div>
                <textarea
                  value={evNotes} rows={3}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Body language, coachability moments, bench behavior, response to correction…"
                  style={{ ...formField, fontSize: 13, resize: "vertical" }}
                />
              </div>
              <div
                onClick={onSave}
                className="hover:bg-[#5ad6ac]"
                style={{ ...cond, marginTop: 14, textAlign: "center", fontSize: 15, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: 12, borderRadius: 8, background: "#2fbf8f", color: "#0d1410", cursor: "pointer" }}
              >
                Save Evaluation
              </div>
              {evSaved && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#2fbf8f", textAlign: "center" }}>
                  Evaluation saved — scores updated across the platform.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "#71705f", fontSize: 14, border: "1px dashed #2a2d28", borderRadius: 12 }}>
            Select a player from the queue to grade their Neck Up profile.
          </div>
        )}
      </div>
    </>
  );
}
