import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-cond",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HeadsUp OS — Talent Intelligence",
  description:
    "Pipeline command center: player database, Neck Up / Neck Down profiles, DFW alumni ledger, intake onboarding, and evaluator sessions.",
  // Athlete profiles are share-by-link only — keep them out of search indexes.
  robots: { index: false, follow: false },
};

export default function TalentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${barlow.variable} ${barlowCondensed.variable}`}>
      {children}
    </div>
  );
}
