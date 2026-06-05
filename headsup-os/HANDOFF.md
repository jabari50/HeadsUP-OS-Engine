# HU-OS Handoff — 30-second orientation

## Tagline Update (2026-06-05)
The flagship tagline is now: **"We scout from the neck up."**
Secondary line: **"From highlight tape to human truth."**
The old line ("Moneyball for behavioral analytics in the Transfer Portal era") is retired to pitch-deck context only — never masthead, never UI.

## What this is
`headsup-os/` is the **HU-OS Command Center** — a standalone Next.js 16 app (separate from the main HeadsUP Hub root). It surfaces all 9 operational pipelines as a unified dark-mode dashboard for Jabari.

## Stack
- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** (PostCSS plugin, no config file)
- **Geist** font (Vercel, loaded via next/font/google)
- No database connection in this app — reads from the main Hub's API routes or Supabase directly when needed

## Gate before any new work
```bash
cd headsup-os
PATH="/opt/homebrew/bin:$PATH" npm run validate:engine
```
All three checks must be green: **TypeScript** (`tsc --noEmit`), **ESLint** (`next lint`), **build compile** (`next build --no-lint`).

## File map
```
app/
  layout.tsx      — root layout, metadata, Geist fonts, dark-mode body
  page.tsx        — Command Center home (9 pipeline tiles)
  globals.css     — Tailwind v4 @import + CSS vars
```

## 9 Pipelines
| # | Pipeline | Route (planned) |
|---|---|---|
| 1 | Circuit Intelligence | `/circuit` |
| 2 | Scrape-to-Send | `/pipeline` |
| 3 | Athlete ProQuest | `/proquest` |
| 4 | NIL Recruiting | `/nil` |
| 5 | Scouting Reports | `/scouting` |
| 6 | Contact Database / CRM | `/crm` |
| 7 | Social Content Engine | `/social` |
| 8 | HeadsUP Digital | `/digital` |
| 9 | Foundation Curricula | `/foundation` |

## Key conventions
- **ZHR (Zero Hallucination Rule):** no placeholder data, no invented values — if it's not real, it's not rendered
- Dark-mode first (`dark:` variants throughout)
- No comments in code unless the WHY is non-obvious
