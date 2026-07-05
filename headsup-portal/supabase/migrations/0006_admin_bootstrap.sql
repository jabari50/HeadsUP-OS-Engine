-- 0006 — founder admin bootstrap.
--
-- Grants System_Admin to the founder account. app_metadata is server-
-- controlled (Gate 7), so stamping the role here is the secure path;
-- user_metadata would be self-editable and is never used for authz.
--
-- Applied via direct provisioning (below) rather than a BEFORE INSERT trigger
-- on auth.users, because Supabase restricts DDL on the `auth` schema. The row
-- is created passwordless + email-confirmed, so a magic-link request for this
-- address authenticates the existing user and inherits the role on login.
--
-- Idempotent: re-running is a no-op if the account already exists.

do $$
declare v_uid uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where lower(email) = 'jabari50@gmail.com') then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'jabari50@gmail.com', now(),
    jsonb_build_object('provider','email','providers', jsonb_build_array('email'),'role','System_Admin'),
    '{}'::jsonb, now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    'jabari50@gmail.com', v_uid,
    jsonb_build_object('sub', v_uid::text, 'email','jabari50@gmail.com','email_verified',true),
    'email', now(), now(), now()
  );
end $$;
