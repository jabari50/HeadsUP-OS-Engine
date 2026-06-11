import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateOperator } from "@/lib/operator";
import {
  ACTIVATION_LABELS,
  ACTIVATION_STATUSES,
  type Athlete,
  type RosterEntry,
} from "@/lib/types";
import { addToRoster, removeFromRoster, setActivation } from "./actions";

const ATHLETE_COLS =
  "id, full_name, position, graduation_year, school, ovr, market_position";

export default async function RosterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const operator = await getOrCreateOperator(supabase, user);

  const { data: rosterData } = await supabase
    .from("rosters")
    .select(`id, activation_status, added_at, athletes (${ATHLETE_COLS})`)
    .order("added_at", { ascending: false });
  const roster = (rosterData ?? []) as unknown as RosterEntry[];

  const rosteredIds = new Set(
    roster.map((r) => r.athletes?.id).filter(Boolean)
  );

  // RLS limits this to sovereign_verified athletes, and only for active licenses.
  const { data: poolData } = await supabase
    .from("athletes")
    .select(ATHLETE_COLS)
    .order("ovr", { ascending: false, nullsFirst: false })
    .limit(50);
  const pool = ((poolData ?? []) as unknown as Athlete[]).filter(
    (a) => !rosteredIds.has(a.id)
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase text-white">
          Roster
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your activated athletes and the verified HU-OS pool.
        </p>
      </div>

      {operator && !operator.active && (
        <div className="rounded border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          Your operator license is inactive — the athlete pool is hidden until
          billing is active.{" "}
          <Link href="/dashboard/license" className="underline">
            Manage license
          </Link>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-teal">
          My Roster <span className="font-mono text-slate-500">({roster.length})</span>
        </h2>
        {roster.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No athletes on your roster yet. Add from the pool below.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-navy">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy/50 font-display uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">OVR</th>
                  <th className="px-4 py-3">Activation</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-card">
                {roster.map((entry) => (
                  <tr key={entry.id} className="border-t border-navy/60">
                    <td className="px-4 py-3 text-white">
                      {entry.athletes?.full_name ?? "[Unverified]"}
                      <div className="font-mono text-xs text-slate-500">
                        {entry.athletes?.school ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {entry.athletes?.position ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {entry.athletes?.graduation_year ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gold">
                      {entry.athletes?.ovr ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <form action={setActivation} className="flex items-center gap-2">
                        <input type="hidden" name="roster_id" value={entry.id} />
                        <select
                          name="status"
                          defaultValue={entry.activation_status}
                          className="rounded border border-navy bg-ink px-2 py-1 font-mono text-xs text-white"
                        >
                          {ACTIVATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {ACTIVATION_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded bg-teal/20 px-2 py-1 font-mono text-xs text-teal transition hover:bg-teal hover:text-ink"
                        >
                          Set
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={removeFromRoster}>
                        <input type="hidden" name="roster_id" value={entry.id} />
                        <button
                          type="submit"
                          className="font-mono text-xs text-slate-500 transition hover:text-gold"
                        >
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-teal">
          Verified Athlete Pool{" "}
          <span className="font-mono text-slate-500">({pool.length})</span>
        </h2>
        {pool.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No verified athletes available
            {operator && !operator.active ? " — license inactive." : "."}
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pool.map((athlete) => (
              <div
                key={athlete.id}
                className="rounded-lg border border-navy bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {athlete.full_name ?? "[Unverified]"}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                      {athlete.position ?? "—"} · {athlete.school ?? "—"} ·{" "}
                      {athlete.graduation_year ?? "—"}
                    </p>
                  </div>
                  <span className="font-mono text-lg font-bold text-gold">
                    {athlete.ovr ?? "—"}
                  </span>
                </div>
                <form action={addToRoster} className="mt-3">
                  <input type="hidden" name="athlete_id" value={athlete.id} />
                  <button
                    type="submit"
                    className="w-full rounded border border-teal/40 px-3 py-1.5 font-display text-sm uppercase tracking-wider text-teal transition hover:bg-teal hover:text-ink"
                  >
                    Add to Roster
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
