import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to PRO-File OS.",
};

export default function LoginPage() {
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:px-8">
      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-teal">
          PRO-File OS
        </p>
        <h1 className="mt-4 font-headline text-6xl leading-none tracking-headline text-white">
          LOG IN.
        </h1>
        <span className="rule-teal mt-6" />
        <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-warmgray">
          The platform that measures what matters. Athletes, families, coaches,
          and mentors — pick up where you left off.
        </p>
      </div>
      <div className="flex items-start lg:justify-end">
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
