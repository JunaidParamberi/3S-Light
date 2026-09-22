# Fuel & Travel Log App — Build Plan

> **For everyone:** this document explains *what* we're building, *why* it solves the current Excel problem, and *how* we'll build it — phase by phase.
> Technical readers: the schema, RLS policies, and phase checklists are the actionable parts. Non-technical readers: the "In plain words" boxes under each section explain the same thing without code.

---

## 1. The Problem (in plain words)

Today, fuel trips are logged into a manual Excel file (`FUEL CLAIM LOG.xlsx`):

- Employees type the same details every trip, by hand, into a spreadsheet.
- Kilometres and monthly totals are calculated manually — and a formula bug in the current sheet silently drops data typed in the last data row.
- Paper signatures are chased for approval, and accounting has to open multiple files to total up a month.

**The goal:** turn a ~10-minute Excel chore into a **~30-second phone tap**, with each person's trips tracked automatically, and the accountant gets the numbers **without touching a spreadsheet**.

---

## 2. What the App Does (plain-language summary)

**Employees (30 seconds at the pump):**
- Open the app → press **"Add Trip"** → type date, start meter, closing meter, from ▶ to, fuel amount, Salik, parking.
- Optional: snap a photo of the petrol bill (required by the existing policy — reminder text is shown until uploaded).
- Every trip is tied to a **vehicle file** — registration number, make/model, who currently holds it — so vehicle swaps and spare cars are always tracked correctly.
- The app **calculates kilometres automatically** (closing − starting) and **remembers the last meter reading**, so there's almost nothing to type.

**Managers (once a week, one click):**
- See the week's trips and press **"Approve All"** — replaces the three signature boxes at the bottom of the Excel sheet.

**Accounting (live dashboard, always up to date):**
- Totals per employee / department / month, breakdown fuel vs Salik vs parking.
- Export to Excel anytime — output columns match the current sheet exactly.
- Every bill photo stored safely; approved entries are locked and cannot be edited.
- A **"Validated by HR"** status field covers the third signature box.

**Per-employee accounts (managed by a super admin):**
- A **super admin** creates every employee's account in the app — username + password. There is **no public sign-up**; employees just log in with what they were given. Forgotten passwords are reset by the super admin.
- Employees see only their own trips; accounting always knows who claimed what; name/ID/department/vehicle auto-fill from the account at first login.

**Offline support:**
- Works with no internet — a driver in a basement carpark or remote site fills the trip, and it syncs automatically when signal returns.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router)** + TypeScript + Tailwind CSS | One codebase, modern, great docs, deploys to Vercel free tier |
| Database | **Neon** (serverless Postgres; free tier, branch + autoscaling) | Real Postgres, works with any ORM, pauses to €0 when idle; project already decided on Neon |
| ORM / DB access | **Drizzle ORM** (or Prisma if you prefer) | Typed queries, easy migrations against Neon |
| Auth | **NextAuth (Auth.js)** — credentials login (username + password); accounts are **created by a super admin**, never self-registered | Matches the super-admin-provisioned model; works with any Postgres, no proprietary auth dependency |
| Photo storage (petrol bills) | **Vercel Blob** (free tier) | Lives on the same host as the app; no separate account; free tier is plenty for ~300KB compressed photos |
| PWA | `next-pwa` (Workbox) | Installable on home screen, offline entry queue |
| Hosting | **Vercel** (free tier) | Deploy from git, zero server management |

**Alternative considered:** Cloudflare Pages/D1 — cheaper at very large scale, but more setup for the same v1 result. Revisit only if Neon free-tier limits are hit.

