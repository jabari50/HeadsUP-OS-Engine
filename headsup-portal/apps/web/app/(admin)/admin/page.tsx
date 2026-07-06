/* Admin review layer — operator license provisioning (REV-A G-C: manual
   at pilot stage) plus surface jump links. Layout gates System_Admin;
   this page and the API route re-check (defense in depth). */

import Link from "next/link";
import { redirect } from "next/navigation";

import AdminOperatorsClient from "@/components/AdminOperatorsClient";
import { getAuth } from "@/lib/auth";
import { homeForRole, roleMayEnter } from "@/lib/surfaces";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (!roleMayEnter(auth.role, "admin")) redirect(homeForRole(auth.role));

  return (
    <div>
      <div className="sec-label">Founding Operator Pilot</div>
      <AdminOperatorsClient />

      <div className="mt-6 flex gap-3 text-xs">
        <Link
          href="/dashboard"
          className="rounded-md border border-edge px-3 py-1.5 font-display font-bold uppercase tracking-[1.5px] text-slate-400 hover:text-ink"
        >
          Operator Surface
        </Link>
        <Link
          href="/me"
          className="rounded-md border border-edge px-3 py-1.5 font-display font-bold uppercase tracking-[1.5px] text-slate-400 hover:text-ink"
        >
          Athlete Surface
        </Link>
      </div>
    </div>
  );
}
