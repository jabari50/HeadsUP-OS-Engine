/* The Virtual GM — demo data.
   Player pool sourced from the real Heads UP GoPRO Global Talent Network
   responses (Class of 2026, DFW). OVR / Fit / archetypes are product-output
   examples generated for the prototype. */

export type Recommendation = "PURSUE" | "MONITOR" | "EVALUATE" | "PASS";
export type Priority = "HIGH" | "MED" | "LOW";
export type DnaStatus = "pending" | "stated" | "active" | "building";

export interface PlayerDims {
  style: number;
  need: number;
  level: number;
  cultural: number;
  compOutcome: number;
  archetype: number;
  pattern: number;
  market: number;
}

export interface Player {
  id: string;
  name: string;
  pos: string;
  height: string;
  classYear: string;
  school: string;
  aau: string;
  gpa: string;
  stats: string;
  archetype: string;
  tier: string;
  ovr: number;
  fit: number;
  fit5: number;
  rec: Recommendation;
  compShort: string;
  dims: PlayerDims;
  rationale: string;
}

export interface CompPlayer {
  name: string;
  classYear: string;
  pos: string;
  archetype: string;
  outcome: string;
  detail: string;
  sim: number;
}

export interface RosterGap {
  pos: string;
  need: string;
  pri: Priority;
}

export interface WizardOption {
  label: string;
  desc?: string;
}

export interface WizardStep {
  id: string;
  type: "single" | "multi" | "rank" | "physical" | "form";
  title: string;
  sub?: string;
  max?: number;
  options?: WizardOption[];
  fields?: { id: string; label: string; value: number | string }[];
  toggle?: { id: string; label: string; value: boolean };
}

export interface DimMeta {
  id: keyof PlayerDims;
  label: string;
  src: "coach" | "athlete" | null;
}

