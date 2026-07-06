"use client";

/* Operator License provisioning console (System_Admin only — the route
   re-checks). Calls /api/admin/operators exclusively; no direct Supabase
   or engine access from the browser (Gate 3). */

import { useCallback, useEffect, useState } from "react";

interface OperatorLicense {
  id: string;
  user_id: string | null;
  org_name: string | null;
  license_tier: string | null;
  seat_count: number | null;
  activation_credits: number;
  email: string;
}

const ROLES = ["College_Scout", "Coach", "NDA_Analyst"] as const;
const TIERS = ["Scout", "Coordinator", "GM", "White Label"] as const;

const INPUT =
  "w-full rounded-md border border-edge bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-hblue";
const LABEL = "block text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500";

export default function AdminOperatorsClient() {
  const [licenses, setLicenses] = useState<OperatorLicense[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({
    email: "",
    org_name: "",
    role: "Coach" as (typeof ROLES)[number],
    license_tier: "GM" as (typeof TIERS)[number],
    seat_count: 1,
    activation_credits: 10,
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoadError("");
    const res = await fetch("/api/admin/operators");
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLoadError(body?.error ?? "Could not load licenses");
      setLicenses([]);
      return;
    }
    const body = await res.json();
    setLicenses(body.operators ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function provision(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => null);
    if (res.ok) {
      setNotice({
        kind: "ok",
        text: `${form.org_name} provisioned — ${form.email} can now sign in with a magic link.`,
      });
      setForm((f) => ({ ...f, email: "", org_name: "" }));
      void load();
    } else {
      setNotice({ kind: "err", text: body?.error ?? "Provisioning failed" });
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="panel">
        <div className="sec-label">Provision Operator License</div>
        <form onSubmit={provision} className="space-y-3">
          <div>
            <label className={LABEL} htmlFor="op-email">Login Email</label>
            <input
              id="op-email"
              type="email"
              required
              maxLength={254}
              className={INPUT}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="coach@program.edu"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="op-org">Organization / Program</label>
            <input
              id="op-org"
              required
              maxLength={120}
              className={INPUT}
              value={form.org_name}
              onChange={(e) => setForm({ ...form, org_name: e.target.value })}
              placeholder="e.g. Davis — Program Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="op-role">RBAC Role</label>
              <select
                id="op-role"
                className={INPUT}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as (typeof ROLES)[number] })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="op-tier">License Tier</label>
              <select
                id="op-tier"
                className={INPUT}
                value={form.license_tier}
                onChange={(e) =>
                  setForm({ ...form, license_tier: e.target.value as (typeof TIERS)[number] })
                }
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="op-seats">Seats</label>
              <input
                id="op-seats"
                type="number"
                min={1}
                max={100}
                className={INPUT}
                value={form.seat_count}
                onChange={(e) => setForm({ ...form, seat_count: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="op-credits">Activation Credits</label>
              <input
                id="op-credits"
                type="number"
                min={0}
                max={1000}
                className={INPUT}
                value={form.activation_credits}
                onChange={(e) => setForm({ ...form, activation_credits: Number(e.target.value) })}
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn w-full disabled:opacity-50">
            {busy ? "Provisioning…" : "Provision License"}
          </button>
          {notice && (
            <p className={`text-xs ${notice.kind === "ok" ? "text-hgreen" : "text-horange"}`}>
              {notice.text}
            </p>
          )}
        </form>
      </section>

      <section className="panel">
        <div className="sec-label">Active Licenses</div>
        {licenses === null ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : loadError ? (
          <p className="text-xs text-horange">{loadError}</p>
        ) : licenses.length === 0 ? (
          <p className="text-sm text-slate-400">
            No operator licenses yet — provision the pilot operators here.
          </p>
        ) : (
          <ul className="space-y-3">
            {licenses.map((op) => (
              <li key={op.id} className="rounded-lg border border-edge px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-bold uppercase tracking-[1px] text-ink">
                    {op.org_name ?? "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-[1px] text-hblue">
                    {op.license_tier ?? "unlicensed"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {op.email || "no login linked"} · {op.seat_count ?? 1} seat
                  {(op.seat_count ?? 1) === 1 ? "" : "s"} · {op.activation_credits} credits
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
