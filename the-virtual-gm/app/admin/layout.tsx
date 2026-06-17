import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!role) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-navy bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-display text-2xl font-bold uppercase text-white">
              HU-OS <span className="text-gold">Admin</span>
            </span>
            <nav className="flex gap-1">
              <Link href="/admin" className="rounded px-3 py-1.5 font-display text-sm uppercase tracking-wider text-slate-300 transition hover:bg-navy hover:text-teal">
                Review Queue
              </Link>
              <Link href="/dashboard" className="rounded px-3 py-1.5 font-display text-sm uppercase tracking-wider text-slate-300 transition hover:bg-navy hover:text-teal">
                Operator Hub
              </Link>
            </nav>
          </div>
          <span className="font-mono text-xs text-teal">SUPER ADMIN</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
