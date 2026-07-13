import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Basketball and life-skills camps, the 3M Masterclass, Flight School, Student Leadership Summit, and mentoring programs for Dallas–Fort Worth youth.",
};

const PROGRAMS = [
  {
    tag: "Flagship Masterclass",
    name: "3M: MINDSET, MEDIA, MENTORING",
    body: "An eight-week masterclass designed for student-athletes: growth mindset, grit and perseverance, character development, the laws of teamwork and leadership, mental health management, emotional intelligence, school/sport balance, and public speaking and media training. Four hours per week — live and virtual sessions — plus a two-hour parent clinic.",
    wide: true,
  },
  {
    tag: "Elite Academy",
    name: "FLIGHT SCHOOL",
    body: "An exclusive skills academy for elite student-athletes: athletic training and performance coaching, life-skill enrichment, mindset coaching, media training and brand development, strength and conditioning, community engagement, college tours, and mentorship with accountability. Coaching staff carries 50+ combined years of collegiate and professional experience.",
    note: "current schedule/location",
  },
  {
    tag: "The Original",
    name: "SUMMER BASKETBALL & LIFE SKILLS CAMPS",
    body: "The program that started it all. Superior basketball instruction alongside teamwork, leadership, ethics, the value of education, and healthy habits — taught by professional and collegiate athletes and experienced coaches.",
  },
  {
    tag: "Transition to College",
    name: "STUDENT LEADERSHIP SUMMIT",
    body: "Hands-on leadership sessions, critical dialogue, and connections to professionals in higher education and the public and private sectors — built for students making the jump from high school to college.",
  },
  {
    tag: "Digital Literacy",
    name: "SOCIAL MEDIA U",
    body: "An eight-week course teaching teenagers to communicate in a connected world: the power and dangers of social media, personal branding, and the do's and don'ts for athletes hoping to play at the next level.",
  },
  {
    tag: "Community Outreach",
    name: "HOOPS4HEALING CELEBRITY GAME",
    body: "The celebrity benefit basketball game that caps our camps — homegrown professional athletes, community leaders, and law enforcement using their platform to build better families, schools, and communities through basketball.",
  },
  {
    tag: "In-School Initiative",
    name: "MENTORING & MINDSET DEVELOPMENT",
    body: "An after-school masterclass in partnership with Metroplex school districts: eight months of workshops, motivational speakers, and teen-led activities covering leadership, college and career prep, conflict resolution, goal setting, and community service.",
    wide: true,
  },
];

export default function ProgramsPage() {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
            Programs &amp; Initiatives
          </p>
          <h1 className="mt-4 max-w-3xl font-headline text-6xl leading-none tracking-headline text-white lg:text-7xl">
            THE GAME IS THE HOOK. THE LESSON IS LIFE.
          </h1>
          <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-white/80">
            Pick the program that fits where your athlete is right now — every
            track pairs basketball development with real life-skills
            instruction.
          </p>
          <span className="rule-teal mt-6" />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-12">
            {PROGRAMS.map((p, i) => (
              <Reveal
                key={p.name}
                delay={(i % 3) * 100}
                className={p.wide ? "lg:col-span-7" : "lg:col-span-5"}
              >
                <article
                  className={`flex h-full flex-col border border-white/10 p-8 transition-colors hover:border-teal lg:p-10 ${
                    i % 2 === 0 ? "bg-navy-deep" : ""
                  }`}
                >
                  <p className="font-stat text-sm font-bold uppercase text-teal">
                    {p.tag}
                  </p>
                  <h2 className="mt-3 font-headline text-3xl tracking-headline text-white">
                    {p.name}
                  </h2>
                  <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-warmgray">
                    {p.body}
                  </p>
                  {p.note && (
                    <div className="mt-4">
                      <NeedsInput label={p.note} />
                    </div>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Career pathways — pending confirmation */}
      <section className="bg-cream text-navy">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-8">
          <Reveal>
            <p className="font-headline text-4xl tracking-headline">
              CAREER PATHWAYS
            </p>
            <span className="rule-teal mt-4" />
          </Reveal>
          <Reveal delay={120}>
            <p className="font-body text-sm leading-relaxed text-navy/80">
              Beyond the playing career: structured tracks that show
              student-athletes the professional world around the game.
            </p>
            <div className="mt-6">
              <NeedsInput label="final confirmed career-pathway track names + descriptions (coaching, front office, agency, media, analytics were examples, not a confirmed list)" />
            </div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-headline text-5xl tracking-headline text-white">
            READY TO ENROLL?
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="bg-teal px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
            >
              Enroll / Refer a Youth
            </Link>
            <Link
              href="/get-involved"
              className="border border-white/30 px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-white transition-colors hover:border-teal hover:text-teal"
            >
              Sponsor a Student
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
