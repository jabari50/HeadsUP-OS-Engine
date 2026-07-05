"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet, apiPost } from "@/lib/huosEngine";

interface BoardAthlete {
  id: string;
  name: string;
  position: string | null;
  school: string | null;
  class_year: string | null;
  ovr: number | null;
  tier: string | null;
  sovereign_verified: boolean;
}

interface BoardEntry {
  id: string;
  rank: number | null;
  notes: string | null;
  athletes: BoardAthlete | null;
}

export default function DraftBoardClient({ readOnly }: { readOnly: boolean }) {
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [queue, setQueue] = useState<BoardAthlete[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ board: BoardEntry[]; queue: BoardAthlete[] }>("/draft-board");
      setBoard(data.board);
      setQueue(data.queue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addToBoard(athleteId: string) {
    await apiPost("/draft-board", { athlete_id: athleteId, rank: board.length + 1 });
    await load();
  }

  async function remove(athleteId: string) {
    await apiPost("/draft-board", { athlete_id: athleteId, action: "remove" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {error && <p className="text-sm text-red-400 lg:col-span-2">{error}</p>}

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">My Board</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">#</th><th className="th">Athlete</th>
              <th className="th">Pos</th><th className="th">OVR</th>
              {!readOnly && <th className="th" />}
            </tr>
          </thead>
          <tbody>
            {board.map((entry) => (
              <tr key={entry.id}>
                <td className="td">{entry.rank ?? "—"}</td>
                <td className="td">
                  <a className="text-courtside hover:underline" href={`/athletes/${entry.athletes?.id}`}>
                    {entry.athletes?.name}
                  </a>
                </td>
                <td className="td">{entry.athletes?.position ?? "—"}</td>
                <td className="td">{entry.athletes?.ovr ?? "—"}</td>
                {!readOnly && (
                  <td className="td">
                    <button className="text-xs text-red-400 hover:underline"
                      onClick={() => entry.athletes && remove(entry.athletes.id)}>
                      remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {board.length === 0 && (
              <tr><td className="td text-slate-500" colSpan={5}>Board is empty.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
          Prospect Queue
        </h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Athlete</th><th className="th">Pos</th>
              <th className="th">OVR</th><th className="th">Tier</th>
              {!readOnly && <th className="th" />}
            </tr>
          </thead>
          <tbody>
            {queue.map((athlete) => (
              <tr key={athlete.id}>
                <td className="td">
                  <a className="text-courtside hover:underline" href={`/athletes/${athlete.id}`}>
                    {athlete.name}
                  </a>
                  {athlete.sovereign_verified && <span className="ml-1 text-gold">✓</span>}
                </td>
                <td className="td">{athlete.position ?? "—"}</td>
                <td className="td">{athlete.ovr ?? "—"}</td>
                <td className="td">{athlete.tier ?? "Unscored"}</td>
                {!readOnly && (
                  <td className="td">
                    <button className="text-xs text-gold hover:underline"
                      onClick={() => addToBoard(athlete.id)}>
                      + board
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
