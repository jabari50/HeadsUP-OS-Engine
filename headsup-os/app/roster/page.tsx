import Link from "next/link";
import { EngineError, listAthletes, type AthleteSummary } from "@/lib/engine";

export const dynamic = "force-dynamic";

const TIER_STYLES: Record<string, string> = {
  Elite: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  Impact: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  Contributor: "bg-sky-400/15 text-sky-300 border-sky-400/40",
  Developing: "bg-violet-400/15 text-violet-300 border-violet-400/40",
  Prospect: "bg-zinc-400/15 text-zinc-300 border-zinc-400/40",
};

async function loadRoster(): Promise<{ athletes: AthleteSummary[]; error: string | null }> {
  try {
    return { athletes: await listAthletes(), error: null };
  } catch (err) {
    return {
      athletes: [],
      error: err instanceof EngineError ? err.message : "Could not load the roster.",
    };
  }
}

export default async function RosterPage() {
  const { athletes, error } = await loadRoster();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            We Scout From The Neck Up.
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Onboarded Roster
          </h1>
        </div>
        <nav className="flex items-center gap-4 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">Command Center</Link>
          <Link href="/onboard" className="hover:text-white transition-colors">Onboard Athlete</Link>
        </nav>
      </header>

      <main className="px-8 py-10 max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!error && athletes.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <p className="text-sm text-zinc-400">No athletes onboarded yet.</p>
            <Link
              href="/onboard"
              className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              Onboard the First Athlete →
            </Link>
          </div>
        )}

        {athletes.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Athlete</th>
                  <th className="px-5 py-3 font-semibold">Pos</th>
                  <th className="px-5 py-3 font-semibold">School</th>
                  <th className="px-5 py-3 font-semibold">Class</th>
                  <th className="px-5 py-3 font-semibold text-right">OVR</th>
                  <th className="px-5 py-3 font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {athletes.map((a) => (
                  <tr key={a.player_id} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{a.name}</td>
                    <td className="px-5 py-3 text-zinc-400">{a.position}</td>
                    <td className="px-5 py-3 text-zinc-400">{a.school}</td>
                    <td className="px-5 py-3 text-zinc-400">{a.class_year}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-white">
                      {a.ovr}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TIER_STYLES[a.tier] ?? TIER_STYLES.Prospect}`}
                      >
                        {a.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
