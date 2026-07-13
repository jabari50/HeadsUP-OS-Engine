import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import NeedsInput from "@/components/NeedsInput";

export const metadata: Metadata = {
  title: "Dashboard",
};

const ROLE_LABELS: Record<string, string> = {
  athlete: "Athlete",
  parent: "Parent / Guardian",
  coach: "Coach",
  mentor: "Mentor",
  admin: "Admin / Staff",
};

/* Role-scoped shell only — deep PRO-File OS functionality (GCOS scoring,
   badge engine, quests) is separate product scope, linked/embedded later. */
const ROLE_PANELS: Record<string, { title: string; body: string }[]> = {
  athlete: [
    { title: "MY PROFILE", body: "View your profile and verified scores. Edits to performance data come from your coaches — that's what keeps ratings credible." },
    { title: "MY PROGRAMS", body: "Programs you're enrolled in." },
    { title: "VISIBILITY", body: "Your profile is locked to outside viewers. A parent/guardian controls unlock." },
  ],
  parent: [
    { title: "LINKED ATHLETE", body: "View your athlete's profile, scores, and enrollment." },
    { title: "CONSENT & VISIBILITY", body: "You control whether outside recruiters can view your athlete's profile. Locked by default." },
    { title: "ENROLLMENT", body: "Manage program enrollment for your athlete." },
  ],
  coach: [
    { title: "MY ROSTER", body: "Your assigned athletes — roster only, not the full database." },
    { title: "SCORE INPUT", body: "Enter and verify performance data for your roster." },
  ],
  mentor: [
    { title: "MY MENTEES", body: "Athletes assigned to your mentoring group." },
  ],
  admin: [
    { title: "ALL ATHLETES", body: "Full database access." },
    { title: "USER MANAGEMENT", body: "Roles, links, and visibility overrides." },
    { title: "PROGRAMS", body: "Manage enrollment across programs." },
  ],
};

export default async function DashboardPage() {
  if (!supabaseConfigured()) {
    return (
      <Shell
        name="Design Review"
        role="athlete"
        note="Supabase not configured — showing the Athlete shell for design review."
      />
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "athlete";
  const name = profile?.full_name || user.email || "Member";

  return <Shell name={name} role={role} />;
}

function Shell({
  name,
  role,
  note,
}: {
  name: string;
  role: string;
  note?: string;
}) {
  const panels = ROLE_PANELS[role] ?? ROLE_PANELS.athlete;
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-10">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide2 text-teal">
            PRO-File OS &middot; {ROLE_LABELS[role] ?? role}
          </p>
          <h1 className="mt-3 font-headline text-5xl tracking-headline text-white">
            {name.toUpperCase()}
          </h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className="border border-white/30 px-6 py-3 font-body text-xs font-bold uppercase tracking-wide2 text-white transition-colors hover:border-teal hover:text-teal">
            Sign Out
          </button>
        </form>
      </div>

      {note && <div className="needs-input mt-8">{note}</div>}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {panels.map((p) => (
          <div
            key={p.title}
            className="border border-white/10 bg-navy-deep p-8"
          >
            <p className="font-headline text-2xl tracking-headline text-white">
              {p.title}
            </p>
            <span className="rule-teal my-4 !w-10" />
            <p className="font-body text-sm leading-relaxed text-warmgray">
              {p.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <NeedsInput label="per-role dashboard content beyond this shell — deep PRO-File OS functionality (GCOS, badges, quests) is separate product scope" />
      </div>
    </section>
  );
}
