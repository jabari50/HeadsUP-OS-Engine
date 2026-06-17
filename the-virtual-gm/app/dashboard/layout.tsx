import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Real operator platform (live, auth-gated Supabase data).
const OPERATOR_NAV = [
  { href: "/dashboard", label: "Roster" },
  { href: "/dashboard/match", label: "Match" },
  { href: "/dashboard/license", label: "License" },
];

// Front-office workspace (the rich GM experience).
const FRONT_OFFICE_NAV = [
  { href: "/gm", label: "Front Office" },
  { href: "/gm/draft", label: "Draft Board" },
  { href: "/gm/rib", label: "RIB" },
  { href: "/wizard", label: "Coach DNA" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <header className="border-b border-navy bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold uppercase text-white">
                The Virtual <span className="text-gold">GM</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              {OPERATOR_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-3 py-1.5 font-display text-sm uppercase tracking-wider text-slate-300 transition hover:bg-navy hover:text-teal"
                >
                  {item.label}
                </Link>
              ))}
              <span className="mx-1 h-5 w-px bg-navy" aria-hidden />
              {FRONT_OFFICE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-3 py-1.5 font-display text-sm uppercase tracking-wider text-slate-300 transition hover:bg-navy hover:text-teal"
                >
                  {item.label}
                </Link>
              ))}
              {adminRole && (
                <Link
                  href="/admin"
                  className="rounded px-3 py-1.5 font-display text-sm uppercase tracking-wider text-gold transition hover:bg-navy"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-slate-500 sm:block">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded border border-navy px-3 py-1.5 font-display text-sm uppercase tracking-wider text-slate-400 transition hover:border-gold hover:text-gold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
