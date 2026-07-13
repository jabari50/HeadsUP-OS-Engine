import Link from "next/link";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export default function Home() {
  return (
    <>
      {/* ── Data-forward hero: asymmetric, leads with the number ── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-16 lg:grid-cols-[7fr_5fr] lg:gap-0 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="relative z-10">
            <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
              Dallas–Fort Worth &middot; 501(c)(3) youth development
            </p>
            <h1 className="mt-6 font-headline text-5xl leading-none tracking-headline text-white lg:text-7xl">
              YOUR KID&rsquo;S GAME
              <br />
              IS THE HOOK.
              <br />
              WE HANDLE THE REST.
            </h1>
            <p className="mt-8 max-w-xl font-body text-base leading-relaxed text-white/80">
              Since 2003, The Heads Up! Foundation has used basketball to reach
              thousands of Dallas–Fort Worth youth — then taught the life
              skills, mentoring, and mindset that carry them past the final
              buzzer. Your game is just the beginning.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/programs"
                className="bg-teal px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
              >
                Explore Programs
              </Link>
              <Link
                href="/donate"
                className="border border-white/30 px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-white transition-colors hover:border-teal hover:text-teal"
              >
                Donate Now
              </Link>
            </div>
          </div>

          {/* Offset typographic panel — no stock photography, per spec */}
          <div className="relative flex items-center lg:-mr-16">
            <div className="w-full border-l-4 border-teal bg-navy-deep p-8 lg:p-12">
              <p className="font-quote text-2xl italic leading-snug text-white lg:text-3xl">
                &ldquo;It&rsquo;s easier to build strong children than to repair
                broken men.&rdquo;
              </p>
              <p className="mt-4 font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
                — Frederick Douglass
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
                <div>
                  <p className="font-stat text-4xl font-bold text-teal">1000s</p>
                  <p className="mt-1 font-body text-xs uppercase tracking-wide2 text-warmgray">
                    Youth reached
                  </p>
                </div>
                <div>
                  <p className="font-stat text-4xl font-bold text-teal">$0</p>
                  <p className="mt-1 font-body text-xs uppercase tracking-wide2 text-warmgray">
                    Government funding — community powered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works — 3-step plan ── */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <Reveal>
            <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
              How It Works
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Reveal>
              <div className="h-full border border-white/10 bg-navy-deep p-8">
                <p className="font-stat text-4xl font-bold text-teal">1</p>
                <p className="mt-3 font-body text-sm leading-relaxed text-white/80">
                  Find the right program for your athlete.
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-full border border-white/10 bg-navy-deep p-8">
                <p className="font-stat text-4xl font-bold text-teal">2</p>
                <p className="mt-3 font-body text-sm leading-relaxed text-white/80">
                  Enroll, or get involved as a volunteer, mentor, or sponsor.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="h-full border border-white/10 bg-navy-deep p-8">
                <p className="font-stat text-4xl font-bold text-teal">3</p>
                <p className="mt-3 font-body text-sm leading-relaxed text-white/80">
                  Watch them grow — on the court and off it.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Mission — editorial pull-quote treatment ── */}
      <section className="bg-cream text-navy">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-8">
          <Reveal>
            <p className="font-headline text-4xl tracking-headline">
              THE MISSION
            </p>
            <span className="rule-teal mt-4" />
          </Reveal>
          <Reveal delay={120}>
            <p className="font-quote text-2xl italic leading-relaxed lg:text-3xl">
              Enriching and enhancing the lives of youth through education,
              sports, and mentoring — providing the &lsquo;village&rsquo; every
              young person needs during their critical development years.
            </p>
            <p className="mt-6 max-w-2xl font-body text-sm leading-relaxed text-navy/70">
              We use youth-centered instruction in sports and education to help
              young people compete, grow academically, build physical fitness,
              and develop healthy habits that last a lifetime. Your game is just
              the beginning.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Programs preview — asymmetric, unequal columns ── */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <div className="mb-12">
              <p className="font-headline text-5xl tracking-headline text-white">
                WHAT WE RUN
              </p>
              <span className="rule-teal mt-4" />
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <Link
                href="/programs"
                className="group block h-full border border-white/10 bg-navy-deep p-8 transition-colors hover:border-teal lg:p-10"
              >
                <p className="font-stat text-sm font-bold uppercase text-teal">
                  Flagship
                </p>
                <p className="mt-3 font-headline text-4xl tracking-headline text-white">
                  3M MASTERCLASS: MINDSET &middot; MEDIA &middot; MENTORING
                </p>
                <p className="mt-4 max-w-lg font-body text-sm leading-relaxed text-warmgray">
                  An eight-week program that teaches student-athletes how to
                  handle pressure, media attention, and the balance between
                  school and sport. Live and virtual sessions, plus a parent
                  clinic.
                </p>
                <p className="mt-6 font-body text-xs font-bold uppercase tracking-wide2 text-teal group-hover:text-white">
                  Explore →
                </p>
              </Link>
            </Reveal>

            <div className="grid gap-6 lg:col-span-5">
              <Reveal delay={100}>
                <Link
                  href="/programs"
                  className="group block border border-white/10 p-8 transition-colors hover:border-teal"
                >
                  <p className="font-headline text-2xl tracking-headline text-white">
                    FLIGHT SCHOOL
                  </p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-warmgray">
                    Elite training paired with mindset, media, and mentorship,
                    for the athlete ready to go further.
                  </p>
                </Link>
              </Reveal>
              <Reveal delay={200}>
                <Link
                  href="/programs"
                  className="group block border border-white/10 p-8 transition-colors hover:border-teal"
                >
                  <p className="font-headline text-2xl tracking-headline text-white">
                    BASKETBALL &amp; LIFE SKILLS CAMPS
                  </p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-warmgray">
                    The program that started it all: fundamentals on the court,
                    teamwork and leadership off it.
                  </p>
                </Link>
              </Reveal>
            </div>
          </div>

          <Reveal delay={250}>
            <div className="mt-10">
              <Link
                href="/programs"
                className="font-body text-xs font-bold uppercase tracking-wide2 text-teal hover:text-white"
              >
                See All Programs →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Featured event ── */}
      <section className="border-b border-white/10 bg-navy-deep">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:px-8">
          <Reveal>
            <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
              Featured event
            </p>
            <p className="mt-4 font-headline text-5xl leading-none tracking-headline text-white lg:text-6xl">
              10TH ANNUAL
              <br />
              DFW HIGH SCHOOL
              <br />
              ALL-STAR SHOWCASE
            </p>
            <p className="mt-4 font-stat text-2xl font-bold text-teal">
              MARCH 22, 2026
            </p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center">
            <p className="max-w-xl font-body text-sm leading-relaxed text-warmgray">
              <NeedsInput label="confirm Foundation vs. HeadsUP MEDIA relationship for Showcase/Combine copy" />
            </p>
            <div className="mt-8">
              <Link
                href="/events"
                className="inline-block border border-teal px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-teal transition-colors hover:bg-teal hover:text-navy"
              >
                Event Details
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Real testimonial (from old Foundation site) ── */}
      <section className="bg-cream text-navy">
        <div className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
          <Reveal>
            <span className="rule-teal mb-8" />
            <p className="font-quote text-2xl italic leading-relaxed lg:text-3xl">
              &ldquo;Since becoming involved with your camps and programs, he has
              become an honor roll student, understands how to work as a team,
              and has since become a standout on the same team he was once cut
              from.&rdquo;
            </p>
            <p className="mt-6 font-body text-xs font-bold uppercase tracking-wide2 text-navy/60">
              — Linda, Heads Up! parent
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Donate CTA band ── */}
      <section>
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Reveal>
            <p className="font-headline text-5xl tracking-headline text-white">
              BE THE VILLAGE.
            </p>
            <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-warmgray">
              We take no government funds. Our average gift is $15 — and
              it&rsquo;s what keeps gyms open, mentors present, and every
              program free for the families who need it most.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <Link
              href="/donate"
              className="inline-block bg-teal px-10 py-5 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
            >
              Donate Now
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
