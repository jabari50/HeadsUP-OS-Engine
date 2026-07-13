import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "About / Mission",
  description:
    "Founded in 2003 by retired pro athlete Jabari Johnson, The Heads Up! Foundation uses basketball as a vehicle for youth development in Dallas–Fort Worth.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero — asymmetric, editorial */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[8fr_4fr] lg:px-8">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
              About / Mission
            </p>
            <h1 className="mt-4 font-headline text-6xl leading-none tracking-headline text-white lg:text-7xl">
              BUILT IN DALLAS.
              <br />
              BUILT FOR YOUTH.
            </h1>
            <span className="rule-teal mt-6" />
          </div>
          <div className="flex items-end">
            <p className="font-stat text-xl font-bold text-teal">
              EST. 2003 &middot; 501(c)(3)
            </p>
          </div>
        </div>
      </section>

      {/* The problem / the solution — unequal columns */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:px-8">
          <Reveal>
            <p className="font-headline text-4xl tracking-headline text-white">
              WHY WE EXIST
            </p>
            <span className="rule-teal mt-4" />
            <p className="mt-6 font-body text-sm leading-relaxed text-warmgray">
              Children from lower-income families are too often shut out of
              quality enrichment programs and organized sport — a late start
              that costs them the lifelong benefits sports participation
              provides. The Heads Up! Foundation was created to give youth in
              under-served areas access to higher-level sports and educational
              programs, absent financial constraints.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className="font-headline text-4xl tracking-headline text-white">
              HOW WE ANSWER
            </p>
            <span className="rule-teal mt-4" />
            <p className="mt-6 font-body text-sm leading-relaxed text-white/80">
              We promote the total development of youth through sports,
              life-skill training, and mentoring. Our biggest draw — the annual
              basketball and life-skills camp — has attracted youth from across
              the Southwest region. Basketball skills are taught, but the daily
              curriculum runs deeper: teamwork, leadership development, ethics,
              the value of education, healthy habits, and how to make informed
              choices. Instructors are current and former collegiate and
              professional athletes and high school coaches; counselors and
              staff are trained local professionals who volunteer their time.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-warmgray">
              Over the years our camps, outreach, and celebrity benefit games
              have drawn support from pros like Dez Bryant, Terrance Newman,
              Raja Bell, and Andre Emmett, alongside partners including the NBA
              FIT Youth Program, Dallas ISD, the American Heart Association, and
              the Dallas and Arlington police departments.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Founder story */}
      <section className="border-b border-white/10 bg-navy-deep">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[4fr_8fr] lg:px-8">
          <Reveal>
            <div className="border-l-4 border-teal pl-6">
              <p className="font-headline text-5xl leading-none tracking-headline text-white">
                JABARI
                <br />
                JOHNSON
              </p>
              <p className="mt-3 font-body text-xs font-semibold uppercase tracking-wide2 text-teal">
                Founder / CEO
              </p>
              <div className="mt-8 space-y-4">
                <div>
                  <p className="font-stat text-3xl font-bold text-teal">1,500+</p>
                  <p className="font-body text-xs uppercase tracking-wide2 text-warmgray">
                    Collegiate points
                  </p>
                </div>
                <div>
                  <p className="font-stat text-3xl font-bold text-teal">700</p>
                  <p className="font-body text-xs uppercase tracking-wide2 text-warmgray">
                    Collegiate assists
                  </p>
                </div>
                <div>
                  <p className="font-stat text-3xl font-bold text-teal">22</p>
                  <p className="font-body text-xs uppercase tracking-wide2 text-warmgray">
                    Age when he founded Heads Up!
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <NeedsInput label="founder headshot" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="font-quote text-xl italic leading-relaxed text-teal">
              We built Heads Up! because someone once did the same for us —
              here&rsquo;s that story.
            </p>
            <p className="mt-6 font-body text-sm leading-relaxed text-white/80">
              Jabari Johnson is a retired professional athlete, entrepreneur,
              and philanthropist. A standout at Dallas&rsquo;s David W. Carter
              High School — honor graduate, All-District, All-Region, All-State,
              and a McDonald&rsquo;s All-American nominee — he signed with
              Louisiana Tech before finishing his career at UT-Arlington, where
              he was an All-Conference performer and an ESPN class-of-2001 NBA
              draft prospect, regarded as one of the school&rsquo;s all-time
              greats. His professional career spanned the ABA, CBA, and Europe,
              including a year as a player-coach.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-white/80">
              The Foundation started before the pro career ended. Home from
              college in the off-season, Jabari volunteered with small groups of
              neighborhood youth and school teams — teaching basketball
              fundamentals as the &lsquo;hook&rsquo; to mentor and enrich every
              other area of their development. Kids arrived early and stayed
              late. Young people who had been labeled at-risk or written off
              began improving — academically, athletically, socially. The
              question became obvious: could basketball be the starting point
              for academic enrichment, literacy, team-building, and service
              learning? The Heads Up! Foundation — and the Heads Up! Youth
              Basketball and Life Skills Camp — was the answer.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-warmgray">
              A 2002 UT-Arlington graduate (Business Administration and
              Communication Technology, Spanish minor), Jabari has appeared in
              global Nike commercials with Dirk Nowitzki and Jason Kidd, founded
              the North Texas Hoop Summit college-exposure combine, and has been
              recognized with the Lancaster Chamber of Commerce 40 Under 40
              Leadership Award and the Dallas County Peace Officers
              Association&rsquo;s Pinnacle Award. He is a member of Omega Psi
              Phi Fraternity and a 2011 graduate of Leadership Southwest.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Foundation ↔ HeadsUP MEDIA relationship */}
      <section className="bg-cream text-navy">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-8">
          <Reveal>
            <p className="font-headline text-4xl tracking-headline">
              THE NETWORK
            </p>
            <span className="rule-teal mt-4" />
          </Reveal>
          <Reveal delay={120}>
            <p className="font-body text-sm leading-relaxed text-navy/80">
              The Heads Up! Foundation is the 501(c)(3) community arm of the
              HeadsUP network, alongside HeadsUP MEDIA &amp; Scouting and the
              PRO-File OS athlete development platform. The Foundation runs the
              community programming; the network brings the scouting eye, media
              reach, and technology.
            </p>
            <div className="mt-6">
              <NeedsInput label="confirm exact relationship language between Foundation and HeadsUP MEDIA before publish" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials — real, from old site */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <Reveal>
            <p className="font-headline text-5xl tracking-headline text-white">
              THE HEADS UP! STORY
            </p>
            <span className="rule-teal mt-4" />
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-[7fr_5fr]">
            <Reveal delay={100}>
              <blockquote className="h-full border border-white/10 bg-navy-deep p-8">
                <p className="font-quote text-xl italic leading-relaxed text-white">
                  &ldquo;The Heads Up! experience was excellent for my son.
                  Athletic and leadership skills were developed while a strong
                  foundation of discipline was established. He left Heads Up
                  understanding more about the game — but as a parent, I was
                  most proud of the lessons he learned about himself.&rdquo;
                </p>
                <footer className="mt-4 font-body text-xs font-bold uppercase tracking-wide2 text-teal">
                  — Patrick, Heads Up! parent
                </footer>
              </blockquote>
            </Reveal>
            <Reveal delay={200}>
              <blockquote className="h-full border border-white/10 p-8">
                <p className="font-quote text-xl italic leading-relaxed text-white">
                  &ldquo;The children who participate are learning more than
                  just basketball — they are learning teamwork, cooperation,
                  discipline, and self-worth.&rdquo;
                </p>
                <footer className="mt-4 font-body text-xs font-bold uppercase tracking-wide2 text-teal">
                  — Camille, Heads Up! volunteer &amp; teacher
                </footer>
              </blockquote>
            </Reveal>
          </div>
          <Reveal delay={250}>
            <div className="mt-12 flex justify-center">
              <Link
                href="/get-involved"
                className="bg-teal px-10 py-5 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
              >
                Join the Village
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
