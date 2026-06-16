"use client";

/* Live alumni comps — real DFW alumni/outcomes from the Supabase pool
   (neck_down_metrics holds college / pro org / career level). Used by the
   Comp Players feature: "athletes like this went here." No fabricated
   similarity — comps are matched by position and ranked by outcome level. */

import React from "react";
import { createClient } from "@/lib/supabase/client";

export interface AlumniComp {
  id: string;
  name: string;
  pos: string;
  classYear: string;
  school: string;
  college: string | null;
  org: string | null;
  level: string | null;
}

const LEVEL_RANK: Record<string, number> = {
  NBA: 5,
  "G-League": 4,
  Overseas: 3,
  "D1": 2,
  College: 2,
  JUCO: 1,
};

// Coarse position bucket so a SG prospect sees guard alumni, etc.
function bucket(pos: string | null | undefined): "G" | "W" | "B" | "?" {
  const p = (pos ?? "").toUpperCase();
  if (/PG|SG|CG|^G/.test(p)) return "G";
  if (/SF|PF|^F|WING/.test(p)) return "W";
  if (/C|BIG/.test(p)) return "B";
  return "?";
}

function mapAlumni(r: Record<string, unknown>): AlumniComp {
  const m = (r.neck_down_metrics ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id),
    name: (r.full_name as string) ?? "Alum",
    pos: (r.position as string) ?? "—",
    classYear: r.graduation_year ? String(r.graduation_year) : "",
    school: (r.school as string) ?? "",
    college: (m.college as string) ?? null,
    org: (m.current_org as string) ?? null,
    level: (m.career_level as string) ?? null,
  };
}

export function useAlumniComps(position?: string, limit = 6) {
  const [comps, setComps] = React.useState<AlumniComp[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    createClient()
      .from("athletes")
      .select("id, full_name, position, graduation_year, school, neck_down_metrics")
      .eq("sovereign_verified", true)
      .not("neck_down_metrics", "is", null)
      .then(({ data }) => {
        if (!active) return;
        const all = (data ?? [])
          .map((r) => mapAlumni(r as Record<string, unknown>))
          .filter((a) => a.level || a.college || a.org);

        const want = bucket(position);
        const matched =
          want === "?" ? all : all.filter((a) => bucket(a.pos) === want);
        const pool = matched.length >= 3 ? matched : all;

        pool.sort(
          (a, b) =>
            (LEVEL_RANK[b.level ?? ""] ?? 0) - (LEVEL_RANK[a.level ?? ""] ?? 0)
        );
        setComps(pool.slice(0, limit));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [position, limit]);

  return { comps, loading };
}
