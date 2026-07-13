import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import IntakeForm from "@/components/IntakeForm";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach The Heads Up! Foundation — program enrollment, media requests, partnerships.",
};

export default function ContactPage() {
  return (
    <section>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:px-8">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
            Contact
          </p>
          <h1 className="mt-4 font-headline text-6xl leading-none tracking-headline text-white">
            DIRECT LINE.
          </h1>
          <span className="rule-teal mt-6" />
          <p className="mt-6 max-w-md font-body text-sm leading-relaxed text-warmgray">
            Program enrollment, youth referrals, media requests, partnerships —
            it all starts here, and it goes straight to the Foundation.
          </p>
          <div className="mt-8 space-y-3 font-body text-sm text-white/80">
            <p>
              <span className="font-bold uppercase tracking-wide2 text-teal">
                Email:&nbsp;
              </span>
              <NeedsInput label="official Foundation contact email" />
            </p>
            <p>
              <span className="font-bold uppercase tracking-wide2 text-teal">
                Social:&nbsp;
              </span>
              <NeedsInput label="confirmed handles" />
            </p>
          </div>
        </div>

        <Reveal delay={120}>
          <IntakeForm
            segment="contact"
            submitLabel="Send Message"
            fields={[
              { name: "name", label: "Full Name", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              { name: "phone", label: "Phone", type: "tel" },
              { name: "subject", label: "Subject", required: true },
              { name: "message", label: "Message", type: "textarea", required: true },
            ]}
          />
        </Reveal>
      </div>
    </section>
  );
}
