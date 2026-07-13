import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "Media / HoopCityUSA",
  description:
    "HoopCityUSA — the docuseries. Inside DFW Basketball coverage and The SportsInfluencer broadcast from the HeadsUP MEDIA network.",
};

export default function MediaPage() {
  return (
    <>
      {/* HoopCityUSA — narrative-first voice per brand system */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
            Media &middot; HeadsUP MEDIA network
          </p>
          <h1 className="mt-4 font-headline text-7xl leading-none tracking-headline text-white lg:text-8xl">
            HOOPCITYUSA
          </h1>
          <p className="mt-6 max-w-xl font-quote text-2xl italic text-teal">
            This is DFW. This is where legends are made.
          </p>
          <span className="rule-teal mt-6" />
          <div className="mt-8 max-w-xl">
            <NeedsInput label="docuseries teaser embed / trailer link + launch status" />
          </div>
        </div>
      </section>

      {/* Inside DFW Basketball + SportsInfluencer */}
      <section>
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-16 lg:grid-cols-[7fr_5fr] lg:px-8">
          <Reveal>
            <article className="h-full border border-white/10 bg-navy-deep p-8 lg:p-10">
              <p className="font-stat text-sm font-bold uppercase text-teal">
                Coverage
              </p>
              <h2 className="mt-3 font-headline text-4xl tracking-headline text-white">
                INSIDE DFW BASKETBALL
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-warmgray">
                Playoff pairings, players to watch, and recruiting coverage of
                the Metroplex high school scene — the blog that&rsquo;s tracked
                DFW hoops since 2017, from district races to the UIL regional
                tournaments.
              </p>
              <div className="mt-6">
                <NeedsInput label="new home for Inside DFW Basketball archive — migrate or link to old blog?" />
              </div>
            </article>
          </Reveal>
          <Reveal delay={120}>
            <article className="h-full border border-white/10 p-8 lg:p-10">
              <p className="font-stat text-sm font-bold uppercase text-teal">
                Broadcast
              </p>
              <h2 className="mt-3 font-headline text-4xl tracking-headline text-white">
                THE SPORTSINFLUENCER
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-warmgray">
                Founder Jabari Johnson&rsquo;s annual 5,000+ mile expedition
                through North Texas sports and philanthropic communities —
                exclusive access to events, athletes, coaches, and community
                leaders. The platform has reached over one million viewers
                worldwide.
              </p>
              <p className="mt-6 font-body text-xs font-bold uppercase tracking-wide2 text-teal">
                Be influenced.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream text-navy">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-headline text-4xl tracking-headline">
              FOLLOW THE NETWORK
            </p>
            <span className="rule-teal mt-4" />
          </div>
          <div className="font-body text-sm text-navy/70">
            <NeedsInput label="confirmed current social handles + embed feeds" />
          </div>
        </div>
      </section>
    </>
  );
}
