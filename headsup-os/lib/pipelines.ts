export interface Pipeline {
  id: number;
  slug: string;
  name: string;
  description: string;
  status: "active" | "building";
  color: string;
  scope: string[];
}

export const PIPELINES: Pipeline[] = [
  {
    id: 1,
    slug: "circuit",
    name: "Circuit Intelligence",
    description: "EYBL + 3SSB scraping, enrichment, and prospect scoring",
    status: "active",
    color: "from-blue-600 to-blue-800",
    scope: [
      "EYBL and 3SSB event scraping pipeline",
      "Alumni stat enrichment (Sports Reference / BBall Reference)",
      "Prospect scoring and circuit-wide rankings",
    ],
  },
  {
    id: 2,
    slug: "pipeline",
    name: "Scrape-to-Send",
    description: "Neural Data Agency — score, prototype, deploy client sites",
    status: "active",
    color: "from-violet-600 to-violet-800",
    scope: [
      "Neural Audit scoring via the HU-OS Engine",
      "Hughes Neural Score endpoints (/api/v1/nda)",
      "Client site prototyping and deployment handoff",
    ],
  },
  {
    id: 3,
    slug: "proquest",
    name: "Athlete ProQuest",
    description: "Intake gate, dashboard stack, and athlete profile management",
    status: "active",
    color: "from-emerald-600 to-emerald-800",
    scope: [
      "Live athlete onboarding (/onboard)",
      "OVR + tier computation, badge and quest engines",
      "Roster management (/roster)",
    ],
  },
  {
    id: 4,
    slug: "nil",
    name: "NIL Recruiting",
    description: "NIL strategy docs, recruiting intelligence, and advisory content",
    status: "building",
    color: "from-amber-600 to-amber-800",
    scope: [
      "Oracle NIL valuation engine (/api/v1/oracle)",
      "NIL strategy and advisory deliverables",
      "Recruiting intelligence briefs",
    ],
  },
  {
    id: 5,
    slug: "scouting",
    name: "Scouting Reports",
    description: "Structured player scouting reports and DFW landscape coverage",
    status: "building",
    color: "from-orange-600 to-orange-800",
    scope: [
      "Structured scouting report generation",
      "DFW landscape and district coverage",
      "Combine and showcase evaluation intake",
    ],
  },
  {
    id: 6,
    slug: "crm",
    name: "Contact Database",
    description: "CRM — segment, organize, and activate the contact network",
    status: "building",
    color: "from-cyan-600 to-cyan-800",
    scope: [
      "Contact segmentation and list building",
      "Google Form intake processing",
      "Import-ready exports for email platforms",
    ],
  },
  {
    id: 7,
    slug: "social",
    name: "Social Content Engine",
    description: "Platform-optimized content, captions, and content calendars",
    status: "building",
    color: "from-pink-600 to-pink-800",
    scope: [
      "Platform-optimized post and caption generation",
      "Editorial graphic briefs",
      "Content calendars",
    ],
  },
  {
    id: 8,
    slug: "digital",
    name: "HeadsUP Digital",
    description: "Client intake briefs, proposal decks, and digital project scopes",
    status: "building",
    color: "from-indigo-600 to-indigo-800",
    scope: [
      "Client intake briefs",
      "Proposal decks and project scopes",
      "Developer spec handoff",
    ],
  },
  {
    id: 9,
    slug: "foundation",
    name: "Foundation Curricula",
    description: "Youth development curriculum modules and program outlines",
    status: "building",
    color: "from-teal-600 to-teal-800",
    scope: [
      "Curriculum module generation",
      "Program outlines and session guides",
      "Six career-track materials",
    ],
  },
];
