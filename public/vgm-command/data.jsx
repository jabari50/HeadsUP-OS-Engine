// data.jsx — fictional Texas 6A UIL high-school basketball data for The Virtual GM
// School, players, teachers, and figures are all invented.

const PROGRAM = {
  school: "Lancaster High School",
  mascot: "Tigers",
  team: "Lancaster Tigers",
  program: "Boys Basketball",
  city: "Lancaster, TX",
  coach: "Antoine Briggs",
  system: "Dribble-Drive Motion",
  classification: "Class 5A",
  district: "District 11-5A",
  region: "Region II",
  enrollment: "1,860",
  record: "24–8",
  districtRecord: "11–3",
  standing: "2nd in District",
  gradingPeriod: "Grading Period 4",
  periodWeek: "Week 2 of 3",
  nextCheck: "Mar 21",
  nextGame: { opp: "Liberty Ridge Patriots", when: "Fri", where: "Away", district: true },
};

// On-court role tiers (color-coded depth chart)
const TIERS = {
  Starter:       { label: "Starter",       color: "var(--gold)",  text: "#0C1830", glow: "rgba(245,197,24,0.25)" },
  Rotation:      { label: "Rotation",      color: "var(--teal)",  text: "#0C1830", glow: "rgba(0,200,150,0.22)" },
  Bench:         { label: "Bench",         color: "var(--white)", text: "#0C1830", glow: "rgba(255,255,255,0.16)" },
  JV:            { label: "JV Call-Up",    color: "var(--gray)",  text: "#0C1830", glow: "rgba(138,143,153,0.18)" },
  Developmental: { label: "Developmental", color: "#3C5A8A",      text: "var(--white)", glow: "rgba(60,90,138,0.25)" },
};

// UIL eligibility status (No Pass, No Play)
const ELIGIBILITY = {
  ELIGIBLE:   { label: "Eligible",   short: "Eligible",   color: "var(--teal)",  bg: "rgba(0,200,150,0.14)",   line: "rgba(0,200,150,0.45)" },
  WARNING:    { label: "On Watch",   short: "Watch",      color: "var(--gold)",  bg: "rgba(245,197,24,0.14)",  line: "rgba(245,197,24,0.45)" },
  INELIGIBLE: { label: "Ineligible", short: "Ineligible", color: "#FF6B5E",      bg: "rgba(255,107,94,0.13)",  line: "rgba(255,107,94,0.5)" },
  PENDING:    { label: "Awaiting Grades", short: "Pending", color: "var(--gray)", bg: "rgba(138,143,153,0.14)", line: "rgba(138,143,153,0.45)" },
};

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const CLASSES = ["Fr", "So", "Jr", "Sr"];
const ROLES = ["Starter", "Rotation", "Bench", "JV", "Developmental"];

// Subject → teacher of record (per-teacher accountability)
const TEACHERS = {
  "English III":  "Ms. Holloway",
  "English II":   "Mrs. Sandoval",
  "Algebra II":   "Mr. Tran",
  "Pre-Calculus": "Mr. Friedman",
  "Geometry":     "Mr. Tran",
  "U.S. History": "Mr. Castillo",
  "World Geography": "Mr. Castillo",
  "Government & Econ": "Mr. Abernathy",
  "Chemistry":    "Mrs. Okafor",
  "Biology":      "Ms. Pearson",
  "Anatomy & Phys.": "Ms. Pearson",
  "Spanish II":   "Ms. Bautista",
  "Athletics":    "Coach Briggs",
};

const PASS = 70;

function conductFrom(grade, missing) {
  if (grade < 70 || missing >= 3) return "Concern";
  if (missing >= 1 || grade < 78) return "Satisfactory";
  return "Good";
}
function trendArrow(t) { return t === "up" ? "▲" : t === "down" ? "▼" : "▬"; }

// build a class record from [subject, grade, trend, missing, reported, comment]
function cls(subject, grade, trend, missing, reported, comment) {
  return { subject, teacher: TEACHERS[subject] || "—", grade, trend, missing, reported, conduct: conductFrom(grade, missing), comment: comment || "" };
}

