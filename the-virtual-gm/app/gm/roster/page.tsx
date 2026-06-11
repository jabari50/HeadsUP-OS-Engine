"use client";

/* My Roster (mid-fi) — Claude Design prototype: screens-dashboard.jsx →
   RosterScreen */

const ROSTER: [string, string, string, string, boolean][] = [
  ["#3", "G", "Sr.", "Graduating — starting PG", true],
  ["#11", "G", "Jr.", "Returning starter", false],
  ["#23", "W", "So.", "Rotation — shooting upside", false],
  ["#34", "F", "Sr.", "Graduating — rim protector", true],
  ["#42", "F", "Jr.", "Returning starter", false],
  ["#55", "C", "Jr.", "Foul-prone, developing", false],
];

export default function RosterPage() {
  return (
    <div className="fade-in">
      <div
        className="t-display text-2xl md:text-3xl"
        style={{ color: "var(--white)", marginBottom: 6 }}
      >
        My Roster
      </div>
      <p style={{ color: "var(--mid)", fontSize: 13, marginTop: 0 }}>
        12 players · 4 seniors graduating · gaps feed your Draft Board
        automatically.
      </p>
      <div className="card-dark" style={{ overflow: "hidden" }}>
        {ROSTER.map(([num, pos, cls, note, leaving]) => (
          <div
            key={num}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "13px 16px",
              borderBottom: "1px solid var(--line-dark)",
            }}
          >
            <span className="t-display" style={{ fontSize: 18, color: "var(--teal)", width: 34 }}>
              {num}
            </span>
            <span className="t-mono" style={{ fontSize: 12, width: 26, color: "var(--white)" }}>
              {pos}
            </span>
            <span style={{ fontSize: 12, width: 28, color: "var(--mid)" }}>{cls}</span>
            <span style={{ fontSize: 12.5, flex: 1, color: "rgba(255,255,255,0.85)" }}>
              {note}
            </span>
            {leaving && (
              <span className="rec-badge rec-PASS" style={{ fontSize: 10 }}>
                GAP
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
