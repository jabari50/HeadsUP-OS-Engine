import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import IntakeForm from "@/components/IntakeForm";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Volunteer, mentor, or partner with The Heads Up! Foundation in Dallas–Fort Worth.",
};

export default function GetInvolvedPage() {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
            Get Involved
          </p>
          <h1 className="mt-4 max-w-3xl font-headline text-6xl leading-none tracking-headline text-white lg:text-7xl">
            THE VILLAGE NEEDS HANDS.
          </h1>
          <span className="rule-teal mt-6" />
          <p className="mt-6 max-w-2xl font-body text-sm leading-relaxed text-warmgray">
            Every camp, masterclass, and mentoring session runs on dedicated
            volunteers — trained local professionals who give their time. Pick
            your lane below.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-3 lg:gap-8 lg:px-8">
          <Reveal>
            <div className="border-t-4 border-teal pt-6">
              <h2 className="font-headline text-4xl tracking-headline text-white">
                VOLUNTEER
              </h2>
              <p className="mb-8 mt-3 font-body text-sm leading-relaxed text-warmgray">
                Camp staff, event support, operations. No coaching résumé
                required — just consistency.
              </p>
              <IntakeForm
                segment="volunteer"
                submitLabel="Apply to Volunteer"
                fields={[
                  { name: "name", label: "Full Name", required: true },
                  { name: "email", label: "Email", type: "email", required: true },
                  { name: "phone", label: "Phone", type: "tel" },
                  {
                    name: "availability",
                    label: "Availability / how you'd like to help",
                    type: "textarea",
                  },
                ]}
              />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="border-t-4 border-white/30 pt-6">
              <h2 className="font-headline text-4xl tracking-headline text-white">
                MENTOR
              </h2>
              <p className="mb-8 mt-3 font-body text-sm leading-relaxed text-warmgray">
                Work directly with student-athletes in our mentoring and
                mindset programs. Background check required.
              </p>
              <IntakeForm
                segment="mentor"
                submitLabel="Apply to Mentor"
                fields={[
                  { name: "name", label: "Full Name", required: true },
                  { name: "email", label: "Email", type: "email", required: true },
                  { name: "phone", label: "Phone", type: "tel" },
                  {
                    name: "background",
                    label: "Professional background / mentoring experience",
                    type: "textarea",
                  },
                ]}
              />
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="border-t-4 border-gold pt-6">
              <h2 className="font-headline text-4xl tracking-headline text-white">
                SPONSOR / PARTNER
              </h2>
              <p className="mb-8 mt-3 font-body text-sm leading-relaxed text-warmgray">
                Sponsor a student through the 3M Masterclass, back an event, or
                bring your organization into the coalition.
              </p>
              <IntakeForm
                segment="sponsor"
                submitLabel="Partner With Us"
                fields={[
                  { name: "name", label: "Contact Name", required: true },
                  { name: "organization", label: "Organization" },
                  { name: "email", label: "Email", type: "email", required: true },
                  {
                    name: "interest",
                    label: "What kind of partnership are you exploring?",
                    type: "textarea",
                  },
                ]}
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
