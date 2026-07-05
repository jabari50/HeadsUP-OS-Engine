/* Ecosystem stats — grounded in jabari_ecosystem_v4.html (April 2026 brief).
   Update HERE when the brief updates; the ticker and dashboard read this. */

export interface EcosystemStat {
  label: string;
  value: string;
  color: "hgreen" | "hblue" | "hpurple" | "hpink" | "hamber" | "horange";
}

export const ECOSYSTEM_STATS: EcosystemStat[] = [
  { label: "Total Followers", value: "157,610", color: "hpink" },
  { label: "Monthly Social Reach", value: "4.3M+", color: "hgreen" },
  { label: "Industry Network", value: "300+", color: "hblue" },
  { label: "Levels of Play", value: "7", color: "hpurple" },
  { label: "Collegiate Coaches", value: "95+", color: "hgreen" },
  { label: "Pro Coaches & Execs", value: "40+", color: "hpink" },
  { label: "Scholastic Coaches", value: "70+", color: "hamber" },
  { label: "Grassroots Network", value: "70+", color: "hgreen" },
  { label: "NDA Athlete Orbit", value: "147+", color: "hblue" },
  { label: "HBCU Network", value: "52+", color: "horange" },
  { label: "Years DFW Authority", value: "25", color: "hgreen" },
  { label: "Operational Hours", value: "40K", color: "hblue" },
  { label: "Years Longitudinal Data", value: "20", color: "hpurple" },
  { label: "NBA Draft Proof Cases", value: "6+", color: "hamber" },
  { label: "Facebook", value: "90K", color: "hblue" },
  { label: "Instagram", value: "50K", color: "hpink" },
  { label: "TikTok", value: "11K", color: "hamber" },
  { label: "LinkedIn", value: "6,800", color: "hblue" },
  { label: "X / Twitter", value: "6,810", color: "hpurple" },
];

export const TICKER_TEXT_COLOR: Record<EcosystemStat["color"], string> = {
  hgreen: "text-hgreen",
  hblue: "text-hblue",
  hpurple: "text-hpurple",
  hpink: "text-hpink",
  hamber: "text-hamber",
  horange: "text-horange",
};
