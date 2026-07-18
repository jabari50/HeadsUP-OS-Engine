'use client';

/**
 * NilScanner
 * SOVEREIGN NIL Contract Risk Scanner — Phase 3 UI
 *
 * Self-contained component: PDF upload → POST /api/sovereign/nil-scan
 * → structured risk report rendered in-page.
 *
 * Hard constraints enforced in UI:
 *   • Disclaimer always visible above the fold on results
 *   • Never surfaces "sign" or "reject" language
 *   • Tier 2 badge always shown — escalation to Jabari is explicit
 *   • ZHR: only renders fields actually returned by the engine
 */

import React, { useCallback, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type RiskLevel      = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';
type Severity       = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface RiskFlag {
  clause:         string;
  issue:          string;
  severity:       Severity;
  recommendation: string;
}

interface NilScanResult {
  risk_score:           number;
  risk_level:           RiskLevel;
  confidence_band:      ConfidenceBand;
  risk_flags:           RiskFlag[];
  nil_market_context:   string;
  ncaa_compliance_notes:string;
  sovereign_advisory:   string;
  missing_protections:  string[];
  tier:                 2;
  disclaimer:           string;
  athlete_id:           string;
  contract_name:        string;
  page_count:           number;
  audit_id:             string | null;
  escalation_id:        string | null;
  scanned_at:           string;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel | Severity, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#16a34a',
};

const RISK_BG: Record<RiskLevel | Severity, string> = {
  CRITICAL: '#ef444422',
  HIGH:     '#f9731622',
  MEDIUM:   '#f59e0b22',
  LOW:      '#16a34a22',
};

const BAND_COLOR: Record<ConfidenceBand, string> = {
  HIGH:   '#34d399',
  MEDIUM: '#f59e0b',
  LOW:    '#f87171',
};

// ── Inline styles ─────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight:  '100vh',
    background: '#0a0a0a',
    color:      '#f8fafc',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding:    '2rem',
    maxWidth:   '860px',
    margin:     '0 auto',
  } as React.CSSProperties,

  header: {
    marginBottom: '2rem',
    borderBottom: '1px solid #1f2937',
    paddingBottom:'1.5rem',
  } as React.CSSProperties,

  title: {
    fontSize:      '1.75rem',
    fontWeight:    900,
    letterSpacing: '-0.03em',
    margin:        0,
  } as React.CSSProperties,

  subtitle: {
    color:     '#64748b',
    fontSize:  '0.875rem',
    marginTop: '0.35rem',
  } as React.CSSProperties,

  card: {
    background:   '#111827',
    border:       '1px solid #1f2937',
    borderRadius: '0.75rem',
    padding:      '1.25rem',
    marginBottom: '1rem',
  } as React.CSSProperties,

  label: {
    fontSize:       '0.7rem',
    fontWeight:     700,
    textTransform:  'uppercase' as const,
    letterSpacing:  '0.08em',
    color:          '#475569',
    marginBottom:   '0.4rem',
    display:        'block',
  } as React.CSSProperties,

  input: {
    width:        '100%',
    background:   '#0f172a',
    border:       '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding:      '0.625rem 0.875rem',
    color:        '#f8fafc',
    fontSize:     '0.9rem',
    outline:      'none',
    boxSizing:    'border-box' as const,
  } as React.CSSProperties,

  select: {
    width:        '100%',
    background:   '#0f172a',
    border:       '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding:      '0.625rem 0.875rem',
    color:        '#f8fafc',
    fontSize:     '0.9rem',
    outline:      'none',
    boxSizing:    'border-box' as const,
    cursor:       'pointer',
  } as React.CSSProperties,

  dropZone: {
    border:        '2px dashed #334155',
    borderRadius:  '0.75rem',
    padding:       '2.5rem',
    textAlign:     'center' as const,
    cursor:        'pointer',
    transition:    'border-color 0.2s, background 0.2s',
    background:    '#0f172a',
    marginBottom:  '1rem',
  } as React.CSSProperties,

  dropZoneActive: {
    borderColor: '#7c3aed',
    background:  '#7c3aed11',
  } as React.CSSProperties,

  btn: {
    background:   '#7c3aed',
    color:        '#fff',
    border:       'none',
    borderRadius: '0.5rem',
    padding:      '0.75rem 1.5rem',
    fontSize:     '0.9rem',
    fontWeight:   700,
    cursor:       'pointer',
    width:        '100%',
    letterSpacing:'0.02em',
  } as React.CSSProperties,

  btnDisabled: {
    background: '#1f2937',
    color:      '#475569',
    cursor:     'not-allowed',
  } as React.CSSProperties,

  disclaimer: {
    background:   '#7c3aed18',
    border:       '1px solid #7c3aed55',
    borderRadius: '0.5rem',
    padding:      '0.875rem 1rem',
    fontSize:     '0.8rem',
    color:        '#a78bfa',
    lineHeight:   1.6,
    marginBottom: '1.25rem',
  } as React.CSSProperties,

  riskMeter: {
    height:       '10px',
    background:   '#1f2937',
    borderRadius: '5px',
    overflow:     'hidden',
    marginTop:    '0.5rem',
  } as React.CSSProperties,

  badge: {
    borderRadius:  '0.375rem',
    padding:       '0.2rem 0.6rem',
    fontSize:      '0.7rem',
    fontWeight:    700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display:       'inline-block',
  } as React.CSSProperties,

  flagCard: {
    background:   '#0f172a',
    border:       '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding:      '0.875rem',
    marginBottom: '0.625rem',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize:      '0.75rem',
    fontWeight:    700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color:         '#475569',
    marginBottom:  '0.75rem',
    marginTop:     '1.5rem',
  } as React.CSSProperties,

  tier2Banner: {
    background:   '#7c3aed22',
    border:       '1px solid #7c3aed',
    borderRadius: '0.5rem',
    padding:      '0.75rem 1rem',
    display:      'flex',
    alignItems:   'center',
    gap:          '0.75rem',
    marginBottom: '1.25rem',
    fontSize:     '0.875rem',
  } as React.CSSProperties,

  error: {
    background:   '#ef444422',
    border:       '1px solid #ef4444',
    borderRadius: '0.5rem',
    padding:      '0.875rem 1rem',
    color:        '#f87171',
    fontSize:     '0.875rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel | Severity }) {
  return (
    <span style={{
      ...S.badge,
      color:      RISK_COLOR[level],
      background: RISK_BG[level],
      border:     `1px solid ${RISK_COLOR[level]}55`,
    }}>
      {level}
    </span>
  );
}

