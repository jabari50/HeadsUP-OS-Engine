import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "PRO-File OS",
  description:
    "PRO-File OS — the platform that measures what matters. Unified athlete development from the HeadsUP network.",
};

/* Placeholder product visual per brand conventions: OVR badge + neural bars.
   Illustrative only — real product screenshots replace this. No invented metrics. */
function ProductPreview() {
  const bars = [72, 85, 64, 91, 78];
  return (
    <div className="border border-white/10 bg-navy-deep p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
            Athlete Profile — illustrative preview
          </p>
          <p className="mt-2 font-headline text-3xl tracking-headline text-white">
            SAMPLE ATHLETE
          </p>
        </div>
        {/* OVR badge: circular, navy fill, teal stroke, Oswald number */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-teal bg-navy">
          <span className="font-stat text-3xl font-bold text-teal">—</span>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        {bars.map((w, i) => (
          <div key={i}>
            <div className="mb-1 flex justify-between font-body text-[10px] uppercase tracking-wide2 text-warmgray">
              <span>Attribute {i + 1}</span>
              <span className="font-stat text-teal">·</span>
            </div>
            <div className="h-2 w-full bg-white/10">
              <div className="h-2 bg-teal" style={{ width: `${w}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 font-body text-[10px] uppercase tracking-wide2 text-warmgray">
        Preview graphic — not live product data
      </p>
    </div>
  );
}

export default function ProFileOSPage() {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[7fr_5fr] lg:px-8">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-teal">
              PRO-File OS
            </p>
            <h1 className="mt-4 font-headline text-6xl leading-none tracking-headline text-white lg:text-7xl">
              THE PLATFORM THAT MEASURES WHAT MATTERS.
            </h1>
            <span className="rule-teal mt-6" />
            <p className="mt-6 max-w-xl font-body text-sm leading-relaxed text-white/80">
              PRO-File OS is the HeadsUP network&rsquo;s unified athlete
              development platform — one place where an athlete&rsquo;s growth
              is tracked, understood, and put to work. Built for athletes,
              families, and coaches.
            </p>
            <div className="mt-4 max-w-xl">
              <NeedsInput label="launch status (live/beta/coming soon) + confirmed feature list — no feature claims published until confirmed" />
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="bg-teal px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="border border-white/30 px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-white transition-colors hover:border-teal hover:text-teal"
              >
                Log In
              </Link>
            </div>
          </div>
          <Reveal delay={150} className="flex items-center">
            <ProductPreview />
          </Reveal>
        </div>
      </section>

      {/* Who it's for */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                who: "ATHLETES",
                body: "Your development, tracked in one place — and locked to outside eyes until your family says otherwise.",
              },
              {
                who: "FAMILIES",
                body: "Linked parent/guardian accounts with visibility into a minor athlete's profile, and control over who else can see it.",
              },
              {
                who: "COACHES",
                body: "Roster-level views of your own athletes — verified inputs, no noise, nothing outside your program.",
              },
            ].map((c, i) => (
              <Reveal key={c.who} delay={i * 100}>
                <div className="h-full border-t-4 border-teal bg-navy-deep p-8">
                  <p className="font-headline text-3xl tracking-headline text-white">
                    {c.who}
                  </p>
                  <p className="mt-3 font-body text-sm leading-relaxed text-warmgray">
                    {c.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-8 font-body text-xs text-warmgray">
              Privacy-first by design: minor athletes&rsquo; profiles are locked
              to outside viewers by default — a parent or guardian must
              explicitly unlock visibility.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
