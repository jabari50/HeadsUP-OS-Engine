-- ═══════════════════════════════════════════════════════════════════════════
-- 0004 — athlete_intel: the master-pipeline intelligence vault.
-- Raw imported records (contacts, parent/guardian info, GPA, stats text,
-- accolades, NIL interest, open-response essays) from Jabari's intake forms.
--
-- Gate 8: this is PII + open-response text — the §9 rules say it NEVER
-- crosses a role boundary. System_Admin read-only; writes in service context.
-- ═══════════════════════════════════════════════════════════════════════════

create table athlete_intel (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  source text not null check (source in ('sportsinfluencer_db','gopro_talent_network','tabc_media_packet')),
  intel jsonb not null,
  imported_at timestamptz default now(),
  unique (athlete_id, source)
);
create index athlete_intel_athlete_idx on athlete_intel (athlete_id);

alter table athlete_intel enable row level security;

create policy admin_read_intel on athlete_intel for select
  using (app_role() = 'System_Admin');

revoke insert, update, delete on athlete_intel from anon, authenticated;
