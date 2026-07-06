/* Standalone-prototype pool — snapshot of the REAL HeadsUP Portal seeded
   athletes (SportsInfluencer + GoPRO pipelines, exported 2026-07-06; exact
   duplicate names collapsed). Name/position/school/class/measurements are
   real pipeline data.

   OS-tier values (OVR, recommendation, Neck Up 8) are ILLUSTRATIVE DEMO
   OUTPUT generated deterministically per athlete so the upgrade experience
   can be shown before engine scoring lands. They are NOT engine scores and
   are labeled DEMO everywhere they render (Zero Hallucination Rule). No
   Neck Up weighting or methodology is modeled here — display only. */

export interface SeedAthlete {
  name: string;
  pos: string | null;
  school: string | null;
  cls: string | null;
  level: string | null;
  h: number | null; // height, total inches
  w: number | null; // weight, lb
}

export const SEED_POOL: SeedAthlete[] = [
  { name: "Adariu Borden", pos: "PG", school: "South Grand Prairie Highschool", cls: "2024", level: "College", h: 76, w: 210 },
  { name: "Ahmad Abualneel", pos: "PG", school: "Samuell highschool", cls: "2024", level: "College", h: 77, w: 192 },
  { name: "Aiden Cole Baber", pos: "PG", school: "Sunnyvale High School", cls: "2024", level: "College", h: 72, w: 150 },
  { name: "Alex", pos: "SG", school: "North Crowley", cls: "2026", level: "HS", h: 77, w: null },
  { name: "Amari Compton", pos: null, school: "Trinity leadership in Cedar Hill", cls: "2026", level: "HS", h: 75, w: null },
  { name: "Antoine Shannon", pos: null, school: "Allen High School", cls: "2025", level: "College", h: 76, w: 186 },
  { name: "Antonio Sisk", pos: "PG", school: "Cedar Valley College", cls: "2024", level: "College", h: 73, w: 175 },
  { name: "Arinze Ubawike", pos: "SG", school: "Allen Highschool", cls: "2024", level: "College", h: 74, w: 185 },
  { name: "Austin Brown", pos: "PG", school: "Lufkin High School", cls: "2026", level: "HS", h: 80, w: 195 },
  { name: "Braxton James", pos: "SG", school: "Crowley high school", cls: "2025", level: "College", h: 74, w: 170 },
  { name: "Bryant Odunayo", pos: "SG", school: "Mansfield Legacy", cls: "2024", level: "College", h: 75, w: 170 },
  { name: "Bryce Dixon", pos: "SG", school: "The Colony High School", cls: "2026", level: "HS", h: 76, w: null },
  { name: "Bryson McGlothin", pos: "SF", school: "John Paul II Highschool", cls: "2024", level: "College", h: 79, w: 190 },
  { name: "Caden Deffebaugh", pos: "SG", school: "Frisco Memorial HS", cls: "2026", level: "HS", h: 77, w: null },
  { name: "Canon Wyatt", pos: "PG", school: "Highland Park High School", cls: "2026", level: "HS", h: 72, w: null },
  { name: "Chandin Davis", pos: "PG", school: "Crowley highschool", cls: "2026", level: "HS", h: 70, w: 147 },
  { name: "Chris Birden Jr.", pos: "SF", school: "Isidore Newman", cls: "2025", level: "College", h: 80, w: 170 },
  { name: "Chris Gooden JR", pos: "PG", school: "duncanville high school", cls: "2026", level: "HS", h: 71, w: null },
  { name: "Christian Thomas", pos: "SF", school: "C.E King high school", cls: "2025", level: "College", h: 79, w: 208 },
  { name: "Christopher Hardaway", pos: "SG", school: "Midlothian High School", cls: "2026", level: "HS", h: 70, w: null },
  { name: "Christopher Ramirez", pos: "SG", school: "Skyline high school", cls: "2024", level: "College", h: 76, w: 185 },
  { name: "Corbin", pos: "SG", school: "Rockwall high school", cls: "2024", level: "College", h: 77, w: 192 },
  { name: "Cornelius T White", pos: "PF", school: "Gainesville High School", cls: "2025", level: "College", h: 78, w: 215 },
  { name: "DaKari Spear", pos: "SG", school: "The colony Highschool", cls: "2026", level: "HS", h: 76, w: 185 },
  { name: "Dakarii Montrell Hudson", pos: "PG", school: "Southwest high school", cls: "2025", level: "College", h: 71, w: 178 },
  { name: "Damontrell Bussey", pos: "PG", school: "Lancaster Highschool", cls: "2026", level: "HS", h: 69, w: null },
  { name: "David Oriaku", pos: "PF", school: "Lone star high school", cls: "2024", level: "College", h: 78, w: 205 },
  { name: "Dekyre fuller", pos: "SF", school: "Mississippi college", cls: "2025", level: "College", h: 79, w: 200 },
  { name: "DeMichael Brooks", pos: "SG", school: "Billy Ryan High School", cls: "2026", level: "HS", h: 76, w: null },
  { name: "Demondray Spencer", pos: "PG", school: "Lincoln high school", cls: "2024", level: "College", h: 71, w: 157 },
  { name: "Devan Kirk", pos: "SG", school: "Red oak", cls: "2026", level: "HS", h: 77, w: null },
  { name: "Dilan Lewis", pos: "SF", school: "Braswell", cls: "2024", level: "College", h: 77, w: 198 },
  { name: "Dontre Grandberry", pos: "SG", school: "Crowley high school", cls: "2027", level: "HS", h: 72, w: 154 },
  { name: "Dorian Johnson", pos: "PF", school: "Eastern Hills HS", cls: "2025", level: "College", h: 78, w: 215 },
  { name: "Dorien Goodman", pos: "PG", school: "N/A (Lamar Community College )", cls: "2026", level: "HS", h: 71, w: 170 },
  { name: "Dvon Turner", pos: "PG", school: "Rockwall High school", cls: "2024", level: "College", h: 70, w: 165 },
  { name: "Dylan Franklin", pos: "C", school: "Crandall High School", cls: "2027", level: "HS", h: 74, w: 205 },
  { name: "Elijah Darden", pos: "PG", school: "Mansfield Legacy", cls: "2026", level: "HS", h: 70, w: null },
  { name: "Elijah Hayeems", pos: "PG", school: "Big Tyme prep", cls: "2026", level: "HS", h: 78, w: null },
  { name: "Emmanuel Scott", pos: "SG", school: "Crowley highschool", cls: "2027", level: "HS", h: null, w: 165 },
  { name: "Ethan Moss", pos: "SG", school: "Plano East", cls: "2024", level: "College", h: 76, w: 175 },
  { name: "Gazmine Henderson Jr(JAZZ)", pos: "PG", school: "Faith Family Oak Cliff", cls: "2024", level: "College", h: 72, w: 170 },
  { name: "Genard Toney III", pos: "PG", school: "RWG Stem Academy", cls: "2026", level: "HS", h: 74, w: 180 },
  { name: "Gerren Chester II", pos: "SG", school: "James Madison High School", cls: "2024", level: "College", h: 74, w: 180 },
  { name: "Grayson Ryan", pos: "SG", school: "Allen County Community College", cls: "2022", level: "College", h: 76, w: 165 },
  { name: "Ian Berry", pos: "PG", school: "Little Elm High School", cls: "2026", level: "HS", h: 72, w: null },
  { name: "Isaac Williams IV", pos: null, school: "Faith Family Academy", cls: "2024", level: "College", h: 74, w: 185 },
  { name: "Isaiah", pos: "SG", school: "Seagoville high school", cls: "2024", level: "College", h: 69, w: 150 },
  { name: "Isaiah Baker", pos: "SF", school: "Wilmer Hutchins", cls: "2024", level: "College", h: 74, w: 175 },
  { name: "Isaiah Brewington", pos: "PG", school: "Plano East Senior High School", cls: "2024", level: "College", h: 69, w: 175 },
  { name: "Isaiah kalala jadayne", pos: "PF", school: "W.T WHITE HIGH SCHOOL", cls: "2025", level: "College", h: 81, w: 203 },
  { name: "J'Mar Franklin", pos: "PG", school: "Ce king highschool", cls: "2024", level: "College", h: 72, w: 185 },
  { name: "Jacob Walker", pos: "PG", school: "Lancaster High School", cls: "2026", level: "HS", h: 74, w: null },
  { name: "Jacobe coleman", pos: "SG", school: "Pace academy", cls: "2025", level: "College", h: 74, w: 185 },
  { name: "Jacque Overton", pos: "SG", school: "Crowley", cls: "2025", level: "College", h: 73, w: 170 },
  { name: "Jaelen Block", pos: "SF", school: "Frisco Panther Creek", cls: "2026", level: "HS", h: 78, w: null },
  { name: "jaelon germany", pos: "PG", school: "Crowley High School", cls: "2026", level: "HS", h: 73, w: 175 },
  { name: "Jaelyn", pos: "PG", school: "David w carter", cls: "2026", level: "HS", h: 72, w: null },
  { name: "Jaki Bell", pos: "PG", school: "Mount Zion High School", cls: "2024", level: "College", h: 72, w: 175 },
  { name: "Jalen Shelley", pos: null, school: "Link Academy", cls: "2024", level: "College", h: 80, w: 190 },
  { name: "Jalon Q. Thompson", pos: "SF", school: "DeSoto HS", cls: "2024", level: "College", h: 81, w: 190 },
  { name: "Jaxon Sneed", pos: "SG", school: "Mansfield Summit", cls: "2026", level: "HS", h: 74, w: null },
  { name: "jaxson thompson", pos: "PG", school: "greenhill school", cls: "2026", level: "HS", h: 74, w: null },
  { name: "Jayden Miller", pos: "PG", school: "South oak cliff high school", cls: "2024", level: "College", h: 67, w: 145 },
  { name: "Jayden Thomas", pos: null, school: "lake travis highschool", cls: "2024", level: "College", h: 77, w: 182 },
  { name: "Jayvion hubbard", pos: "PF", school: null, cls: "2025", level: "College", h: 76, w: 185 },
  { name: "Jensen Knowles", pos: "SG", school: "Richardson high school", cls: "2024", level: "College", h: 76, w: 185 },
  { name: "Jerrin Goodwin", pos: "SG", school: "Cedar Hill High School", cls: "2025", level: "College", h: 77, w: 208 },
  { name: "JL Johnson", pos: null, school: null, cls: null, level: null, h: null, w: null },
  { name: "Jon Tran", pos: "PG", school: "Plano East Senior High", cls: "2024", level: "College", h: 74, w: 185 },
  { name: "Jonathan Fox", pos: "SF", school: "Crowley High school", cls: "2026", level: "HS", h: 74, w: 175 },
  { name: "Jordan Daylen Mizell", pos: "SG", school: "Plano East senior high school", cls: "2024", level: "College", h: 73, w: 170 },
  { name: "Jordan Mizell", pos: "SF", school: "Plano East Senior High School", cls: "2024", level: "College", h: 74, w: 170 },
  { name: "Josh Williams", pos: "SG", school: "Helena High School", cls: "2024", level: "College", h: null, w: 190 },
  { name: "Joshua Chalk", pos: "PG", school: "Pinkston high school", cls: "2026", level: "HS", h: null, w: null },
  { name: "Josiah Wray", pos: "PF", school: "Midland Christian", cls: "2024", level: "College", h: 78, w: 218 },
  { name: "Jude Mbaziira", pos: "PG", school: "Prolific prep", cls: "2026", level: "HS", h: 70, w: 165 },
  { name: "Justin McCall", pos: "SG", school: "Grissom high school", cls: "2024", level: "College", h: 73, w: 197 },
  { name: "Justin Redden", pos: "SF", school: "Billy ryan highschool", cls: "2024", level: "College", h: 79, w: 187 },
  { name: "Kaiden Myers", pos: "SG", school: "Allen", cls: "2024", level: "College", h: 76, w: 185 },
  { name: "Kamden T. McGilveary", pos: "PG", school: "Eastern Hills HighSchool", cls: "2026", level: "HS", h: 72, w: 170 },
  { name: "Kedreon Cole", pos: "SG", school: "Panther Creek highschool", cls: "2026", level: "HS", h: 75, w: 160 },
  { name: "Kenson Anderson", pos: "PG", school: "Chapel Hill", cls: "2026", level: "HS", h: 74, w: null },
  { name: "Keshawn Myles", pos: "PF", school: "Anna High School", cls: "2026", level: "HS", h: 75, w: null },
  { name: "Kole Williams", pos: "PG", school: "Carter highschool", cls: "2024", level: "College", h: 77, w: 210 },
  { name: "Kollin Douglas", pos: "SG", school: "Lancaster Highschool", cls: "2026", level: "HS", h: 75, w: null },
  { name: "Kordeldric Jefferson", pos: "SG", school: "Crowley Highschool", cls: "2027", level: "HS", h: 72, w: 159 },
  { name: "Kylin Green", pos: "PG", school: "Daytona State College", cls: "2026", level: "HS", h: 72, w: 175 },
  { name: "Lamar Napoleon", pos: "PG", school: "Boswell High ( fort worth, texas)", cls: "2025", level: "College", h: 72, w: 160 },
  { name: "Leon horner", pos: "SG", school: "Dynamic prep", cls: "2024", level: "College", h: 78, w: 203 },
  { name: "Logan Alexander", pos: "PF", school: "C.E. King high school", cls: "2024", level: "College", h: 81, w: 170 },
  { name: "Lonndon Beal", pos: "SG", school: "O'Connell prep", cls: "2025", level: "College", h: 74, w: 170 },
  { name: "Luca Robles", pos: "PG", school: "shadow creek high school", cls: "2026", level: "HS", h: 68, w: 135 },
  { name: "Major HOPKINS", pos: "PG", school: "Naaman Forest", cls: "2026", level: "HS", h: 75, w: 165 },
  { name: "malachi drake", pos: "PG", school: "allen", cls: "2024", level: "College", h: 73, w: 184 },
  { name: "Marcellous Jackson", pos: "PG", school: null, cls: "2026", level: "HS", h: 76, w: 190 },
  { name: "Mario Wooden Jr", pos: "SG", school: "Panther Creek High School", cls: "2025", level: "College", h: null, w: null },
  { name: "Markell gomillia", pos: "PG", school: "Dallaz Roosevelt", cls: "2026", level: "HS", h: 69, w: null },
  { name: "Mason", pos: "PG", school: "Seagoville High-School", cls: "2026", level: "HS", h: 72, w: null },
  { name: "Mason Shephard", pos: "PG", school: "Rockwall", cls: "2027", level: "HS", h: 73, w: 165 },
  { name: "Messiah miller", pos: "PG", school: "Eastern hills high school", cls: "2025", level: "College", h: 70, w: 140 },
  { name: "Micah Jerry-Holt", pos: "PF", school: "Arlington Heights High School", cls: "2024", level: "College", h: 77, w: 180 },
  { name: "Narit Roy Chotikavanic", pos: "SG", school: "Plano East Senior High", cls: "2024", level: "College", h: 74, w: 180 },
  { name: "Nicholas Addison", pos: "SG", school: "Cedar Hill", cls: "2024", level: "College", h: 74, w: 190 },
  { name: "Rashad Simpson", pos: "SG", school: "L.G Pinkston High School Dallas TX", cls: "2024", level: "College", h: null, w: 187 },
  { name: "Reggie McDonald", pos: "SF", school: "Bowie high school", cls: "2024", level: "College", h: null, w: 170 },
  { name: "Reginald Samuel", pos: null, school: "Cedar Hill High School", cls: "2025", level: "College", h: null, w: 200 },
  { name: "Ron Griffen", pos: "SG", school: "Richardson High School", cls: "2024", level: "College", h: 78, w: 170 },
  { name: "Samuel laeky", pos: "PF", school: "Allen highschool", cls: "2024", level: "College", h: null, w: 186 },
  { name: "Santana Spivey", pos: "SG", school: "Grand Prairie", cls: "2024", level: "College", h: 77, w: 180 },
  { name: "Sean Tang jr", pos: "PG", school: "IL Texas Arlington -Grand Prairie", cls: "2024", level: "College", h: 73, w: 170 },
  { name: "Shane Ross-Dory", pos: "PF", school: "Arlington Heights", cls: "2024", level: "College", h: 80, w: 185 },
  { name: "Shelton Manning Jr", pos: "SG", school: "Desoto Highschool", cls: "2024", level: "College", h: 72, w: 175 },
  { name: "Silas Rodriguez", pos: "SG", school: "Denton Guyer", cls: "2026", level: "HS", h: 74, w: 178 },
  { name: "Steven McLeod", pos: "PF", school: "Grand Prairie", cls: "2027", level: "HS", h: 78, w: 170 },
  { name: "Tajon Marion Spann", pos: "PG", school: "Walnut Grove High School", cls: "2026", level: "HS", h: null, w: null },
  { name: "Tajon Spann (TJ)", pos: "PG", school: "Frisco Memorial", cls: "2026", level: "HS", h: 70, w: 135 },
  { name: "Talib Love", pos: "SG", school: "Tulsa Central", cls: "2024", level: "College", h: 76, w: 200 },
  { name: "Thomas Mayfield", pos: "SF", school: "Tyler Chapel Hill", cls: "2026", level: "HS", h: 79, w: null },
  { name: "Trenton Pane", pos: "PG", school: "allen high", cls: "2025", level: "College", h: 71, w: 170 },
  { name: "Trenton Patterson", pos: "PG", school: "Richardson High School", cls: "2024", level: "College", h: 70, w: 170 },
  { name: "Trenton Thomas", pos: "SG", school: "Cedar Hill", cls: "2024", level: "College", h: 75, w: 166 },
  { name: "Trey Williams", pos: "PG", school: "WT White", cls: "2027", level: "HS", h: 73, w: 175 },
  { name: "Tristan Lewis", pos: "PG", school: "Kennedale High School", cls: "2024", level: "College", h: 70, w: 145 },
  { name: "Uziel Davis", pos: "SG", school: "Sanger High School", cls: "2025", level: "College", h: null, w: 147 },
  { name: "Uzziah Buntyn", pos: "PG", school: "stony point", cls: "2025", level: "College", h: null, w: 160 },
  { name: "Victor Dwain James", pos: "PG", school: "Crowley high school", cls: "2026", level: "HS", h: 70, w: 163 },
  { name: "Xavier Miller", pos: "SG", school: "Plano East", cls: "2024", level: "College", h: 74, w: 177 },
  { name: "Yusuf Muhammad", pos: "PF", school: "South oak cliff", cls: "2026", level: "HS", h: 82, w: null },
  { name: "Zaakir Sawyer", pos: "SG", school: "Trinity Valley Community College", cls: "2020", level: "College", h: 77, w: 215 },
  { name: "Zion Ibekwe", pos: "SF", school: "Big Tyme prep acedmy", cls: "2026", level: "HS", h: null, w: null },
];

