# The Heads Up! Foundation — Flagship Site

Next.js 14 + Tailwind + Supabase. Modern sports-media editorial design per the
HeadsUP brand system (navy `#112240` / teal `#00c896`, Bebas Neue / Montserrat /
Oswald / DM Serif Display, sharp edges, asymmetric grids).

## Run

```bash
npm install
npm run dev        # http://localhost:3000  (launch.json uses port 3003)
npm run build
```

## Pages

Home, About/Mission, Programs, Events, Get Involved (3 intake forms), Donate,
Media/HoopCityUSA, Contact, PRO-File OS (public product page), Log In / Sign Up,
Dashboard (role-scoped shell: athlete / parent / coach / mentor / admin).

## Auth & data

- Supabase Auth (email/password + Google OAuth). Copy `.env.example` → `.env.local`
  and fill in a dedicated Supabase project; without env vars the site runs fine and
  auth pages show a "not configured" design-review notice.
- Apply `supabase/migrations/0001_init.sql` — profiles + roles, guardian↔athlete
  links, coach rosters, intake submissions, full RLS enforcing the recommended
  permission matrix (visibility locked by default; guardian-controlled unlock via
  `set_athlete_visibility` RPC; users cannot change their own role; admin cannot
  be self-assigned).
- `/api/intake` receives Get Involved / Contact forms (segment-tagged for CRM).

## Before publish — content gates

See `CONTENT_SOURCES.md`. All copy is sourced from the old Wix site (pulled
2026-07-12) or marked `[[NEEDS JABARI INPUT: …]]` in gold dashed boxes on-page.
Search the codebase for `NEEDS JABARI INPUT` to find every open placeholder.
Blockers for going live: EIN/tax language, payment processor, Showcase/Combine
relationship copy, PRO-File OS launch status, legal/COPPA review of the minor-data
flow.
