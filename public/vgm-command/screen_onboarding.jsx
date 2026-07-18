// screen_onboarding.jsx → Player Profile Onboarding Questionnaire
const { Panel, Eyebrow } = window;
const { useState } = React;

const obStyles = {
  label: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
  cap: { fontSize: 9.5, color: "var(--gray)" },
  input: {
    width: "100%", padding: "11px 13px", borderRadius: 8, background: "var(--navy-700)",
    color: "var(--white)", border: "1px solid var(--hair-2)", fontSize: 13.5, fontWeight: 500,
  },
};

function OBField({ label, children, full }) {
  return (
    <label style={{ ...obStyles.label, gridColumn: full ? "1 / -1" : undefined }}>
      <span className="mono-cap" style={obStyles.cap}>{label}</span>
      {children}
    </label>
  );
}
function OBText({ label, value, onChange, placeholder, full, type = "text" }) {
  return (
    <OBField label={label} full={full}>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={obStyles.input} />
    </OBField>
  );
}
function OBSelect({ label, value, onChange, options, full }) {
  return (
    <OBField label={label} full={full}>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...obStyles.input, appearance: "none", WebkitAppearance: "none", paddingRight: 30 }}>
          <option value="" style={{ background: "#142A4E" }}>Select…</option>
          {options.map(o => <option key={o} value={o} style={{ background: "#142A4E" }}>{o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--gray)", fontSize: 10 }}>▼</span>
      </div>
    </OBField>
  );
}
function OBChips({ label, value, onToggle, options, full }) {
  return (
    <OBField label={label} full={full}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(o => {
          const on = value.includes(o);
          return (
            <button key={o} type="button" onClick={() => onToggle(o)} style={{
              border: `1px solid ${on ? "var(--teal-line)" : "var(--hair-2)"}`,
              background: on ? "var(--teal-dim)" : "transparent",
              color: on ? "var(--teal)" : "var(--gray)",
              borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 600,
            }}>{o}</button>
          );
        })}
      </div>
    </OBField>
  );
}
function OBToggle({ label, sub, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
      padding: "14px 16px", borderRadius: 10, border: `1px solid ${value ? "var(--teal-line)" : "var(--hair-2)"}`,
      background: value ? "var(--teal-dim)" : "var(--navy-700)",
    }}>
      <span style={{ width: 40, height: 23, borderRadius: 999, background: value ? "var(--teal)" : "var(--navy-600)", flex: "0 0 auto", position: "relative", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 20 : 3, width: 17, height: 17, borderRadius: "50%", background: value ? "#0C1830" : "var(--gray)", transition: "left .15s" }}></span>
      </span>
      <span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--white)" }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: 11.5, color: "var(--gray)", marginTop: 3 }}>{sub}</span>}
      </span>
    </button>
  );
}

const STEPS = [
  { key: "identity", title: "Player Identity", sub: "Name, class, and on-court position" },
  { key: "academics", title: "Academics & Eligibility", sub: "Baseline GPA and academic support plan" },
  { key: "athletic", title: "Athletic Profile", sub: "Role, strengths, and season production" },
  { key: "guardian", title: "Guardian & Contact", sub: "Parent / guardian and emergency contact" },
  { key: "social", title: "Social & Consent", sub: "Handles and program consent forms" },
  { key: "review", title: "Review & Submit", sub: "Confirm and add to the program" },
];

const blank = {
  firstName: "", lastName: "", preferred: "", jersey: "", gradeLevel: "", dob: "", height: "", weight: "", primaryPos: "", secondaryPos: "",
  gpa: "", counselor: "", support: [], studyDays: [], reportConsent: true,
  yearsVarsity: "", role: "", strengths: [], ppg: "", rpg: "", apg: "", vertical: "",
  guardianName: "", relationship: "", phone: "", email: "", emName: "", emPhone: "",
  x: "", instagram: "", hudl: "", maxpreps: "", youtube: "",
  aggregate: true, media: false, ferpa: false,
};

