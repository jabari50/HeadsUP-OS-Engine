-- Active Virtual GM operators may read verified athletes from the HU-OS pool.
-- Scope: sovereign_verified rows only; requires an active operator license row.
-- Applied via MCP migration: vgm_operators_read_verified_athletes (2026-06-10)
create policy "vgm_operator_read_verified" on public.athletes
  for select to authenticated
  using (
    sovereign_verified = true
    and exists (
      select 1 from public.operators o
      where o.id = (select auth.uid()) and o.active
    )
  );
