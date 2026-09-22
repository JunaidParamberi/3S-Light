<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory, in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify it at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Fuel & Travel Log — Agent Instructions

## What this project is

A phone-first web app that replaces the manual `accounts/FUEL CLAIM LOG.xlsx` process
(vehicle fuel & travel claims for 3S Lighting, UAE).

- Employees log a trip in ~30 seconds (date, meters, from/to, fuel, Salik, parking, bill photo).
- Kilometres and totals are **calculated automatically** — never typed, never summed by hand.
- Line managers approve a whole week with **one click** (replaces paper signatures).
- Accounts gets a **live dashboard** + CSV export matching the original Excel columns.
- Each trip links to a **vehicle file** (registration, make/model, current holder) so vehicle swaps are auditable.
- Works **offline** (PWA) — entries sync when the driver regains signal.

**The full non-technical + technical plan lives at:** `../accounts/APP_BUILD_PLAN.md` (source of truth for scope).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS 4 |
| Database | Neon (serverless Postgres) via Drizzle ORM (`src/db/`) |
| Auth | Auth.js / NextAuth v5 — **Employee ID + PIN** (scrypt-hashed), JWT sessions |
| Photos | Vercel Blob (bucket `trip-bills`), client-compressed to ~300KB |
| PWA | next-pwa / Workbox (offline entry queue) |
| Hosting | Vercel (free tier) |
| Monorepo | This app lives inside the `3S-Light` repo (not its own repo) |

## Commands

```bash
npm run dev        # dev server (writes/refreshes the Next.js agent-rules block in this file)
npm run build      # production build
npm run lint       # eslint
npx drizzle-kit push   # apply src/db/schema.ts to Neon (needs DATABASE_URL in .env.local)
npx tsc --noEmit   # type check
```

## Environment (`.env.local` — never commit)

- `DATABASE_URL` — Neon connection string (console.neon.tech → Connect)
- `AUTH_SECRET` — `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL`

`.env.example` documents all keys.

## Git workflow — READ THIS FIRST

**Never push directly to `main`.** This is enforced locally by the repo's pre-push hook
(`.githooks/pre-push` at the repo root). One-time setup per clone:

```bash
git config core.hooksPath .githooks
```

The flow for every change (human or agent):

```bash
git checkout main && git pull
git checkout -b feat/short-description   # or fix/…, chore/…, docs/…
# …work, commit in small logical chunks…
git push -u origin feat/short-description
# open a PR → review → merge into main (squash or merge) → delete branch
```

- Commit style: conventional (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- The two pre-existing local commits on `main` should also go out via a PR, not a direct push.
- Optional server-side belt-and-braces (recommended, needs GitHub settings): protect `main`
  (Settings → Branches → add rule → "Require a pull request before merging").

## Conventions

- **Server Components by default**; add `'use client'` only when the component needs state/events.
- All DB access goes through `src/db/index.ts` (Drizzle). Queries must be **scoped by the
  signed-in user or role** — never trust a client-supplied `userId`.
- Roles: `employee | manager | accounts | hr`. Route guards live in `src/middleware.ts`
  AND are re-checked in server actions (defense in depth).
- Excel column mapping: keep field names/comments aligned with the original sheet
  (A=travel_date, B=start_meter, C=end_meter, D=from, E=to, F=km, G=fuel, H=salik, I=parking,
  J=remarks, K=purpose, L=approval status). The CSV export must match it exactly.
- `km` and `month` are **generated columns** in SQL — never compute them in the UI as the
  source of truth (live preview while typing is fine).
- Styling: **shadcn/ui** (style `radix-luma`, preset `b7ClMfrEJ`, lucide icons) on Tailwind 4.
  RTL-capable (`components.json → rtl: true`) — currently rendering `dir="ltr"` / English;
  to flip the whole UI to Arabic, change `dir` on `<html>` and `<DirectionProvider>` in
  `src/app/layout.tsx`. Mobile PWA patterns: bottom tab bar, `vaul` bottom sheets,
  44px+ touch targets, safe-area insets.

## Current status (Phase 1 — setup)

Done:
- [x] Project scaffold (Next.js 16, TS, Tailwind)
- [x] Packages: drizzle-orm, @neondatabase/serverless, next-auth v5, drizzle-kit
- [x] Schema: `profiles`, `vehicles`, `trips` (`src/db/schema.ts`) with generated `km`/`month`
      — `month` uses an extract-based expression (to_char(date) is STABLE, banned in generated columns)
- [x] **Neon linked**: project `broad-cake-26785732` / branch `production` (`.neon`, `neon.ts`),
      `DATABASE_URL` etc. pulled into `.env.local` — schema pushed, tables verified live
- [x] Auth: **super-admin-provisioned username + password** (`src/auth.ts`, scrypt in `src/lib/hash.ts`),
      JWT sessions, `active` flag blocks deactivated users; login screen matches
- [x] Route guards (`src/middleware.ts`), app shell + login screen
- [x] **UI direction decided: shadcn/ui** — initialized with preset `b7ClMfrEJ` (button,
      direction, Inter font, RTL-ready `DirectionProvider` wired in layout); typecheck + lint clean
- [x] First super admin seeded (`npm run seed:admin` — idempotent; credentials shown once at creation)

Not done yet — **waiting on decisions, do not build until told:**
- [ ] UI language/direction: English LTR (current) or Arabic RTL? — user to confirm
- [ ] Offline PWA required? — user to confirm (affects Phase 5 scope)
- [ ] Bill photo mandatory before HR validation? — user to confirm
- [ ] `/admin/users` screen (create/reset employee accounts) — build when user gives go-ahead

Remaining phases (see `../accounts/APP_BUILD_PLAN.md`): entry form → approval →
dashboard/export → offline PWA → migration/test/launch.

## Rules for agents working in this repo

1. Follow the git workflow above — feature branch + PR, **no direct push to main**.
2. Do not expand scope beyond `APP_BUILD_PLAN.md` without asking.
3. Do not build UI/screens until the user has specified the UI direction.
4. Never commit `.env.local` or real credentials.
5. Keep this file updated when phases complete or decisions change.
