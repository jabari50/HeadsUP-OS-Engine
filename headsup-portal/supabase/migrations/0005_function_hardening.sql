-- 0005 — function hardening (from Supabase security advisors, 2026-07-05)
--
-- (a) Pin search_path on every SECURITY DEFINER / STABLE helper so a caller's
--     mutable search_path can't shadow builtins or table refs (lint 0011).
--     All bodies reference only pg_catalog builtins, qualified auth.* calls,
--     and public tables — pg_catalog, public keeps them working.
-- (b) Revoke EXECUTE on the trigger functions from API roles: they are fired
--     by triggers only and must never be reachable via /rest/v1/rpc
--     (lints 0028 / 0029). This does not affect trigger firing.

alter function public.app_role()                 set search_path = pg_catalog, public;
alter function public.enforce_score_write_gate()  set search_path = pg_catalog, public;
alter function public.enforce_fit_score_gate()    set search_path = pg_catalog, public;
alter function public.block_audit_mutation()      set search_path = pg_catalog, public;
alter function public.resolve_activation(uuid, uuid) set search_path = pg_catalog, public;
alter function public.my_operator_id()            set search_path = pg_catalog, public;

revoke execute on function public.enforce_score_write_gate() from public, anon, authenticated;
revoke execute on function public.enforce_fit_score_gate()   from public, anon, authenticated;
revoke execute on function public.block_audit_mutation()     from public, anon, authenticated;
