// app.jsx — shell: nav, routing, tweaks
const { useState, useEffect } = React;
const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio } = window;

// --- simple geometric icons (stroke = currentColor) ---
const Icon = ({ name }) => {
  const s = { width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "dashboard": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
    case "draft": return <svg viewBox="0 0 24 24" {...s}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="4.5" cy="18" r="1.4"/></svg>;
    case "match": return <svg viewBox="0 0 24 24" {...s}><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/><path d="M15 18H9a3 3 0 0 1-3-3V9"/></svg>;
    case "lock": return <svg viewBox="0 0 24 24" {...s}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "rib": return <svg viewBox="0 0 24 24" {...s}><path d="M6 3h9l4 4v14H6z"/><line x1="9" y1="11" x2="16" y2="11"/><line x1="9" y1="15" x2="16" y2="15"/></svg>;
    case "academics": return <svg viewBox="0 0 24 24" {...s}><path d="M12 4 3 8l9 4 9-4-9-4z"/><path d="M7 10.5V15c0 1.1 2.2 2.5 5 2.5s5-1.4 5-2.5v-4.5"/></svg>;
    case "eligibility": return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l7 3v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>;
    case "intake": return <svg viewBox="0 0 24 24" {...s}><circle cx="10" cy="8" r="3.2"/><path d="M4 20c0-3.3 2.7-6 6-6"/><line x1="17" y1="13" x2="17" y2="21"/><line x1="13" y1="17" x2="21" y2="17"/></svg>;
    case "social": return <svg viewBox="0 0 24 24" {...s}><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><line x1="8.1" y1="10.9" x2="15.9" y2="7.1"/><line x1="8.1" y1="13.1" x2="15.9" y2="16.9"/></svg>;
    case "develop": return <svg viewBox="0 0 24 24" {...s}><polyline points="4 4 4 20 20 20"/><polyline points="7 15 11 10 14 13 19 6"/><polyline points="19 10 19 6 15 6"/></svg>;
    case "settings": return <svg viewBox="0 0 24 24" {...s}><line x1="4" y1="7" x2="20" y2="7"/><circle cx="9" cy="7" r="2.2" fill="var(--navy-800)"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="15" cy="17" r="2.2" fill="var(--navy-800)"/></svg>;
    default: return null;
  }
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "roster", label: "Roster", icon: "draft" },
  { id: "development", label: "Development", icon: "develop" },
  { id: "academics", label: "Academics", icon: "academics" },
  { id: "eligibility", label: "Eligibility", icon: "eligibility" },
  { id: "intake", label: "Onboarding", icon: "intake" },
  { id: "social", label: "Social", icon: "social" },
  { id: "brief", label: "Coach's Brief", icon: "rib" },
  { id: "settings", label: "Settings", icon: "settings", disabled: true },
];

function Sidebar({ active, onNav }) {
  return (
    <nav className="vgm-sidebar">
      <div className="vgm-nav-list">
        {NAV.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} disabled={item.disabled} onClick={() => !item.disabled && onNav(item.id)}
              className={"vgm-navbtn" + (on ? " on" : "")} title={item.label} style={{ opacity: item.disabled ? 0.4 : 1 }}>
              <span className="vgm-navicon"><Icon name={item.icon} /></span>
              <span className="vgm-navlabel">{item.label}</span>
              {on && <span className="vgm-navrail"></span>}
            </button>
          );
        })}
      </div>
      <div className="vgm-side-foot">
        <div className="head" style={{ fontSize: 15, color: "var(--white)", letterSpacing: "0.04em" }}>HeadsUP</div>
        <div className="mono-cap" style={{ fontSize: 8, color: "var(--gray)", marginTop: 2 }}>Media &amp; Scouting</div>
      </div>
    </nav>
  );
}

function TopBar() {
  return (
    <header className="vgm-topbar">
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span className="head" style={{ fontSize: 26, color: "var(--white)", letterSpacing: "0.08em" }}>THE VIRTUAL GM</span>
        <span className="mono-cap" style={{ fontSize: 9, color: "var(--teal)", display: "var(--tag-disp, inline)" }}>UIL Program Command Center</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="mono-cap vgm-poweredby" style={{ fontSize: 9, color: "var(--gray)" }}>Powered by HeadsUP OS</span>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 13px", borderRadius: 999, background: "var(--teal-dim)", border: "1px solid var(--teal-line)" }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--teal)", color: "#0C1830", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Oswald'", fontWeight: 700, fontSize: 12 }}>HC</span>
          <span className="mono-cap" style={{ fontSize: 10, color: "var(--teal)" }}>Head Coach</span>
        </div>
      </div>
    </header>
  );
}