// Roster — jersey, name, pos, class, height, role tier, coach rating, academics
const PLAYERS = [
  { id: "p23", name: "Devon Hayes",        num: 23, pos: "SG", cls: "Sr", ht: "6'4\"", role: "Starter",  ovr: 91, traits: ["Lead scorer", "39% 3PT"],
    classes: [ cls("English III", 88, "up", 0, "Today"), cls("Pre-Calculus", 64, "down", 3, "Today", "Missed two quizzes; retest scheduled Thu. Needs to reach 70 by check date."), cls("U.S. History", 81, "flat", 1, "1d ago"), cls("Chemistry", 72, "up", 0, "2d ago"), cls("Spanish II", 90, "flat", 0, "Today"), cls("Athletics", 100, "flat", 0, "Today") ] },
  { id: "p04", name: "Marcus Okonkwo",     num: 4,  pos: "PG", cls: "Jr", ht: "6'1\"", role: "Starter",  ovr: 89, traits: ["Floor general", "6.8 AST"],
    classes: [ cls("English III", 79, "flat", 1, "Today"), cls("Algebra II", 84, "up", 0, "Today"), cls("U.S. History", 91, "up", 0, "Today"), cls("Chemistry", 68, "down", 2, "Today", "Lab grades pulling average; tutoring recommended before Fri."), cls("Spanish II", 86, "flat", 0, "1d ago"), cls("Athletics", 99, "flat", 0, "Today") ] },
  { id: "p11", name: "Tyrese Calloway",    num: 11, pos: "SF", cls: "Sr", ht: "6'6\"", role: "Starter",  ovr: 88, traits: ["Two-way wing", "Switchable"],
    classes: [ cls("English III", 93, "flat", 0, "Today"), cls("Pre-Calculus", 88, "up", 0, "Today"), cls("Government & Econ", 90, "flat", 0, "Today"), cls("Anatomy & Phys.", 85, "flat", 0, "1d ago"), cls("Spanish II", 82, "up", 0, "Today"), cls("Athletics", 100, "flat", 0, "Today") ] },
  { id: "p33", name: "Brandon Mireles",    num: 33, pos: "PF", cls: "Jr", ht: "6'7\"", role: "Starter",  ovr: 86, traits: ["Rebounder", "Rim runner"],
    classes: [ cls("English III", 76, "flat", 1, "2d ago"), cls("Algebra II", 74, "up", 0, "Today"), cls("U.S. History", 80, "flat", 0, "Today"), cls("Chemistry", 77, "up", 0, "Today"), cls("Spanish II", 71, "down", 2, "Today", "Borderline — vocabulary tests missed. On academic watch."), cls("Athletics", 98, "flat", 0, "Today") ] },
  { id: "p50", name: "Isaiah Whitmore",    num: 50, pos: "C",  cls: "Sr", ht: "6'9\"", role: "Starter",  ovr: 85, traits: ["Anchor", "2.1 BPG"],
    classes: [ cls("English III", 84, "flat", 0, "Today"), cls("Pre-Calculus", 81, "flat", 0, "Today"), cls("Government & Econ", 88, "up", 0, "Today"), cls("Chemistry", 90, "up", 0, "Today"), cls("Spanish II", 83, "flat", 0, "1d ago"), cls("Athletics", 100, "flat", 0, "Today") ] },
  { id: "p07", name: "Caleb Ferguson",     num: 7,  pos: "PG", cls: "So", ht: "5'11\"", role: "Rotation", ovr: 80, traits: ["Spark guard", "Pesky defender"],
    classes: [ cls("English II", 82, "up", 0, "Today"), cls("Geometry", 78, "flat", 1, "Today"), cls("World Geography", 85, "flat", 0, "1d ago"), cls("Biology", 79, "up", 0, "Today"), cls("Spanish II", 88, "flat", 0, "Today"), cls("Athletics", 97, "flat", 0, "Today") ] },
  { id: "p21", name: "Xavier Benton",      num: 21, pos: "SG", cls: "Jr", ht: "6'3\"", role: "Rotation", ovr: 79, traits: ["Movement shooter", "Catch & shoot"],
    classes: [ cls("English III", 75, "flat", 1, "Today"), cls("Algebra II", 62, "down", 4, "Today", "Failing — four missing assignments. Ineligible if not recovered this period."), cls("U.S. History", 73, "flat", 1, "2d ago"), cls("Chemistry", 70, "flat", 0, "Today"), cls("Spanish II", 80, "up", 0, "Today"), cls("Athletics", 95, "flat", 0, "Today") ] },
  { id: "p15", name: "Jordan Castellano",  num: 15, pos: "SF", cls: "So", ht: "6'4\"", role: "Rotation", ovr: 78, traits: ["Energy wing", "Cutter"],
    classes: [ cls("English II", 90, "up", 0, "Today"), cls("Geometry", 86, "flat", 0, "Today"), cls("World Geography", 84, "flat", 0, "Today"), cls("Biology", 88, "up", 0, "1d ago"), cls("Spanish II", 91, "flat", 0, "Today"), cls("Athletics", 99, "flat", 0, "Today") ] },
  { id: "p44", name: "Emmanuel Adeyemi",   num: 44, pos: "PF", cls: "So", ht: "6'6\"", role: "Rotation", ovr: 77, traits: ["Stretch four", "Soft touch"],
    classes: [ cls("English II", 81, "flat", 0, "Today"), cls("Geometry", 72, "up", 1, "Today"), cls("World Geography", 79, "flat", 0, "Today"), cls("Biology", 74, "flat", 1, "3d ago"), cls("Spanish II", 77, "up", 0, "Today"), cls("Athletics", 96, "flat", 0, "Today") ] },
  { id: "p03", name: "Cody Reinhardt",     num: 3,  pos: "SG", cls: "Sr", ht: "6'2\"", role: "Bench",    ovr: 74, traits: ["Vet leader", "Low TOV"],
    classes: [ cls("English III", 87, "flat", 0, "Today"), cls("Pre-Calculus", 83, "flat", 0, "Today"), cls("Government & Econ", 85, "up", 0, "Today"), cls("Anatomy & Phys.", 80, "flat", 0, "Today"), cls("Spanish II", 84, "flat", 0, "1d ago"), cls("Athletics", 100, "flat", 0, "Today") ] },
  { id: "p12", name: "Nate Sandoval",      num: 12, pos: "PG", cls: "Fr", ht: "5'10\"", role: "JV",      ovr: 71, traits: ["Combo guard", "High feel"],
    classes: [ cls("English II", 89, "up", 0, "Today"), cls("Algebra II", 85, "flat", 0, "Today"), cls("World Geography", 91, "flat", 0, "Today"), cls("Biology", 83, "up", 0, "Today"), cls("Spanish II", 88, "flat", 0, "1d ago"), cls("Athletics", 95, "flat", 0, "Today") ] },
  { id: "p25", name: "Trey Bautista",      num: 25, pos: "C",  cls: "Jr", ht: "6'8\"", role: "Bench",    ovr: 73, traits: ["Screen setter", "Offensive boards"],
    classes: [ cls("English III", 70, "flat", 1, "Not reported"), cls("Algebra II", 76, "flat", 0, "Today"), cls("U.S. History", 72, "flat", 0, "Today"), cls("Chemistry", 75, "up", 0, "Not reported"), cls("Spanish II", 79, "flat", 0, "Today"), cls("Athletics", 97, "flat", 0, "Today") ] },
  { id: "p09", name: "Diego Restrepo",     num: 9,  pos: "SF", cls: "Fr", ht: "6'3\"", role: "Developmental", ovr: 68, traits: ["Long wing", "Project"],
    classes: [ cls("English II", 84, "flat", 0, "Today"), cls("Geometry", 81, "up", 0, "Today"), cls("World Geography", 86, "flat", 0, "Today"), cls("Biology", 80, "flat", 0, "Today"), cls("Spanish II", 82, "up", 0, "1d ago"), cls("Athletics", 96, "flat", 0, "Today") ] },
  { id: "p18", name: "Owen Pham",          num: 18, pos: "PF", cls: "Fr", ht: "6'5\"", role: "Developmental", ovr: 66, traits: ["Mobile big", "Raw"],
    classes: [ cls("English II", 78, "flat", 0, "Today"), cls("Geometry", 88, "up", 0, "Today"), cls("World Geography", 82, "flat", 0, "Today"), cls("Biology", 85, "flat", 0, "Today"), cls("Spanish II", 90, "flat", 0, "Today"), cls("Athletics", 95, "flat", 0, "Today") ] },
];