> **Neon notes:** the free tier gives one project with generous storage and serverless autoscaling. Because Neon is plain Postgres, Row-Level Security works the same as described in section 4.2 — the difference is only *how* Auth connects to the DB (via Auth.js sessions rather than Supabase's built-in auth), enforced in route handlers and middleware.

---

## 4. Data Model

> **In plain words:** the app keeps three lists — people (who they are and their role), trips (each fuel log row), and files (photos of bills). The database computes `km` and the month automatically, so they can never be typed wrong or summed over the wrong range.

### 4.1 Tables

```sql
-- Who is logged in, what they're allowed to do, and their details from the Excel header block
create type user_role as enum ('super_admin','manager','accounts','hr','employee');

create table profiles (
  id                 uuid primary key,     -- = the Auth.js user id from NextAuth
  role               user_role not null default 'employee',
  name               text not null,
  username           text unique not null, -- login name = Employee ID (recommended; decision pending)
  password_hash      text not null,        -- scrypt hash — set/reset only by super admin
  active             boolean not null default true,  -- super admin can deactivate leavers
  employee_id        text,                 -- matches Excel "EMPLOYEE ID"
  designation        text,                 -- matches Excel "DESIGNATION"
  department         text,                 -- matches Excel "DEPARTMENT"
  division           text,                 -- matches Excel "DIVISION"
  vehicle_registration text,               -- matches Excel "VEHICLE REGISTRATION #"
  manager_id         uuid references profiles(id),  -- who can approve this person's trips
  created_at         timestamptz default now()
);

-- The vehicle file: one record per company vehicle.
-- Employees aren't locked to a vehicle — each trip points at the vehicle actually driven.
create table vehicles (
  id                 uuid primary key default gen_random_uuid(),
  registration_number text unique not null,      -- VEHICLE REGISTRATION #
  make               text,
  model              text,
  current_holder     uuid references profiles(id),  -- who has it right now (swap-safe)
  active             boolean not null default true,
  created_at         timestamptz default now()
);

-- One row per trip — mirrors Excel columns A–L
create type trip_status as enum ('submitted','approved','rejected','validated');

create table trips (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id),
  vehicle_id       uuid not null references vehicles(id),  -- which vehicle was driven
  travel_date      date not null,          -- Excel A: TRAVEL DATE
  start_meter      numeric not null,       -- Excel B: STARTING METER READING
  end_meter        numeric not null,       -- Excel C: CLOSING METER READING
  km                numeric generated always as (end_meter - start_meter) stored,  -- Excel F: TOTAL KM (auto)
  from_place       text,                   -- Excel D: FROM
  to_place         text,                   -- Excel E: TO
  fuel_amount      numeric not null default 0,  -- Excel G: FUEL AMOUNT
  salik_amount     numeric not null default 0,  -- Excel H: SALIK
  parking_amount   numeric not null default 0,  -- Excel I: PARKING
  bill_photo_url   text,                   -- attached petrol/Salik bill photo
  remarks          text,                   -- Excel J: REMARKS
  purpose          text,                   -- Excel K: PURPOSE
  status           trip_status not null default 'submitted',
  approved_by      uuid references profiles(id),
  approved_at      timestamptz,
  validated_by     uuid references profiles(id),
  validated_at     timestamptz,
  -- generated (extract-based — to_char(date) resolves to a STABLE cast, banned in generated columns)
  month text generated always as (
    extract(year from travel_date)::int::text || '-' || lpad(extract(month from travel_date)::int::text, 2, '0')
  ) stored,
  created_at       timestamptz default now(),
  constraint chk_km_positive check (end_meter > start_meter),
  constraint chk_amounts_positive check (fuel_amount >= 0 and salik_amount >= 0 and parking_amount >= 0)
);

-- Photographs of bills live in Vercel Blob (bucket "trip-bills"),
-- path: {user_id}/{trip_id}.jpg — compressed client-side to ~300KB.
```

**Design notes:**
- `km` and `month` are **generated columns** — nobody types them, nobody sums the wrong range. This deletes the Excel off-by-one bug by construction.
- Totals are computed **in SQL** (`SUM`) over approved rows — always correct, never manual.
- `status` mirrors the three bottom boxes on the sheet: Employee submitted → Manager **approved** → HR **validated**. A "rejected" state lets a manager bounce a trip back with a comment.

### 4.2 Security rules (Row-Level Security — RLS)

> **In plain words:** the app enforces "who can see what" in two layers — authorization checks in the app code itself (middleware + route handlers), backed by Row-Level Security policies in the Postgres database. Both layers must agree; the DB rules are the safety net so a bypass in the UI still can't read other people's data.

**Practical note for Neon + Auth.js:** RLS uses the current DB role/session. With Neon we set a per-request role or rely on the app-layer checks (Drizzle queries always scoped by `user_id` / department). The checklist step "RLS verified" covers whichever enforcement layer is chosen — the effect is identical: an employee cannot see another department's data.

| Role | Can do |
|---|---|
| **Super admin** | Everything — plus create employee accounts, reset/deactivate them (`/admin/users`). Owns the user list. |
| **Employee** | Insert and view only their own trips (`user_id = auth.uid()`); view their own profile; upload their own bill photos. Cannot edit a trip once `status` is no longer `submitted`. |
| **Manager** | View all trips in their department(s); approve / reject (`status` → approved/rejected, set `approved_by`, `approved_at`). Cannot edit the amounts. |
| **Accounts** | Read everything (read-only) — dashboard, exports. |
| **HR** | Read everything; validate trips (`status` → validated, sets `validated_by`). |

**Policies (ELI5 versions):**
- `select trips where user_id = auth.uid()` — I only see mine.
- `select trips where department = (select department from profiles where id = auth.uid())` — managers see their department.
- `select trips` (all) — accounts and HR see everything.
- `update` — only allowed on your own `submitted` trip, or by a manager/HR for the status fields only.

---

## 5. Pages & Roles

| Route | Who | Purpose |
|---|---|---|
| `/` | all | Big **"Add Trip"** button + list of this month's trips |
| `/new` | employee | The 8-field entry form + camera photo; offline-capable |
| `/admin/users` | super admin | Create employee accounts (name, username, dept, role, initial password), reset password, deactivate/reactivate |
| `/approve` | manager | This week's trips, grouped by employee, **Approve All** button, reject-with-comment |
| `/dashboard` | accounts (read-only) | Totals by employee / department / month, fuel vs Salik vs parking split, month filter, **Export CSV** |
| `/vehicles` | manager / accounts | Vehicle file: add/edit vehicles (registration, make/model, current holder); per-vehicle fuel history + total claims |
| `/trips/[id]` | all (own) / manager / accounts | Trip detail + bill photo preview |
| `/api/export` | accounts | CSV export matching the current Excel columns exactly |
| `/login` | everyone | One-time code sign-in (email OTP or ID+PIN per build decision) |

`middleware.ts` guards the routes: `/approve` → manager only, `/dashboard` → accounts/hr only, `/new` → employee+manager.

---

## 6. Build Phases

> **In plain words:** we build in six small steps. Every phase ends with something you can open and click — the app is usable from week one (Phase 2), and each later phase only makes it better.

### Phase 1 — Skeleton + Login (Day 1)

- [ ] Init Next.js (App Router) + Tailwind, add Drizzle + Auth.js packages, `.env.local` with Neon + Auth keys.
- [ ] Neon project: create tables + RLS policies (section 4), Vercel Blob store configured (bucket `trip-bills`).
- [ ] Auth screen: magic link / OTP. First login → **profile completion form** (name, employee ID, designation, department, division, vehicle) — filled once, used forever.
- [ ] Roles assigned (employee / manager / accounts / hr / super_admin) on the profile.
- [ ] **Account provisioning:** `/admin/users` — super admin creates employee accounts
      (name, username, department, role, initial password), resets passwords, deactivates users.
      No self-registration anywhere.
- [ ] Seed command creating the first super admin (`npm run seed:admin`) — run once on launch.
- [ ] Route guards in `middleware.ts`.

**Definition of done:** a person can log in, fill their profile, and land on `/`. A manager can log in and see the same app with an Approve tab.

### Phase 2 — The Entry Form (Day 2–3) ← the actual time-saver

- [ ] `/new` form: date, start/end meter, from ▶ to, fuel/Salik/parking, purpose, remarks, optional bill photo upload.
- [ ] **Prefill:** `start_meter` = the employee's last trip's `end_meter`. (The single biggest productivity win.)
- [ ] Live KM display: `end − start` shown as they type.
- [ ] Validation: `end > start`, amounts ≥ 0, date ≤ today; photo compressed client-side to ~300KB.
- [ ] On save: insert trip → upload photo → show it on the home list.

**Definition of done:** an employee submits a trip from a phone and it appears on `/` with correct KM and total.

### Phase 3 — Manager Approval (Day 4)

- [ ] `/approve`: trips grouped by week then employee, checkbox per trip + **Approve All**, reject-with-comment.
- [ ] Status chips (Submitted / Approved / Rejected / Validated) update live everywhere.
- [ ] Locking: approved trips become read-only for the employee.

**Definition of done:** a manager approves a week of trips with one click; the employee can no longer edit them; rejected trips show the comment.

### Phase 4 — Dashboard + Excel Export (Day 5–6)

- [ ] Server-side SQL aggregation: totals by employee / department / month; grand total.
- [ ] Month filter + split fuel vs Salik vs parking.
- [ ] CSV export with **the exact column layout of the current Excel** (rows 6 header wording), plus a "Validated (HR)" column.
- [ ] HR validate action on the dashboard.
- [ ] Vehicle registry: add/edit vehicles, set current holder on swaps, see each vehicle's fuel history + total claims (the "vehicle file").

**Definition of done:** accounting can reconcile a full month end-to-end, from dashboard total to exported CSV, in under a minute.

### Phase 5 — Offline PWA (Day 6–7)

- [ ] Installable manifest + icons (Android + iOS home screen).
- [ ] Offline `/new`: trip saved to IndexedDB as a local draft; sync queue pushes to Neon on reconnect.
- [ ] Bill photo held as a local blob until sync; sync = insert trip → upload photo → clear queue.

**Definition of done:** airplane-mode entry → reconnect → trip appears in the dashboard, photo included.

### Phase 6 — Data migration, test, launch (Day 8–10)

- [ ] Seed script imports existing Excel rows into `trips` (accounting keeps its history; also proves the columns map 1:1).
- [ ] Test matrix on 3 devices (iPhone Safari, Android Chrome, desktop); offline case; photo upload; rejected-trip flow.
- [ ] Deploy to Vercel (free), custom domain, Neon production database prepared at the right moment.
- [ ] **Rollout:** pilot 2 drivers for a week → fix pain points → full team.

**Definition of done:** the Excel file is retired as the daily tool and kept only as archive.

---

## 7. Deliverables Checklist (what "done" means)

- [ ] Employee adds a trip in under 1 minute, phone-first, with bill photo.
- [ ] Super admin can create an employee account and that employee can log in immediately; forgotten passwords are reset by the super admin, not by email links.
- [ ] New trips from an offline location sync automatically when back online.
- [ ] Manager approves a full week with one click — no per-trip signatures.
- [ ] Accounts dashboard is live with per-employee, per-department, per-month totals.
- [ ] CSV export matches the current Excel columns exactly.
- [ ] Approved rows are immutable; bill photos are retrievable by trip.
- [ ] Vehicle file exists per vehicle (registration, make/model, current holder) with claims history — swaps and spare cars handled.
- [ ] RLS verified: an employee cannot see another department's data; accounts sees all.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| iOS PWA quirks (no push notifications, storage eviction) | Accepted for v1; offline queue keeps data safe regardless. Notifications via email if requested. |
| Magic-link emails land in spam | OTP fallback; test against the company mail server before rollout. |
| Bill photo file sizes blowing the storage cap | Client-side compression to ~300KB; Vercel Blob free tier (500MB) holds ~1,600 trips, and bill photos aren't heavy; upgrade only if the team outgrows it. |
| Scope creep (expense module, HR reports, ERP integration) | Marked out of v1. HR is one status field; integrations can be v2 exports. |
| The Excel off-by-one totals bug | By design: totals are SQL-generated over approved rows; no hand-typed ranges exist. |
| Employees dislike logging on their own device | Pilot week with 2 drivers first; measure time-per-trip against the Excel baseline. |

---

## 9. Timeline

| Phase | Days | Locked when |
|---|---|---|
| 1 — Skeleton + login | 1 | ✅ usable login |
| 2 — Entry form | 2–3 | ✅ first phone submission |
| 3 — Manager approval | 4 | ✅ approve-all works |
| 4 — Dashboard + export | 5–6 | ✅ month-end reconciliation possible |
| 5 — Offline PWA | 6–7 | ✅ airplane-mode → sync |
| 6 — Migration, test, launch | 8–10 | ✅ Excel retired, team live |

Total: **~10 working days**, then zero maintenance beyond occasional dependency updates.

---

## 10. Open Decisions (need your call)

1. **Login details (recommended answers, confirm to lock):** super admin creates accounts; **username = Employee ID**; **password = 4–6 digit PIN** (driver-friendly at the pump, stored scrypt-hashed). Alternative: custom usernames / full alphanumeric passwords.
2. **Offline truly required, or nice-to-have?** If drivers always have signal, Phase 5 shrinks and the app can ship on Day 5–6.
3. **Bill photo mandatory or optional?** The current policy says documents must be attached to validate the claim — recommend **mandatory for the "Validated (HR)" stage**, optional at submission.