function StepRail({ step, setStep, completion }) {
  return (
    <Panel pad="16px 14px" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Eyebrow color="var(--gray)" style={{ fontSize: 9.5, padding: "4px 8px 10px" }}>Intake · {completion}% complete</Eyebrow>
      {STEPS.map((s, i) => {
        const on = i === step, done = i < step;
        return (
          <button key={s.key} onClick={() => setStep(i)} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
            padding: "11px 12px", borderRadius: 9, border: "1px solid " + (on ? "var(--teal-line)" : "transparent"),
            background: on ? "var(--teal-dim)" : "transparent",
          }}>
            <span className="stat" style={{
              width: 26, height: 26, borderRadius: "50%", flex: "0 0 auto",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              background: done ? "var(--teal)" : on ? "transparent" : "var(--navy-700)",
              color: done ? "#0C1830" : on ? "var(--teal)" : "var(--gray)",
              border: on ? "1px solid var(--teal)" : "none",
            }}>{done ? "✓" : i + 1}</span>
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: on ? "var(--white)" : "var(--gray)" }}>{s.title}</span>
            </span>
          </button>
        );
      })}
    </Panel>
  );
}

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };

function OnboardingScreen() {
  const V = window.VGM;
  const [step, setStep] = useState(0);
  const [f, setF] = useState(blank);
  const [done, setDone] = useState(false);
  const up = (k, v) => setF(s => ({ ...s, [k]: v }));
  const toggle = (k, v) => setF(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] }));

  const filled = Object.entries(f).filter(([k, v]) => Array.isArray(v) ? v.length : (typeof v === "boolean" ? false : v !== "")).length;
  const completion = Math.min(100, Math.round((filled / 24) * 100));

  if (done) {
    return (
      <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", maxWidth: 640 }}>
        <Panel pad="40px" style={{ borderTop: "2px solid var(--teal)", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--teal-dim)", border: "1px solid var(--teal-line)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--teal)", fontSize: 30 }}>✓</div>
          <h2 className="head" style={{ fontSize: 34, margin: 0 }}>Player Profile Created</h2>
          <p style={{ fontSize: 14, color: "var(--gray)", lineHeight: 1.6, margin: "12px auto 0", maxWidth: 420 }}>
            <b style={{ color: "var(--white)" }}>{f.firstName || "New"} {f.lastName || "Player"}</b> {f.jersey ? `(#${f.jersey})` : ""} has been added to the {V.PROGRAM.team} intake queue. Teacher grade-reporting links {f.reportConsent ? "were sent" : "are pending consent"} and selected social handles {f.aggregate ? "are now aggregating" : "were not connected"}.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
            <button onClick={() => { setF(blank); setStep(0); setDone(false); }} style={{ padding: "12px 22px", borderRadius: 8, border: "1px solid var(--hair-2)", background: "transparent", color: "var(--white)", fontWeight: 600, fontSize: 13 }}>Start Another Intake</button>
            <button onClick={() => { location.hash = "roster"; }} style={{ padding: "12px 22px", borderRadius: 8, border: "none", background: "var(--teal)", color: "#0C1830", fontWeight: 700, fontSize: 13 }}>View Roster →</button>
          </div>
        </Panel>
      </div>
    );
  }

  const s = STEPS[step];
  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div>
        <Eyebrow>Player Onboarding</Eyebrow>
        <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>Profile Intake Questionnaire</h1>
      </div>

      <div className="acad-grid" style={{ display: "grid", gridTemplateColumns: "264px minmax(0,1fr)", gap: "var(--gap)", alignItems: "start" }}>
        <StepRail step={step} setStep={setStep} completion={completion} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <Panel pad="26px 28px">
            <Eyebrow>{s.title}</Eyebrow>
            <p style={{ fontSize: 12.5, color: "var(--gray)", margin: "6px 0 22px" }}>{s.sub}</p>

            {step === 0 && (
              <div style={grid2}>
                <OBText label="First Name" value={f.firstName} onChange={v => up("firstName", v)} placeholder="First" />
                <OBText label="Last Name" value={f.lastName} onChange={v => up("lastName", v)} placeholder="Last" />
                <OBText label="Preferred Name" value={f.preferred} onChange={v => up("preferred", v)} placeholder="Optional" />
                <OBText label="Jersey #" value={f.jersey} onChange={v => up("jersey", v)} placeholder="e.g. 23" />
                <OBSelect label="Grade Level" value={f.gradeLevel} onChange={v => up("gradeLevel", v)} options={["Freshman", "Sophomore", "Junior", "Senior"]} />
                <OBText label="Date of Birth" value={f.dob} onChange={v => up("dob", v)} type="date" />
                <OBText label="Height" value={f.height} onChange={v => up("height", v)} placeholder={`e.g. 6'2"`} />
                <OBText label="Weight (lbs)" value={f.weight} onChange={v => up("weight", v)} placeholder="e.g. 185" />
                <OBSelect label="Primary Position" value={f.primaryPos} onChange={v => up("primaryPos", v)} options={V.POSITIONS} />
                <OBSelect label="Secondary Position" value={f.secondaryPos} onChange={v => up("secondaryPos", v)} options={V.POSITIONS} />
              </div>
            )}

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={grid2}>
                  <OBText label="Current GPA" value={f.gpa} onChange={v => up("gpa", v)} placeholder="e.g. 3.2" />
                  <OBText label="Counselor of Record" value={f.counselor} onChange={v => up("counselor", v)} placeholder="Name" />
                </div>
                <OBChips label="Academic Support Plan" value={f.support} onToggle={v => toggle("support", v)} options={["Tutoring", "Study Hall", "Mentor Check-In", "No Plan Needed"]} full />
                <OBChips label="Study Hall Availability" value={f.studyDays} onToggle={v => toggle("studyDays", v)} options={["Mon", "Tue", "Wed", "Thu", "Fri"]} full />
                <OBToggle label="Teacher grade-reporting consent" sub="Allow each teacher of record to post current-period grades into the No Pass, No Play eligibility tracker." value={f.reportConsent} onChange={v => up("reportConsent", v)} />
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={grid2}>
                  <OBSelect label="Years on Varsity" value={f.yearsVarsity} onChange={v => up("yearsVarsity", v)} options={["0", "1", "2", "3", "4"]} />
                  <OBSelect label="Projected Role" value={f.role} onChange={v => up("role", v)} options={V.ROLES.map(r => V.TIERS[r].label)} />
                </div>
                <OBChips label="Key Strengths" value={f.strengths} onToggle={v => toggle("strengths", v)} options={["Perimeter shooting", "On-ball defense", "Playmaking", "Rim protection", "Rebounding", "Transition", "Finishing", "Motor"]} full />
                <div style={{ ...grid2, gridTemplateColumns: "1fr 1fr 1fr 1fr" }} className="ob-stats">
                  <OBText label="PPG" value={f.ppg} onChange={v => up("ppg", v)} placeholder="0.0" />
                  <OBText label="RPG" value={f.rpg} onChange={v => up("rpg", v)} placeholder="0.0" />
                  <OBText label="APG" value={f.apg} onChange={v => up("apg", v)} placeholder="0.0" />
                  <OBText label="Vertical (in)" value={f.vertical} onChange={v => up("vertical", v)} placeholder="e.g. 30" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={grid2}>
                <OBText label="Guardian Name" value={f.guardianName} onChange={v => up("guardianName", v)} placeholder="Full name" />
                <OBSelect label="Relationship" value={f.relationship} onChange={v => up("relationship", v)} options={["Mother", "Father", "Grandparent", "Legal Guardian", "Other"]} />
                <OBText label="Phone" value={f.phone} onChange={v => up("phone", v)} placeholder="(000) 000-0000" type="tel" />
                <OBText label="Email" value={f.email} onChange={v => up("email", v)} placeholder="name@email.com" type="email" />
                <OBText label="Emergency Contact" value={f.emName} onChange={v => up("emName", v)} placeholder="Name" />
                <OBText label="Emergency Phone" value={f.emPhone} onChange={v => up("emPhone", v)} placeholder="(000) 000-0000" type="tel" />
              </div>
            )}

            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={grid2}>
                  <OBText label="X / Twitter" value={f.x} onChange={v => up("x", v)} placeholder="@handle" />
                  <OBText label="Instagram" value={f.instagram} onChange={v => up("instagram", v)} placeholder="@handle" />
                  <OBText label="Hudl" value={f.hudl} onChange={v => up("hudl", v)} placeholder="hudl.com/profile/…" />
                  <OBText label="MaxPreps" value={f.maxpreps} onChange={v => up("maxpreps", v)} placeholder="maxpreps.com/…" />
                  <OBText label="YouTube" value={f.youtube} onChange={v => up("youtube", v)} placeholder="Channel / @handle" full />
                </div>
                <OBToggle label="Add handles to Program Social aggregation" sub="Surface this player's public posts in the program social feed for engagement and conduct monitoring." value={f.aggregate} onChange={v => up("aggregate", v)} />
                <OBToggle label="Media / photo release" sub="Permit use of game photos and highlight clips on official program channels." value={f.media} onChange={v => up("media", v)} />
                <OBToggle label="FERPA eligibility-verification consent" sub="Authorize the program to verify academic eligibility records with the school of record." value={f.ferpa} onChange={v => up("ferpa", v)} />
              </div>
            )}

            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  ["Player", `${f.firstName || "—"} ${f.lastName || ""} ${f.jersey ? "· #" + f.jersey : ""} ${f.gradeLevel ? "· " + f.gradeLevel : ""}`],
                  ["Position", `${f.primaryPos || "—"}${f.secondaryPos ? " / " + f.secondaryPos : ""} ${f.height ? "· " + f.height : ""}`],
                  ["Academics", `${f.gpa ? f.gpa + " GPA" : "GPA —"} · Support: ${f.support.length ? f.support.join(", ") : "none"}`],
                  ["Athletics", `${f.role || "role —"} · ${[f.ppg && f.ppg + " PPG", f.rpg && f.rpg + " RPG", f.apg && f.apg + " APG"].filter(Boolean).join(" · ") || "no stats"}`],
                  ["Guardian", `${f.guardianName || "—"} ${f.relationship ? "(" + f.relationship + ")" : ""} · ${f.phone || "no phone"}`],
                  ["Social", `${[f.x, f.instagram, f.hudl, f.maxpreps, f.youtube].filter(Boolean).length} handles · aggregation ${f.aggregate ? "ON" : "OFF"}`],
                  ["Consent", `Grades ${f.reportConsent ? "✓" : "✗"} · Media ${f.media ? "✓" : "✗"} · FERPA ${f.ferpa ? "✓" : "✗"}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, paddingBottom: 14, borderBottom: "1px solid var(--hair)" }}>
                    <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)", paddingTop: 2 }}>{k}</span>
                    <span style={{ fontSize: 13.5, color: "var(--white)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{
              padding: "12px 22px", borderRadius: 8, border: "1px solid var(--hair-2)", background: "transparent",
              color: step === 0 ? "var(--gray)" : "var(--white)", fontWeight: 600, fontSize: 13, opacity: step === 0 ? 0.5 : 1,
            }}>← Back</button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} style={{ padding: "12px 26px", borderRadius: 8, border: "none", background: "var(--teal)", color: "#0C1830", fontWeight: 700, fontSize: 13 }}>Continue →</button>
            ) : (
              <button onClick={() => setDone(true)} style={{ padding: "12px 26px", borderRadius: 8, border: "none", background: "var(--teal)", color: "#0C1830", fontWeight: 700, fontSize: 13 }}>Create Player Profile ✓</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.OnboardingScreen = OnboardingScreen;