// Eligibility computed from per-teacher grades (UIL No Pass, No Play)
function gpaFromGrades(classes) {
  // numeric grade -> 4.0 scale (rough Texas conversion), excludes Athletics weighting evenly
  const core = classes;
  const pts = core.map(c => {
    const g = c.grade;
    if (g >= 90) return 4.0; if (g >= 80) return 3.0; if (g >= 75) return 2.5; if (g >= 70) return 2.0; return 1.0;
  });
  return (pts.reduce((a, b) => a + b, 0) / pts.length);
}
function computeEligibility(p) {
  const acad = p.classes.filter(c => c.subject !== "Athletics");
  const unreported = acad.filter(c => c.reported === "Not reported").length;
  const reported = acad.filter(c => c.reported !== "Not reported");
  const min = Math.min(...reported.map(c => c.grade));
  let status;
  if (min < PASS) status = "INELIGIBLE";
  else if (min < 75) status = "WARNING";
  else if (unreported > 0) status = "PENDING";
  else status = "ELIGIBLE";
  const failing = acad.filter(c => c.grade < PASS);
  const watch = acad.filter(c => c.grade >= PASS && c.grade < 75);
  return { status, min, unreported, failing, watch };
}
PLAYERS.forEach(p => {
  p.tier = p.role;
  p.elig = computeEligibility(p);
  p.eligibility = p.elig.status;
  p.gpa = gpaFromGrades(p.classes.filter(c => c.subject !== "Athletics"));
  p.reportedCount = p.classes.filter(c => c.subject !== "Athletics" && c.reported !== "Not reported").length;
  p.classCount = p.classes.filter(c => c.subject !== "Athletics").length;
});