const SCREENS = {
  dashboard: (go) => <window.DashboardScreen onNavigate={go} />,
  roster: () => <window.RosterScreen />,
  development: () => <window.DevelopmentScreen />,
  academics: () => <window.AcademicsScreen />,
  eligibility: () => <window.EligibilityScreen />,
  intake: () => <window.OnboardingScreen />,
  social: () => <window.SocialScreen />,
  brief: () => <window.RibScreen />,
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#00C896",
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useState(() => (location.hash || "#dashboard").slice(1));

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--teal", t.accent);
    // recompute teal-derived tints
    r.style.setProperty("--teal-dim", hexA(t.accent, 0.14));
    r.style.setProperty("--teal-line", hexA(t.accent, 0.34));
    const comfy = t.density === "comfortable";
    r.style.setProperty("--gap", comfy ? "20px" : "13px");
    r.style.setProperty("--card-pad", comfy ? "22px" : "16px");
    r.style.setProperty("--pad", comfy ? "32px" : "20px");
  }, [t.accent, t.density]);

  const go = (id) => { setActive(id); location.hash = id; window.scrollTo({ top: 0 }); };
  useEffect(() => {
    const h = () => setActive((location.hash || "#dashboard").slice(1));
    window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h);
  }, []);

  const render = SCREENS[active] || SCREENS.dashboard;

  return (
    <div className="vgm-app">
      <Sidebar active={active} onNav={go} />
      <div className="vgm-main">
        <TopBar />
        <main className="vgm-content">
          {render(go)}
        </main>
        <footer className="vgm-footer">
          <span className="head" style={{ fontSize: 13, color: "var(--gray)", letterSpacing: "0.05em" }}>HeadsUP MEDIA &amp; SCOUTING</span>
          <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)" }}>Powered by HeadsUP OS · The Virtual GM™</span>
        </footer>
      </div>

      <TweaksPanel>
        <TweakSection label="Accent" />
        <TweakColor label="Action color" value={t.accent} options={["#00C896", "#2DD4BF", "#3B9EFF", "#F5C518", "#FF7A59"]} onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={["compact", "comfortable"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// layout styles
const css = document.createElement("style");
css.textContent = `
.vgm-app { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; }
.vgm-sidebar { position: sticky; top: 0; height: 100vh; background: var(--navy-800); border-right: 1px solid var(--hair); display: flex; flex-direction: column; padding: 22px 14px 18px; }
.vgm-nav-list { display: flex; flex-direction: column; gap: 4px; flex: 1; margin-top: 6px; }
.vgm-navbtn { position: relative; display: flex; align-items: center; gap: 13px; padding: 12px 13px; border: none; background: transparent; color: var(--gray); border-radius: 9px; font-size: 13.5px; font-weight: 600; text-align: left; transition: all .15s; }
.vgm-navbtn:hover:not(:disabled) { background: var(--navy-700); color: var(--white); }
.vgm-navbtn.on { background: var(--teal-dim); color: var(--teal); }
.vgm-navicon { display: inline-flex; flex: 0 0 auto; }
.vgm-navrail { position: absolute; left: -14px; top: 8px; bottom: 8px; width: 3px; background: var(--teal); border-radius: 0 3px 3px 0; }
.vgm-side-foot { padding: 14px 8px 4px; border-top: 1px solid var(--hair); }
.vgm-main { display: flex; flex-direction: column; min-width: 0; }
.vgm-topbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px var(--pad); background: rgba(12,24,48,0.86); backdrop-filter: blur(10px); border-bottom: 1px solid var(--hair); }
.vgm-content { flex: 1; padding: var(--pad); max-width: 1500px; width: 100%; margin: 0 auto; }
.vgm-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px var(--pad); border-top: 1px solid var(--hair); flex-wrap: wrap; }

@media (max-width: 900px) {
  .vgm-app { grid-template-columns: 1fr; }
  .vgm-sidebar { position: sticky; top: 0; height: auto; flex-direction: row; padding: 8px 10px; border-right: none; border-bottom: 1px solid var(--hair); z-index: 30; overflow-x: auto; }
  .vgm-nav-list { flex-direction: row; margin-top: 0; gap: 2px; }
  .vgm-navbtn { flex-direction: column; gap: 5px; padding: 8px 12px; font-size: 10px; }
  .vgm-navlabel { font-size: 10px; }
  .vgm-navrail { left: 8px; right: 8px; top: auto; bottom: -8px; width: auto; height: 3px; border-radius: 3px 3px 0 0; }
  .vgm-side-foot { display: none; }
  .vgm-poweredby { display: none; }
  .dash-rail { margin-top: 4px; }
}
@media (max-width: 760px) {
  .dash-grid { grid-template-columns: 1fr !important; }
  .acad-grid { grid-template-columns: 1fr !important; }
  .db-traits, .db-headrow span:nth-child(4) { display: none !important; }
}
@media (max-width: 560px) {
  .ob-stats { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 620px) {
  .vgm-topbar .head { font-size: 19px !important; }
  .db-activation { display: none; }
}
`;
document.head.appendChild(css);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
