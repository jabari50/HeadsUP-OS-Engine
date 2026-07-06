/* Athlete Surface home (Phase 1 placeholder). Phase 2 fills this with the
   exposure profile, own Neural Audit, OVR, career pathways, and quests —
   always the athlete's OWN row only, never operator valuations. */

export default function AthleteHomePage() {
  return (
    <section className="rounded-2xl border border-edge2 bg-panel px-6 py-10 text-center">
      <div className="font-display text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
        Free Agents · Athlete Surface
      </div>
      <h1 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-wide text-ink">
        Your <span className="text-hgreen">Profile</span> Is Coming Online
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
        Exposure profile, Neural Audit, OVR, career pathways, and your active
        quests land here in the next phase. Your data stays yours — operators
        only ever see what the Activation Lock releases.
      </p>
    </section>
  );
}
