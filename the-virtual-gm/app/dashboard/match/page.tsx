import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { POSITIONS, type MatchRequest } from "@/lib/types";
import { closeMatchRequest, createMatchRequest } from "./actions";

// Height options: 5'0" (60) through 7'6" (90)
const HEIGHTS = Array.from({ length: 31 }, (_, i) => 60 + i);
const CLASS_YEARS = ["2026", "2027", "2028", "2029", "2030"];

function formatHeight(inches: number | null): string {
  if (inches === null) return "—";
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold/15 text-gold",
  matched: "bg-teal/15 text-teal",
  closed: "bg-navy text-slate-500",
};

export default async function MatchPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requestData } = await supabase
    .from("match_requests")
    .select("id, position, height_min, height_max, class_year, status, created_at")
    .order("created_at", { ascending: false });
  const requests = (requestData ?? []) as MatchRequest[];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase text-white">
          Player Matching
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Define a program need. The Matchmaking Engine scores verified HU-OS
          athletes against it.
        </p>
      </div>

      <section className="max-w-2xl rounded-lg border border-navy bg-card p-6">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-teal">
          New Match Request
        </h2>
        <form action={createMatchRequest} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-xs uppercase text-slate-400">
              Position *
            </span>
            <select
              name="position"
              required
              className="mt-1 w-full rounded border border-navy bg-ink px-3 py-2 font-mono text-sm text-white"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase text-slate-400">
              Class Year
            </span>
            <select
              name="class_year"
              className="mt-1 w-full rounded border border-navy bg-ink px-3 py-2 font-mono text-sm text-white"
            >
              <option value="">Any</option>
              {CLASS_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase text-slate-400">
              Height Min
            </span>
            <select
              name="height_min"
              className="mt-1 w-full rounded border border-navy bg-ink px-3 py-2 font-mono text-sm text-white"
            >
              <option value="">Any</option>
              {HEIGHTS.map((h) => (
                <option key={h} value={h}>
                  {formatHeight(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase text-slate-400">
              Height Max
            </span>
            <select
              name="height_max"
              className="mt-1 w-full rounded border border-navy bg-ink px-3 py-2 font-mono text-sm text-white"
            >
              <option value="">Any</option>
              {HEIGHTS.map((h) => (
                <option key={h} value={h}>
                  {formatHeight(h)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded bg-teal px-4 py-2.5 font-display text-base font-semibold uppercase tracking-wider text-ink transition hover:bg-gold sm:col-span-2"
          >
            Submit Match Request
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-teal">
          My Requests{" "}
          <span className="font-mono text-slate-500">({requests.length})</span>
        </h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No match requests yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-navy">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy/50 font-display uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-card">
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-navy/60">
                    <td className="px-4 py-3 font-mono text-white">
                      {req.position}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatHeight(req.height_min)} – {formatHeight(req.height_max)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {req.class_year ?? "Any"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-xs uppercase ${
                          STATUS_STYLE[req.status] ?? STATUS_STYLE.closed
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {req.status !== "closed" && (
                        <form action={closeMatchRequest}>
                          <input type="hidden" name="request_id" value={req.id} />
                          <button
                            type="submit"
                            className="font-mono text-xs text-slate-500 transition hover:text-gold"
                          >
                            Close
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
