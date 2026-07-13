import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support free basketball and life-skills programming for Dallas–Fort Worth youth. No government funds — community powered since 2003.",
};

const TIERS = [
  {
    amount: "$15",
    label: "The Average Gift",
    body: "Our average donation. Small gifts, given by many, are how this Foundation has always run.",
  },
  {
    amount: "$50",
    label: "Gear & Gym Time",
    body: "Helps cover equipment and facility costs that keep sessions free for families.",
  },
  {
    amount: "$250",
    label: "Sponsor a Student",
    body: "Puts a student-athlete through Foundation programming they otherwise couldn't afford.",
    gold: true,
  },
  {
    amount: "$1,000+",
    label: "Program Partner",
    body: "Underwrites camps, masterclasses, and outreach at the program level.",
  },
];

export default function DonatePage() {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[7fr_5fr] lg:px-8">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
              Donate
            </p>
            <h1 className="mt-4 font-headline text-6xl leading-none tracking-headline text-white lg:text-7xl">
              WE TAKE NO GOVERNMENT FUNDS.
            </h1>
            <span className="rule-teal mt-6" />
            <p className="mt-6 max-w-xl font-body text-sm leading-relaxed text-white/80">
              We&rsquo;re a small nonprofit running one of the top youth
              development programs in Dallas–Fort Worth — on a shoe-string
              budget, powered entirely by the generosity of people like you.
              Imagine if everyone reading this gave $5: our fundraising would be
              done within the hour, and we could get back to what matters —
              impacting and inspiring young lives.
            </p>
          </div>
          <Reveal delay={120} className="flex items-center">
            <div className="w-full border-l-4 border-teal bg-navy-deep p-8">
              <p className="font-stat text-7xl font-bold text-teal">$15</p>
              <p className="mt-2 font-body text-xs uppercase tracking-wide2 text-warmgray">
                Average donation — every dollar works
              </p>
              <p className="mt-6 font-quote text-xl italic text-white">
                &ldquo;Teamwork makes the dream work.&rdquo;
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t, i) => (
              <Reveal key={t.amount} delay={i * 80}>
                <div
                  className={`flex h-full flex-col border p-8 ${
                    t.gold
                      ? "border-gold bg-navy-deep"
                      : "border-white/10 hover:border-teal"
                  } transition-colors`}
                >
                  <p
                    className={`font-stat text-5xl font-bold ${
                      t.gold ? "text-gold" : "text-teal"
                    }`}
                  >
                    {t.amount}
                  </p>
                  <p className="mt-3 font-headline text-2xl tracking-headline text-white">
                    {t.label}
                  </p>
                  <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-warmgray">
                    {t.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="mt-12 border border-dashed border-gold/60 bg-gold/5 p-8">
              <p className="font-headline text-2xl tracking-headline text-gold">
                PAYMENT PROCESSOR PENDING
              </p>
              <p className="mt-2 font-body text-sm text-white/80">
                <NeedsInput label="donation processor (Stripe / Givebutter / etc.) — button wiring blocked until account confirmed" />
              </p>
              <p className="mt-4 font-body text-xs text-warmgray">
                <NeedsInput label="501(c)(3) EIN + official tax-deductibility language from actual filing" />
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
