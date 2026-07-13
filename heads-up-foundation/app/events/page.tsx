import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "Events",
  description:
    "The DFW High School All-Star Showcase, Unsigned Diamonds Combine, and HOOPS4HEALING celebrity game.",
};

export default function EventsPage() {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
            Events
          </p>
          <h1 className="mt-4 font-headline text-6xl leading-none tracking-headline text-white lg:text-7xl">
            WHERE DFW SHOWS UP
          </h1>
          <span className="rule-teal mt-6" />
        </div>
      </section>

      {/* Showcase — big editorial block */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[7fr_5fr] lg:px-8">
          <Reveal>
            <p className="font-stat text-sm font-bold uppercase text-gold">
              10th Annual
            </p>
            <h2 className="mt-3 font-headline text-5xl leading-none tracking-headline text-white lg:text-6xl">
              DFW HIGH SCHOOL
              <br />
              ALL-STAR SHOWCASE
            </h2>
            <p className="mt-4 font-stat text-3xl font-bold text-teal">
              MARCH 22, 2026
            </p>
            <p className="mt-6 max-w-xl font-body text-sm leading-relaxed text-warmgray">
              A decade of putting the Metroplex&rsquo;s best seniors on one
              floor.{" "}
            </p>
            <div className="mt-4 max-w-xl">
              <NeedsInput label="Showcase copy — pending Foundation vs. HeadsUP MEDIA relationship confirmation + registration link" />
            </div>
          </Reveal>
          <Reveal delay={120} className="flex items-center">
            <div className="w-full border-l-4 border-gold bg-navy-deep p-8">
              <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
                Also in March 2026
              </p>
              <p className="mt-3 font-headline text-4xl tracking-headline text-white">
                UNSIGNED DIAMONDS COMBINE
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-warmgray">
                The exposure combine for unsigned seniors still chasing a
                college roster spot.
              </p>
              <div className="mt-4">
                <NeedsInput label="Combine date, venue, registration link" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOOPS4HEALING */}
      <section className="border-b border-white/10 bg-navy-deep">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:px-8">
          <Reveal>
            <h2 className="font-headline text-5xl tracking-headline text-white">
              HOOPS4HEALING
            </h2>
            <span className="rule-teal mt-4" />
          </Reveal>
          <Reveal delay={120}>
            <p className="font-body text-sm leading-relaxed text-white/80">
              Our celebrity benefit basketball game and community outreach
              event. Over the years the roster has featured NFL and NBA players
              — Dez Bryant, Terrance Newman, Andre Johnson, Donald Sloan, Andre
              Emmett, Isaiah Austin, LeBryan Nash — plus entertainers,
              community leaders, and law enforcement, with K104&rsquo;s Lady
              Jade and Cat Daddy as celebrity hosts. Hometown heroes, center
              stage, building better families, schools, and communities through
              basketball.
            </p>
            <div className="mt-4">
              <NeedsInput label="next HOOPS4HEALING date" />
            </div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-headline text-5xl tracking-headline text-white">
            WANT IN THE BUILDING?
          </p>
          <Link
            href="/contact"
            className="bg-teal px-10 py-5 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
          >
            Register / Attend
          </Link>
        </div>
      </section>
    </>
  );
}
