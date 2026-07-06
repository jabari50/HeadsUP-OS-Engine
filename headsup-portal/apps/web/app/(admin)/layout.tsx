/* Admin Surface (System_Admin review layer) — Jabari-only. Middleware routes
   by role first; this check is defense in depth. System_Admin also retains
   access to the athlete and operator surfaces. */

import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";
import { homeForRole, roleMayEnter } from "@/lib/surfaces";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (!roleMayEnter(auth.role, "admin")) redirect(homeForRole(auth.role));

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-20 pt-6">
      <header className="mb-4 overflow-hidden rounded-2xl border border-edge2 bg-panel">
        <div className="stripe" />
        <div className="px-6 pb-4 pt-5">
          <div className="font-display text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
            HeadsUp OS · System Administration
          </div>
          <div className="mt-1 font-display text-3xl font-extrabold uppercase leading-none tracking-wide text-ink">
            Review <span className="text-hblue">Layer</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">{auth.user.email} · System_Admin</div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