function ConfidenceBadge({ band }: { band: ConfidenceBand }) {
  return (
    <span style={{
      ...S.badge,
      color:      BAND_COLOR[band],
      background: `${BAND_COLOR[band]}22`,
      border:     `1px solid ${BAND_COLOR[band]}55`,
    }}>
      {band} CONFIDENCE
    </span>
  );
}

function RiskMeterFill({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div style={S.riskMeter}>
      <div style={{
        height:     '100%',
        width:      `${Math.min(score, 100)}%`,
        background: RISK_COLOR[level],
        borderRadius: '5px',
        transition: 'width 0.8s ease',
      }} />
    </div>
  );
}

function FlagList({ flags }: { flags: RiskFlag[] }) {
  if (!flags.length) {
    return (
      <div style={{ color: '#16a34a', fontSize: '0.875rem', padding: '0.5rem 0' }}>
        ✓ No risk flags identified
      </div>
    );
  }
  return (
    <>
      {flags.map((f, i) => (
        <div key={i} style={{
          ...S.flagCard,
          borderLeft: `3px solid ${RISK_COLOR[f.severity] ?? '#334155'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <RiskBadge level={f.severity} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>
              {f.clause}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', lineHeight: 1.5 }}>
            {f.issue}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
            <span style={{ color: '#475569', fontWeight: 700 }}>Negotiate: </span>
            {f.recommendation}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface NilScannerProps {
  defaultAthleteId?: string;
  defaultRole?:      string;
}

export default function NilScanner({ defaultAthleteId = '', defaultRole = 'Athlete' }: NilScannerProps) {
  const [athleteId,    setAthleteId]    = useState(defaultAthleteId);
  const [role,         setRole]         = useState(defaultRole);
  const [contractName, setContractName] = useState('');
  const [file,         setFile]         = useState<File | null>(null);
  const [dragging,     setDragging]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<NilScanResult | null>(null);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ───────────────────────────────────────────────────────

  const acceptFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are accepted.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setErrorMsg('PDF must be under 20 MB.');
      return;
    }
    setFile(f);
    setErrorMsg(null);
    setResult(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  }, [acceptFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) acceptFile(picked);
  }, [acceptFile]);

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!file || !athleteId.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    const form = new FormData();
    form.append('file',          file);
    form.append('athlete_id',    athleteId.trim());
    form.append('role',          role);
    form.append('contract_name', contractName.trim() || file.name);

    try {
      const res = await fetch('/api/sovereign/nil-scan', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error ?? `Scan failed (${res.status})`);
      } else {
        setResult(data as NilScanResult);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error — is the engine running?');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!file && !!athleteId.trim() && !loading;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>
          <span style={{ color: '#a78bfa' }}>SOVEREIGN</span> NIL Contract Scanner
        </h1>
        <div style={S.subtitle}>
          Advisory intelligence — not legal counsel · All reviews auto-escalate to Tier 2
        </div>
      </div>

      {/* Upload form */}
      {!result && (
        <div style={S.card}>

          {/* Drop zone */}
          <div
            style={{ ...S.dropZone, ...(dragging ? S.dropZoneActive : {}) }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              {file ? file.name : 'Drop NIL contract PDF here'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {file
                ? `${(file.size / 1024).toFixed(0)} KB · click to replace`
                : 'or click to browse · PDF only · max 20 MB'}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={S.label}>Athlete ID (Supabase UUID)</label>
              <input
                style={S.input}
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div>
              <label style={S.label}>Role</label>
              <select style={S.select} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Athlete">Athlete</option>
                <option value="Parent">Parent</option>
                <option value="Coach">Coach</option>
                <option value="NDA_Analyst">NDA Analyst</option>
                <option value="System_Admin">System Admin</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Contract Name (optional)</label>
            <input
              style={S.input}
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="e.g. Nike NIL Deal — Spring 2026"
            />
          </div>

          {errorMsg && <div style={S.error}>{errorMsg}</div>}

          <button
            style={{ ...S.btn, ...(canSubmit ? {} : S.btnDisabled) }}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? '⏳ Scanning contract…' : '🔍 Run NIL Risk Scan'}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Disclaimer — always first */}
          <div style={S.disclaimer}>
            ⚖️ <strong>Advisory Intelligence Only:</strong> {result.disclaimer}
          </div>

          {/* Tier 2 banner */}
          <div style={S.tier2Banner}>
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
            <div>
              <div style={{ fontWeight: 700, color: '#a78bfa' }}>Tier 2 — Pending Jabari Review</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                Escalation ID: {result.escalation_id ?? 'pending'} · Audit ID: {result.audit_id ?? '—'}
              </div>
            </div>
          </div>

          {/* Risk overview */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={S.label}>Contract</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.contract_name}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {result.page_count} {result.page_count === 1 ? 'page' : 'pages'} ·{' '}
                  {new Date(result.scanned_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <RiskBadge level={result.risk_level} />
                <ConfidenceBadge band={result.confidence_band} />
              </div>
            </div>

            {/* Risk score meter */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Risk Score
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: RISK_COLOR[result.risk_level] }}>
                  {result.risk_score}
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 400 }}>/100</span>
                </span>
              </div>
              <RiskMeterFill score={result.risk_score} level={result.risk_level} />
            </div>
          </div>

          {/* SOVEREIGN advisory */}
          <div style={S.card}>
            <div style={S.label}>SOVEREIGN Advisory</div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7 }}>
              {result.sovereign_advisory}
            </div>
          </div>

          {/* Risk flags */}
          <div style={S.sectionTitle}>
            Risk Flags ({result.risk_flags.length})
          </div>
          <FlagList flags={result.risk_flags} />

          {/* Missing protections */}
          {result.missing_protections?.length > 0 && (
            <>
              <div style={S.sectionTitle}>Missing Standard Protections</div>
              <div style={S.card}>
                {result.missing_protections.map((p, i) => (
                  <div key={i} style={{
                    padding:      '0.5rem 0',
                    borderBottom: i < result.missing_protections.length - 1 ? '1px solid #1f2937' : 'none',
                    fontSize:     '0.875rem',
                    color:        '#94a3b8',
                    display:      'flex',
                    gap:          '0.5rem',
                  }}>
                    <span style={{ color: '#f97316' }}>⚠</span> {p}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Market context + NCAA notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {result.nil_market_context && (
              <div style={S.card}>
                <div style={S.label}>NIL Market Context</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  {result.nil_market_context}
                </div>
              </div>
            )}
            {result.ncaa_compliance_notes && (
              <div style={S.card}>
                <div style={S.label}>NCAA Compliance Notes</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  {result.ncaa_compliance_notes}
                </div>
              </div>
            )}
          </div>

          {/* Scan another */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              style={{ ...S.btn, background: '#1f2937', color: '#94a3b8' }}
              onClick={() => { setResult(null); setFile(null); setContractName(''); }}
            >
              ← Scan Another Contract
            </button>
          </div>
        </>
      )}
    </div>
  );
}