export const VGM_DATA = {
  coach: {
    name: "Coach D. Walker",
    school: "Red Oak HS",
    season: "2026–27",
    tier: "Scout Tier",
    credits: 12,
  },

  players: [
    {
      id: "kirk",
      name: "Devan Kirk",
      pos: "CG",
      height: "6'5\"",
      classYear: "2026",
      school: "Red Oak HS",
      aau: "TJ Texas Impact",
      gpa: "3.3",
      stats: "12 PPG · 10 RPG · 4 APG",
      archetype: "3-and-D Wing",
      tier: "Impact",
      ovr: 74,
      fit: 82,
      fit5: 76,
      rec: "PURSUE",
      compShort: "D. Thompson → D1 Mid-Major Starter",
      dims: {
        style: 7.2,
        need: 8.1,
        level: 8.0,
        cultural: 7.4,
        compOutcome: 7.8,
        archetype: 8.8,
        pattern: 8.2,
        market: 7.0,
      },
      rationale:
        "Kirk's wing profile matches your program's historical 3-and-D archetype at 87% similarity. Rebounds like a forward at 6'5\", defends 1–4, and his mid-major interest tier aligns with your placement pattern. Coach contact: Chris Davis (Red Oak).",
    },
    {
      id: "deffebaugh",
      name: "Caden Deffebaugh",
      pos: "SG",
      height: "6'5\"",
      classYear: "2026",
      school: "Frisco Memorial HS",
      aau: "YGC / Walker",
      gpa: "3.75",
      stats: "26 PPG",
      archetype: "Three-Level Scorer",
      tier: "Impact",
      ovr: 78,
      fit: 79,
      fit5: 73,
      rec: "PURSUE",
      compShort: "A. Reyes → D1 Low-Major All-Freshman",
      dims: {
        style: 8.0,
        need: 7.2,
        level: 8.3,
        cultural: 7.6,
        compOutcome: 7.9,
        archetype: 8.1,
        pattern: 7.7,
        market: 7.6,
      },
      rationale:
        "DPOY + OPOY in the same cycle — two-way volume scorer with the motor profile your wizard flagged first.",
    },
    {
      id: "muhammad",
      name: "Yusuf Muhammad",
      pos: "F/C",
      height: "6'10\"",
      classYear: "2026",
      school: "South Oak Cliff HS",
      aau: "ElevateU",
      gpa: "3.4",
      stats: "18 PPG · 8 RPG",
      archetype: "Rim Runner / Protector",
      tier: "Impact",
      ovr: 76,
      fit: 74,
      fit5: 70,
      rec: "MONITOR",
      compShort: "K. Boateng → D1 Mid-Major rotation",
      dims: {
        style: 6.8,
        need: 9.1,
        level: 7.7,
        cultural: 7.2,
        compOutcome: 7.0,
        archetype: 7.4,
        pattern: 6.9,
        market: 7.3,
      },
      rationale:
        "Directly fills your Center gap — rim protection plus mid-range touch. Watch list until spring eval.",
    },
    {
      id: "dixon",
      name: "Bryce Dixon",
      pos: "G",
      height: "6'4\"",
      classYear: "2026",
      school: "The Colony HS",
      aau: "Legynds / Wrice",
      gpa: "3.7",
      stats: "22.5 PPG · 7 RPG",
      archetype: "Downhill Creator",
      tier: "Impact",
      ovr: 75,
      fit: 71,
      fit5: 68,
      rec: "MONITOR",
      compShort: "School scoring record holder",
      dims: {
        style: 7.4,
        need: 6.4,
        level: 7.8,
        cultural: 7.5,
        compOutcome: 6.9,
        archetype: 7.0,
        pattern: 6.8,
        market: 7.1,
      },
      rationale:
        "Physical guard who gets downhill at will; overlaps with current roster usage.",
    },
    {
      id: "wyatt",
      name: "Canon Wyatt",
      pos: "PG",
      height: "6'0\"",
      classYear: "2026",
      school: "Highland Park HS",
      aau: "Triumph UA Rise",
      gpa: "4.49",
      stats: "17.6 PPG · 3.5 APG",
      archetype: "Floor General / Shooter",
      tier: "Contributor",
      ovr: 72,
      fit: 68,
      fit5: 65,
      rec: "EVALUATE",
      compShort: "Academic all-state · efficiency riser",
      dims: {
        style: 7.1,
        need: 7.6,
        level: 6.6,
        cultural: 7.9,
        compOutcome: 6.2,
        archetype: 6.5,
        pattern: 6.4,
        market: 6.6,
      },
      rationale:
        "4.49 GPA clears every non-negotiable; playoff splits trend up (20.1 PPG).",
    },
    {
      id: "mayfield",
      name: "Thomas Mayfield",
      pos: "SF",
      height: "6'7\"",
      classYear: "2026",
      school: "Tyler Chapel Hill HS",
      aau: "Tre Agers",
      gpa: "3.4",
      stats: "21.3 PPG · 13 RPG",
      archetype: "Glass-Cleaning Forward",
      tier: "Contributor",
      ovr: 73,
      fit: 66,
      fit5: 63,
      rec: "EVALUATE",
      compShort: "2× 3rd Team All-State",
      dims: {
        style: 6.2,
        need: 7.3,
        level: 6.8,
        cultural: 6.9,
        compOutcome: 6.1,
        archetype: 6.3,
        pattern: 6.0,
        market: 6.4,
      },
      rationale:
        "Production is real (21 & 13); distance from district raises pattern-fit questions.",
    },
    {
      id: "sneed",
      name: "Jaxon Sneed",
      pos: "CG",
      height: "6'2\"",
      classYear: "2026",
      school: "Mansfield Summit HS",
      aau: "ProSkills",
      gpa: "3.96",
      stats: "13.5 PPG · 3.9 APG · 4.3 RPG",
      archetype: "Playmaking Guard",
      tier: "Contributor",
      ovr: 70,
      fit: 64,
      fit5: 61,
      rec: "EVALUATE",
      compShort: "High-IQ connector profile",
      dims: {
        style: 6.6,
        need: 6.2,
        level: 6.4,
        cultural: 8.2,
        compOutcome: 5.9,
        archetype: 6.0,
        pattern: 6.1,
        market: 6.2,
      },
      rationale:
        "Elite culture marks and 3.96 GPA; scoring load below your guard baseline.",
    },
    {
      id: "gomillia",
      name: "Markell Gomillia",
      pos: "PG",
      height: "5'9\"",
      classYear: "2026",
      school: "Dallas Roosevelt HS",
      aau: "HPP Elite / FOE",
      gpa: "3.5",
      stats: "23 PPG · 7 APG · 8 SPG",
      archetype: "Pressure Pest",
      tier: "Contributor",
      ovr: 69,
      fit: 49,
      fit5: 47,
      rec: "PASS",
      compShort: "1,700+ career points",
      dims: {
        style: 5.4,
        need: 6.8,
        level: 5.2,
        cultural: 6.1,
        compOutcome: 4.4,
        archetype: 4.6,
        pattern: 4.2,
        market: 4.8,
      },
      rationale:
        "Production is loud, but height sits below your PG baseline and pattern-fit is weak.",
    },
  ] as Player[],

  featuredId: "kirk",

  comps: [
    {
      name: "Darius Thompson",
      classYear: "2022",
      pos: "SF",
      archetype: "3-and-D Wing",
      outcome: "D1 Mid-Major starter by Year 2",
      detail: "Stephen F. Austin — 14.2 PPG",
      sim: 87,
    },
    {
      name: "Marcus Reed",
      classYear: "2021",
      pos: "SG",
      archetype: "Two-Way Wing",
      outcome: "JUCO → D2 All-Conference",
      detail: "Tyler JC → West Texas A&M",
      sim: 84,
    },
    {
      name: "TJ Caldwell",
      classYear: "2023",
      pos: "SF",
      archetype: "3-and-D Wing",
      outcome: "D1 Low-Major rotation, Year 1",
      detail: "Texas A&M–CC — 16 MPG",
      sim: 81,
    },
  ] as CompPlayer[],

  gaps: [
    { pos: "Point Guard", need: "Passing + Court Vision", pri: "HIGH" },
    { pos: "Center", need: "Rim Protection", pri: "MED" },
    { pos: "Wing", need: "Catch-and-Shoot", pri: "LOW" },
  ] as RosterGap[],

  rib: {
    week: "Week of Jun 8, 2026",
    portal: ["muhammad", "wyatt"],
    competitor: [
      {
        who: "Duncanville",
        move: "confirmed PG Chris Gooden Jr. (5'11\", 3d Empire)",
        impact: "impacts your Point Guard gap",
      },
      {
        who: "Lancaster",
        move: "added two-way wing Kollin Douglas (6'3\")",
        impact: "raises district wing depth",
      },
    ],
    actions: [
      "Call Chris Davis (Red Oak) — schedule a gym visit for Devan Kirk before the live period.",
      "Issue Athlete DNA invites to your top 3 draft-board guards. 8-dim scores unlock on redemption.",
      "Pull film on Yusuf Muhammad (South Oak Cliff) — fills your Center gap before Duncanville moves.",
    ],
  },

  wizardSteps: [
    {
      id: "identity",
      type: "single",
      title: "What defines your program?",
      sub: "Pick the identity closest to how you actually win games.",
      options: [
        { label: "Defense wins games", desc: "We hang our hat on stops" },
        { label: "Pace & space", desc: "Push tempo, hunt threes" },
        { label: "Grind-it-out toughness", desc: "Physical, half-court battles" },
        { label: "Player development first", desc: "We build kids into players" },
      ],
    },
    {
      id: "roster",
      type: "single",
      title: "How do you build your roster?",
      sub: "Your honest default — not the brochure answer.",
      options: [
        { label: "Develop from our feeder program", desc: "Freshmen up, four-year players" },
        { label: "Open to transfers", desc: "If they can help, the door is open" },
        { label: "Best available, period", desc: "Talent first, fit second" },
        { label: "Build around 2–3 cornerstones", desc: "Stars plus role clarity" },
      ],
    },
    {
      id: "offense",
      type: "multi",
      title: "Pick your offensive identity.",
      sub: "Select everything you run by choice, not necessity.",
      options: [
        { label: "5-out motion" },
        { label: "Ball-screen heavy" },
        { label: "Transition attack" },
        { label: "Inside-out through the post" },
        { label: "Shooting gravity" },
      ],
    },
    {
      id: "defense",
      type: "multi",
      title: "What's your defensive DNA?",
      sub: "Select all that apply.",
      options: [
        { label: "Full-court pressure" },
        { label: "Pack-line — protect the paint" },
        { label: "Switch everything" },
        { label: "Mix in zone looks" },
      ],
    },
    {
      id: "positions",
      type: "rank",
      title: "Rank what you recruit first.",
      sub: "Drag to order. #1 is the first hole you fill every cycle.",
      options: [
        { label: "Point guard play" },
        { label: "Wing shooting" },
        { label: "Rim protection" },
        { label: "Positional size" },
        { label: "Versatile combo" },
      ],
    },
    {
      id: "physical",
      type: "physical",
      title: "Set your physical baselines.",
      sub: "Minimum heights you'll recruit at each spot. Adjust with + / −.",
      fields: [
        { id: "pg", label: "Point Guard min", value: 69 },
        { id: "wing", label: "Wing min", value: 75 },
        { id: "big", label: "Big min", value: 79 },
      ],
      toggle: {
        id: "wingspan",
        label: 'Prioritize +2" wingspan over height',
        value: true,
      },
    },
    {
      id: "traits",
      type: "multi",
      title: "Which traits move a kid up your board?",
      sub: "Pick your top 3.",
      max: 3,
      options: [
        { label: "Motor" },
        { label: "IQ + feel" },
        { label: "Length" },
        { label: "Shooting" },
        { label: "Vocal leadership" },
        { label: "Toughness" },
      ],
    },
    {
      id: "nonnegotiable",
      type: "multi",
      title: "What are your non-negotiables?",
      sub: "A recruit missing these never makes your board.",
      options: [
        { label: "GPA floor — 3.0+" },
        { label: "Coachability" },
        { label: "Multi-sport background" },
        { label: "Family engagement" },
        { label: "Eligibility headroom" },
      ],
    },
    {
      id: "development",
      type: "single",
      title: "What's your development model?",
      sub: "How players actually get better in your gym.",
      options: [
        { label: "Year-round skill blocks", desc: "Individual work never stops" },
        { label: "Strength + conditioning first", desc: "Bodies before buckets" },
        { label: "Film-heavy teaching", desc: "We learn it before we drill it" },
        { label: "Compete every rep", desc: "Everything is scored, everything counts" },
      ],
    },
    {
      id: "goals",
      type: "single",
      title: "What does success look like in 3 years?",
      sub: "This calibrates Level Fit and Comp Outcome weighting.",
      options: [
        { label: "District titles", desc: "Own the district, every year" },
        { label: "Deep state runs", desc: "Built for March" },
        { label: "Next-level placements", desc: "Get kids to college rosters" },
        { label: "Tradition + culture", desc: "A program kids grow up wanting" },
      ],
    },
  ] as WizardStep[],

  athleteSteps: [
    {
      id: "basics",
      type: "form",
      title: "First, the basics.",
      fields: [
        { id: "name", label: "Full name", value: "Devan Kirk" },
        { id: "year", label: "Grad year", value: "2026" },
        { id: "pos", label: "Primary position", value: "Combo Guard" },
        { id: "school", label: "School", value: "Red Oak HS" },
      ],
    },
    {
      id: "offers",
      type: "multi",
      title: "Where's your recruitment right now?",
      sub: "Select every tier that's shown real interest.",
      options: [
        { label: "Just getting started" },
        { label: "D3 / NAIA interest" },
        { label: "D2 offers" },
        { label: "D1 low-major contact" },
        { label: "D1 mid-major+ offers" },
      ],
    },
    {
      id: "program",
      type: "single",
      title: "What matters most in a program?",
      options: [
        { label: "Culture + relationships", desc: "Coaches who invest in me" },
        { label: "Academics", desc: "Degree comes first" },
        { label: "Playing time", desc: "I want to earn minutes early" },
        { label: "Close to home", desc: "Family in the stands" },
      ],
    },
    {
      id: "goals",
      type: "rank",
      title: "Rank your development goals.",
      sub: "Drag to order what you want to work on first.",
      options: [
        { label: "Scoring" },
        { label: "Defense" },
        { label: "Leadership" },
        { label: "Strength" },
        { label: "Ball-handling" },
      ],
    },
    {
      id: "decision",
      type: "single",
      title: "Who's in the room when you decide?",
      options: [
        { label: "Family decides together", desc: "Parents + me, one table" },
        { label: "Player-led", desc: "My call, family supports" },
        { label: "Coach-guided", desc: "My coaches drive the process" },
        { label: "Mentors + faith", desc: "A wider circle weighs in" },
      ],
    },
  ] as WizardStep[],

  dimMeta: [
    { id: "style", label: "Style Fit", src: null },
    { id: "need", label: "Need Fit", src: null },
    { id: "level", label: "Level Fit", src: null },
    { id: "cultural", label: "Cultural Fit", src: null },
    { id: "compOutcome", label: "Comp Outcome", src: "athlete" },
    { id: "archetype", label: "Archetype Match", src: "coach" },
    { id: "pattern", label: "Recruiting Pattern", src: "coach" },
    { id: "market", label: "Market Alignment", src: "athlete" },
  ] as DimMeta[],

  baseDims: ["style", "need", "level", "cultural", "compOutcome"] as (keyof PlayerDims)[],
};

export function inchesLabel(n: number): string {
  return `${Math.floor(n / 12)}'${n % 12}"`;
}