// ---- Player development tracking ----
function devSeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
const clampA = (n) => Math.max(45, Math.min(99, Math.round(n)));
const DEV_ATTRS = ["Shooting", "Ball-Handling", "Passing / IQ", "Finishing", "Perimeter D", "Rebounding", "Athleticism", "Conditioning"];
const POS_BIAS = {
  PG: { "Ball-Handling": 9, "Passing / IQ": 9, "Rebounding": -10, "Finishing": -2 },
  SG: { "Shooting": 9, "Perimeter D": 3, "Rebounding": -7 },
  SF: { "Perimeter D": 6, "Athleticism": 5, "Passing / IQ": -2 },
  PF: { "Rebounding": 9, "Finishing": 6, "Shooting": -7, "Ball-Handling": -7 },
  C:  { "Rebounding": 11, "Finishing": 8, "Shooting": -13, "Ball-Handling": -11, "Perimeter D": -4 },
};
function buildDevelopment(p) {
  const attrs = DEV_ATTRS.map(k => {
    const bias = (POS_BIAS[p.pos] && POS_BIAS[p.pos][k]) || 0;
    const value = clampA(p.ovr + bias + (devSeed(p.id + k) * 16 - 8));
    const growth = 1 + Math.round(devSeed(p.id + k + "g") * 7);
    const baseline = clampA(value - growth);
    const hist = Array.from({ length: 6 }, (_, j) => clampA(baseline + (value - baseline) * (j / 5) + (devSeed(p.id + k + j) * 4 - 2)));
    hist[5] = value;
    return { key: k, value, baseline, delta: value - baseline, hist };
  });
  const idxHist = Array.from({ length: 6 }, (_, j) => Math.round(attrs.reduce((a, at) => a + at.hist[j], 0) / attrs.length));
  idxHist[5] = p.ovr;
  const wt = ({ PG: 170, SG: 185, SF: 200, PF: 215, C: 235 }[p.pos]) + Math.round(devSeed(p.id + "wt") * 18 - 9);
  const physical = [
    { key: "Vertical", unit: "in", higher: true, cur: 24 + Math.round(devSeed(p.id + "v") * 12) },
    { key: "¾-Court Sprint", unit: "s", higher: false, cur: +(3.6 - devSeed(p.id + "s") * 0.55).toFixed(2) },
    { key: "Lane Agility", unit: "s", higher: false, cur: +(12.4 - devSeed(p.id + "la") * 1.4).toFixed(2) },
    { key: "Bench · 185", unit: "reps", higher: true, cur: 3 + Math.round(devSeed(p.id + "b") * 12) },
    { key: "Weight", unit: "lbs", higher: true, cur: wt },
  ];
  physical.forEach(m => {
    if (m.higher) { const d = m.unit === "lbs" ? 6 + Math.round(devSeed(p.id + m.key) * 9) : 1 + Math.round(devSeed(p.id + m.key) * 4); m.base = m.cur - d; }
    else { const d = +(0.12 + devSeed(p.id + m.key) * 0.3).toFixed(2); m.base = +(m.cur + d).toFixed(2); }
    m.delta = +(m.cur - m.base).toFixed(2);
    m.improved = m.higher ? m.delta > 0 : m.delta < 0;
  });
  const sorted = [...attrs].sort((a, b) => a.value - b.value);
  const goals = [
    { label: `Raise ${sorted[0].key} rating`, target: `${clampA(sorted[0].value + 5)} by spring`, progress: Math.round(devSeed(p.id + "g0") * 42 + 38) },
    { label: `${sorted[1].key} consistency in games`, target: "Top-3 on roster", progress: Math.round(devSeed(p.id + "g1") * 45 + 30) },
    { label: "Academic floor — 75+ every course", target: "No Pass, No Play clear", progress: p.eligibility === "ELIGIBLE" ? 100 : p.eligibility === "WARNING" ? 68 : 38 },
  ];
  goals.forEach(g => { g.status = g.progress >= 100 ? "Achieved" : g.progress >= 60 ? "On Track" : "Behind"; });
  const evals = [
    { date: "Mar 4", coach: "Coach Briggs", note: `${p.traits[0]} keeps showing up in games. Individual work is centered on ${sorted[0].key.toLowerCase()} — trending the right direction.` },
    { date: "Feb 18", coach: "Player Dev Staff", note: `Strong week in skill sessions; film-study habits and effort grading up. ${p.traits[1] || "Two-way motor"} a real asset.` },
    { date: "Feb 2", coach: "Coach Briggs", note: `Baseline testing logged. Spring development targets set with player and family.` },
  ];
  return { attrs, idxHist, physical, goals, evals, index: p.ovr, indexDelta: p.ovr - idxHist[0] };
}
PLAYERS.forEach(p => { p.dev = buildDevelopment(p); });

