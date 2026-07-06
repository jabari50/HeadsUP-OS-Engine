/* Admin review layer home (Phase 1 placeholder). Gate-8 quarantined content
   (open responses, quest details, raw NER anchors, deficiency flags) surfaces
   here and only here in later phases. */

import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="rounded-2xl border border-edge2 bg-panel px-6 py-10 text-center">
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-ink">
        System <span className="text-hblue">Admin</span>
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
        Founder review layer. Open-response review, quest oversight, and raw
        NER anchors will live here — content that never crosses into the
        operator surface.
      </p>
      <div className="mt-6 flex justify-center gap-3 text-xs">
        <Link href="/dashboard" className="rounded-md border border-edge px-3 py-1.5 font-display font-bold uppercase tracking-[1.5px] text-slate-400 hover:text-ink">
          Operator Surface
        </Link>
        <Link href="/me" className="rounded-md border border-edge px-3 py-1.5 font-display font-bold uppercase tracking-[1.5px] text-slate-400 hover:text-ink">
          Athlete Surface
        </Link>
      </div>
    </section>
  );
}