/* ── DEMO intelligence (illustrative only) ─────────────────────────────────
   Deterministic per athlete name so the demo is stable across reloads.
   Mirrors live-pool.ts display shapes; the recommendation is the same
   transparent OVR-band mapping — NOT the proprietary matchmaking engine. */

export type DemoRec = "PURSUE" | "MONITOR" | "EVALUATE" | "PASS";

export interface DemoIntel {
  ovr: number;
  rec: DemoRec;
  band: "High" | "Moderate" | "Developing";
  neckUp: { label: string; value: number }[]; // 0–10 display bars
}

const NECK_UP_LABELS = [
  "PRO Score",
  "Culture Equity",
  "Resilience",
  "Coachability",
  "NER",
  "Playmaking",
  "Defense",
  "Physical Output",
];

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function recFromOvr(ovr: number): DemoRec {
  if (ovr >= 80) return "PURSUE";
  if (ovr >= 72) return "MONITOR";
  if (ovr >= 64) return "EVALUATE";
  return "PASS";
}

export function demoIntel(name: string): DemoIntel {
  const rand = mulberry32(fnv1a(name));
  const ovr = Math.round(60 + rand() * 27); // 60–87 illustrative band
  const neckUp = NECK_UP_LABELS.map((label) => ({
    label,
    value: Math.round((4 + rand() * 5.5) * 10) / 10, // 4.0–9.5
  }));
  const band = ovr >= 78 ? "High" : ovr >= 68 ? "Moderate" : "Developing";
  return { ovr, rec: recFromOvr(ovr), band, neckUp };
}