// Eligibility watch (dashboard) — players at academic risk this period
const ELIGIBILITY_WATCH = PLAYERS
  .filter(p => p.eligibility === "INELIGIBLE" || p.eligibility === "WARNING")
  .map(p => {
    const c = (p.elig.failing[0] || p.elig.watch[0]);
    return {
      num: p.num, name: p.name, pos: p.pos,
      subject: c.subject, teacher: c.teacher, grade: c.grade,
      priority: p.eligibility === "INELIGIBLE" ? "HIGH" : "MED",
      status: p.eligibility,
    };
  })
  .sort((a, b) => a.grade - b.grade);

const ACTION_ITEMS = [
  { title: "Confirm Devon Hayes (#23) Pre-Calculus retest before Fri eligibility check", detail: "Currently 64 in Mr. Friedman's class. One passing grade restores eligibility for the Liberty Ridge game." },
  { title: "Assign tutoring for Xavier Benton (#21) — Algebra II", detail: "62 with 4 missing assignments in Mr. Tran's class. At risk of a 3-week ineligibility hold if not recovered this period." },
  { title: "Chase down 2 missing grade reports for Trey Bautista (#25)", detail: "Ms. Holloway (English III) and Mrs. Okafor (Chemistry) have not posted current-period grades. Cannot certify eligibility until reported." },
];

