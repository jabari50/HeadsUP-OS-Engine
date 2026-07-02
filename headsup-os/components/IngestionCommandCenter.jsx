// ============================================================================
// components/IngestionCommandCenter.jsx
// HU-OS v4.0.0 | System_Admin ingestion + VirtualGM activation surface
// ----------------------------------------------------------------------------
// Three panels:
//   1. STAGING    — pipeline batches, promotion trigger, manual-review queue
//   2. VGM POOL   — activation lock board (unlock gated on sovereign_verified)
//   3. RUN LOG    — every action echoed as an operator-style run summary
// All data flows through /api/* routes only — zero direct engine/DB calls.
// Modular + independently exportable per HeadsUP MEDIA directive.
// ============================================================================

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_COLORS = {
  pool: "#8892b0",
  shortlisted: "#64ffda",
  presented: "#ffd166",
  committed: "#00c896",
  placed: "#00c896",
  archived: "#4a5568",
};

const PLACEMENT_STATUSES = [
  "pool", "shortlisted", "presented", "committed", "placed", "archived",
];

export default function IngestionCommandCenter({ accessToken }) {
  const [pool, setPool] = useState([]);
  const [runLog, setRunLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [promoteResult, setPromoteResult] = useState(null);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken],
  );

  const log = useCallback((entry) => {
    setRunLog((prev) => [
      { ts: new Date().toISOString(), ...entry },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const loadPool = useCallback(async () => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/v1/virtualgm/pool${qs}`, { headers: authHeaders });
    const data = await res.json();
    if (res.ok) {
      setPool(data.pool ?? []);
      log({ action: "POOL_REFRESH", detail: `${data.pool?.length ?? 0} rows` });
    } else {
      log({ action: "POOL_REFRESH_FAILED", detail: data.error });
    }
  }, [authHeaders, statusFilter, log]);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  const runPromotion = async () => {
    setBusy(true);
    setPromoteResult(null);
    try {
      const res = await fetch("/api/v1/ingest/promote", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setPromoteResult(data);
      log({
        action: "PROMOTION_RUN",
        detail: `status=${data.status} promoted=${data.promoted ?? 0} ` +
          `manual_review=${data.manual_review?.length ?? 0} errors=${data.errors?.length ?? 0}`,
      });
      await loadPool();
    } catch (err) {
      log({ action: "PROMOTION_FAILED", detail: String(err) });
    } finally {
      setBusy(false);
    }
  };

  const patchPoolRow = async (poolId, patch, label) => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/virtualgm/pool", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ pool_id: poolId, ...patch }),
      });
      const data = await res.json();
      if (res.ok) {
        log({ action: label, detail: `pool_id=${poolId}` });
        await loadPool();
      } else {
        // UNLOCK_BLOCKED (409) surfaces the maturity-gate message verbatim
        log({ action: `${label}_BLOCKED`, detail: data.detail ?? data.error });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.shell}>
      <header style={S.header}>
        <div>
          <h1 style={S.h1}>Ingestion Command Center</h1>
          <p style={S.sub}>
            HU-OS v4.0.0 · ALGO v4.1.0 · Lane 3 activation surface
          </p>
        </div>
        <button style={S.primaryBtn} onClick={runPromotion} disabled={busy}>
          {busy ? "RUNNING…" : "PROMOTE STAGED RECORDS"}
        </button>
      </header>

      {promoteResult && (
        <section style={S.panel}>
          <h2 style={S.h2}>Promotion Run Summary</h2>
          <div style={S.summaryGrid}>
            <Stat label="Status" value={promoteResult.status} />
            <Stat label="Promoted" value={promoteResult.promoted ?? 0} />
            <Stat label="Manual Review" value={promoteResult.manual_review?.length ?? 0} />
            <Stat label="Errors" value={promoteResult.errors?.length ?? 0} />
          </div>
          {promoteResult.manual_review?.length > 0 && (
            <ul style={S.reviewList}>
              {promoteResult.manual_review.map((r, i) => (
                <li key={i} style={S.reviewItem}>
                  ⚠ {r.full_name} — {r.reason}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section style={S.panel}>
        <div style={S.panelHead}>
          <h2 style={S.h2}>VirtualGM Prospect Pool</h2>
          <select
            style={S.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {PLACEMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              {["Asset", "Class", "School", "Verified", "Lock", "Status", "Actions"]
                .map((h) => <th key={h} style={S.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {pool.map((row) => {
              const a = row.athletes ?? {};
              return (
                <tr key={row.id} style={S.tr}>
                  <td style={S.td}>
                    <strong>{a.full_name}</strong>
                    {a.market_position && (
                      <div style={S.tag}>{a.market_position}</div>
                    )}
                  </td>
                  <td style={S.td}>{a.graduation_year ?? "—"}</td>
                  <td style={S.td}>{a.school ?? "—"}</td>
                  <td style={S.td}>
                    {a.sovereign_verified ? "✅" : "⏳ audit pending"}
                  </td>
                  <td style={S.td}>
                    {row.activation_locked ? "🔒 LOCKED" : "🟢 LIVE"}
                  </td>
                  <td style={S.td}>
                    <span style={{ ...S.status, color: STATUS_COLORS[row.placement_status] }}>
                      {row.placement_status}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button
                      style={S.actionBtn}
                      disabled={busy}
                      onClick={() =>
                        patchPoolRow(
                          row.id,
                          { activation_locked: !row.activation_locked },
                          row.activation_locked ? "UNLOCK" : "LOCK",
                        )
                      }
                    >
                      {row.activation_locked ? "Unlock" : "Lock"}
                    </button>
                    <select
                      style={S.selectSm}
                      value={row.placement_status}
                      disabled={busy}
                      onChange={(e) =>
                        patchPoolRow(
                          row.id,
                          { placement_status: e.target.value },
                          "STATUS_CHANGE",
                        )
                      }
                    >
                      {PLACEMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {pool.length === 0 && (
              <tr>
                <td style={S.tdEmpty} colSpan={7}>
                  Pool empty — run promotion after staging a roster batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={S.panel}>
        <h2 style={S.h2}>Run Log</h2>
        <div style={S.logBox}>
          {runLog.map((e, i) => (
            <div key={i} style={S.logLine}>
              <span style={S.logTs}>{e.ts.slice(11, 19)}</span>
              <span style={S.logAction}>{e.action}</span>
              <span style={S.logDetail}>{e.detail}</span>
            </div>
          ))}
          {runLog.length === 0 && <div style={S.logLine}>Awaiting first action…</div>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

// HeadsUP brand system: navy base, teal accent
const S = {
  shell: { background: "#0a192f", minHeight: "100vh", padding: 24, color: "#ccd6f6", fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  h1: { margin: 0, fontSize: 22, letterSpacing: 0.5, color: "#e6f1ff" },
  h2: { margin: "0 0 12px", fontSize: 15, textTransform: "uppercase", letterSpacing: 1.5, color: "#64ffda" },
  sub: { margin: "4px 0 0", fontSize: 12, color: "#8892b0" },
  primaryBtn: { background: "#00c896", color: "#0a192f", border: "none", padding: "12px 20px", borderRadius: 6, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 },
  panel: { background: "#112240", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid #1d3557" },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  stat: { background: "#0a192f", borderRadius: 8, padding: 12, textAlign: "center" },
  statLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#8892b0" },
  statValue: { fontSize: 20, fontWeight: 700, color: "#64ffda", marginTop: 4 },
  reviewList: { margin: "12px 0 0", paddingLeft: 18 },
  reviewItem: { fontSize: 13, color: "#ffd166", marginBottom: 4 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 10px", color: "#8892b0", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #1d3557" },
  tr: { borderBottom: "1px solid #14283f" },
  td: { padding: "10px" },
  tdEmpty: { padding: "24px", textAlign: "center", color: "#8892b0" },
  tag: { fontSize: 10, color: "#64ffda", marginTop: 2 },
  status: { fontWeight: 600, textTransform: "capitalize" },
  actionBtn: { background: "transparent", color: "#64ffda", border: "1px solid #64ffda", padding: "4px 10px", borderRadius: 4, cursor: "pointer", marginRight: 8, fontSize: 12 },
  select: { background: "#0a192f", color: "#ccd6f6", border: "1px solid #1d3557", borderRadius: 4, padding: "6px 8px" },
  selectSm: { background: "#0a192f", color: "#ccd6f6", border: "1px solid #1d3557", borderRadius: 4, padding: "3px 6px", fontSize: 12 },
  logBox: { background: "#0a192f", borderRadius: 8, padding: 12, maxHeight: 220, overflowY: "auto", fontFamily: "monospace", fontSize: 12 },
  logLine: { display: "flex", gap: 12, padding: "3px 0", borderBottom: "1px solid #14283f" },
  logTs: { color: "#8892b0", flexShrink: 0 },
  logAction: { color: "#64ffda", flexShrink: 0, minWidth: 140 },
  logDetail: { color: "#ccd6f6", wordBreak: "break-word" },
};