const QUICK_STATS = [
  { label: "Varsity Roster", value: PLAYERS.length, sub: "Class 6A" },
  { label: "Eligible to Play", value: `${PLAYERS.filter(p => p.eligibility === "ELIGIBLE").length}/${PLAYERS.length}`, sub: `${ELIGIBILITY_WATCH.length} on watch` },
  { label: "Team GPA", value: (PLAYERS.reduce((a, p) => a + p.gpa, 0) / PLAYERS.length).toFixed(2), sub: "▲ vs last period" },
  { label: "Next District Game", value: PROGRAM.nextGame.when, sub: `@ ${PROGRAM.nextGame.opp.split(" ")[0]} ${PROGRAM.nextGame.opp.split(" ")[1]}` },
];

// Coach's Brief — weekly editorial
const BRIEF = {
  week: "Week of March 9, 2026",
  eligibilityAlerts: ELIGIBILITY_WATCH.map(w => ({
    num: w.num, player: w.name, pos: w.pos, grade: w.grade,
    issue: `${w.subject} · ${w.teacher}`, severity: w.status === "INELIGIBLE" ? "Ineligible" : "On watch",
  })),
  gradeMoves: [
    { player: "Marcus Okonkwo", subject: "Chemistry",   from: 73, to: 68, dir: "down", note: "Two missed labs — Mrs. Okafor flagged" },
    { player: "Devon Hayes",    subject: "Chemistry",   from: 66, to: 72, dir: "up",   note: "Recovered above passing after retest" },
    { player: "Brandon Mireles",subject: "Algebra II",  from: 69, to: 74, dir: "up",   note: "Cleared No-Pass line in Mr. Tran's class" },
    { player: "Xavier Benton",  subject: "Algebra II",  from: 71, to: 62, dir: "down", note: "Four assignments missing this period" },
  ],
  schedule: [
    { opp: "Liberty Ridge Patriots", when: "Fri Mar 13", where: "Away", district: true,  note: "District — currently 1st in 15-6A" },
    { opp: "Sienna Falls Hawks",     when: "Tue Mar 17", where: "Home", district: true,  note: "District — playoff seeding implications" },
    { opp: "Magnolia Park Mustangs", when: "Fri Mar 20", where: "Home", district: true,  note: "Senior Night · UIL bi-district preview" },
  ],
  actions: [
    { title: "Hold Devon Hayes from Tue scrimmage until Pre-Calculus retest posts.", detail: "Protects eligibility status ahead of the Friday district game." },
    { title: "Schedule Mon/Wed study hall for Xavier Benton and Marcus Okonkwo.", detail: "Both sit below the 70 line in a core course — recover before the next 3-week check (Mar 21)." },
    { title: "Send grade-report reminder to Ms. Holloway and Mrs. Okafor.", detail: "Trey Bautista cannot be certified eligible until both submit current-period grades." },
  ],
};

// ---- Program social media aggregation ----
const SOCIAL = {
  account: { handle: "@LancasterHoops", name: "Lancaster Tigers Basketball", platform: "Program Hub" },
  summary: [
    { label: "Total Reach", value: "8,420", sub: "across 5 platforms" },
    { label: "Posts This Week", value: 14, sub: "9 player · 5 program" },
    { label: "Avg. Engagement", value: "6.2%", sub: "▲ 1.1 vs last wk" },
    { label: "Flagged for Review", value: 2, sub: "conduct + eligibility" },
  ],
  platforms: ["X", "Instagram", "Hudl", "MaxPreps", "YouTube"],
  posts: [
    { id: "s1", platform: "X", authorType: "program", author: "Lancaster Tigers Basketball", handle: "@LancasterHoops", time: "2h", tag: "Announcement", media: false, flagged: false,
      text: "DISTRICT WIN. Tigers take down the visitors 74–61 behind a 26-point night. Back in action Friday @ Liberty Ridge. 🐯", likes: 312, comments: 18, shares: 44 },
    { id: "s2", platform: "Hudl", authorType: "player", author: "Devon Hayes", handle: "#23 · SG", time: "5h", tag: "Highlight", media: true, flagged: false,
      text: "New highlight reel posted — 4th quarter takeover vs. district. Pull-up game looking smooth.", likes: 187, comments: 22, shares: 9 },
    { id: "s3", platform: "MaxPreps", authorType: "player", author: "Tyrese Calloway", handle: "#11 · SF", time: "6h", tag: "Stats", media: false, flagged: false,
      text: "Season line updated: 14.8 PPG · 7.1 RPG · 2.0 SPG. Two-way wing leading the district in deflections.", likes: 96, comments: 5, shares: 3 },
    { id: "s4", platform: "Instagram", authorType: "player", author: "Xavier Benton", handle: "#21 · SG", time: "8h", tag: "Personal", media: true, flagged: true, flagReason: "Conduct review — late-night post during eligibility hold",
      text: "Up late, can't sleep. Some people don't want to see you win 🤷‍♂️ #blessed", likes: 240, comments: 31, shares: 6 },
    { id: "s5", platform: "YouTube", authorType: "program", author: "Lancaster Tigers Basketball", handle: "@LancasterHoops", time: "1d", tag: "Recap", media: true, flagged: false,
      text: "FULL GAME RECAP + coach's postgame breakdown is live on the channel. Subscribe for senior-night coverage Friday.", likes: 451, comments: 27, shares: 38 },
    { id: "s6", platform: "X", authorType: "player", author: "Isaiah Whitmore", handle: "#50 · C", time: "1d", tag: "Recruiting", media: false, flagged: false,
      text: "Blessed and humbled to receive my first D2 offer this morning. All glory to God and Tiger nation. 🙏", likes: 528, comments: 64, shares: 21 },
    { id: "s7", platform: "Instagram", authorType: "program", author: "Lancaster Tigers Basketball", handle: "@LancasterHoops", time: "1d", tag: "Announcement", media: true, flagged: false,
      text: "SENIOR NIGHT this Friday. Doors at 6:30. Let's pack the house for our 5 graduating Tigers. 🎓🐯", likes: 274, comments: 12, shares: 19 },
    { id: "s8", platform: "Hudl", authorType: "player", author: "Marcus Okonkwo", handle: "#4 · PG", time: "2d", tag: "Highlight", media: true, flagged: false,
      text: "Pick-and-roll reads from the district game. 11 assists, 0 turnovers in the film.", likes: 143, comments: 9, shares: 7 },
    { id: "s9", platform: "X", authorType: "player", author: "Brandon Mireles", handle: "#33 · PF", time: "2d", tag: "Personal", media: false, flagged: true, flagReason: "Language flagged by program filter — coach follow-up",
      text: "Refs were trash tonight fr 😤 but we got the W anyway. On to the next one.", likes: 88, comments: 14, shares: 2 },
    { id: "s10", platform: "MaxPreps", authorType: "program", author: "Lancaster Tigers Basketball", handle: "@LancasterHoops", time: "3d", tag: "Stats", media: false, flagged: false,
      text: "Team is now 24–8 (11–3 district) and ranked 2nd in 11-5A heading into the final week.", likes: 119, comments: 4, shares: 11 },
  ],
};

window.VGM = { PROGRAM, TIERS, ELIGIBILITY, POSITIONS, CLASSES, ROLES, TEACHERS, PLAYERS, ELIGIBILITY_WATCH, ACTION_ITEMS, QUICK_STATS, BRIEF, SOCIAL, DEV_ATTRS, PASS, trendArrow };


