# 🏗️ myERP Team — Full List of Requirements for the Voice Agent

Everything needed from the myERP team for the Pixl Lighting voice agent to work and go live. Raised from real test calls with tool payloads captured.

---

## 🛠️ A. MCP Tools to BUILD

### 1. `create_interaction` — log every call 🔴 BLOCKER

The agent cannot record that a call happened. **Every caller is greeted as a first-time caller**, even return customers.

One row per call:
| Field | Notes |
|-------|-------|
| `customerId` | from caller lookup; nullable when unknown |
| `contactId` | which contact was on the line, when known |
| `type` | `voice_call` |
| `direction` | `inbound` |
| `occurredAt` | ISO 8601 |
| `summary` | short summary of the call |
| `externalRef` | ElevenLabs `conversation_id` (idempotency) |
| `phone` | raw caller ID — unknown callers still recorded |

### 2. `create_task` — save follow-ups 🔴 BLOCKER

The agent already collects `follow_up_task` / `follow_up_due` correctly ("Send verified dispatch information for order VSO-2026-0001 in writing") — but nothing turns them into real tasks.

| Field | Notes |
|-------|-------|
| `customerId`, `contactId` | as above |
| `title` | the follow-up text |
| `dueDate` | ISO date, optional |
| `sourceRef` | the `conversation_id` |

### 3. `create_customer` — register brand-new customers 🔴 BLOCKER

A first-time caller has no record. To "remember" them on the next call, the system must create a customer record from the details collected on the first call (name, company, phone, email).

### 4. `find_customer_by_company` — look up by company name 🔴 P0

Callers often give only a company name ("I'm from Bluewater"). No tool exists for this — today the agent misuses `find_customer_by_email` or fails to identify the caller.

**Spec:** `find_customer_by_company(company)` → case-insensitive partial match on the company field, returns full customer object (id, name, company, email, phone, address), returns `null` when no match. Full JSON spec in `docs/find-customer-by-company-spec.md`.

### 5. Fix `get_customer_360` 🟠 HIGH

Returns *"Customer not found"* for an ID that `find_customer_by_phone` just returned in the same call. E.g. phone lookup returned `31f5c24e-…`, then `get_customer_360(31f5c24e-…)` failed. Either different tables/tenants or wrong identifier expected. Also costs 6.5s — entirely wasted on failing.

### Current state

The workspace MCP server (`iRZUVO4FTNPItBWbbmoR`) exposes **16 tools, all read-only**:

```
list_interactions        list_tasks             get_customer_360
find_customer_by_phone   find_customer_by_email get_caller_context
list_open_quotes         get_quote              get_quote_revisions
list_sales_orders        get_sales_order        list_sales_orders_page
list_products            get_product            list_invoices
get_invoice
```

**No `create_interaction`, no `create_task`, no `create_customer`, no `find_customer_by_company`.** Write tools exist on the server (create_quote, create_sales_order, etc.) — the interaction/customer endpoints are simply absent. `create_task` exists server-side at write scope but is not exposed.

---

## 📦 B. DATA / Behaviour FIXES

### 6. Product search is broken — `list_products` 🔴 BLOCKER

**Any non-empty `search` value returns an empty array.** Only an empty search returns rows.

| Test | Result |
|------|--------|
| `list_products {"search": "24-volt LED strip"}` | `[]` |
| `list_products {"search": "LED"}` | `[]` |
| `list_products {"search": ""}` | 5 products |

`"LED"` returning nothing from a lighting catalogue proves the filter isn't matching on name or description at all.

**Expected:** case-insensitive partial match across item code, description, manufacturer, product line.

One real call burned 2,286 credits across 5 retries and still couldn't answer a product question.

### 7. Catalogue contains only test data 🔴 BLOCKER

`list_products` returns only 5 placeholder rows with no real SKUs or descriptions:

| Item | Description |
|------|-------------|
| `00001` | Body |
| `BDY-Birchen` | — |
| `Birchen 40W` | — |
| `LFC Test- 4 ft` | — |
| `PSU-40W` | PSU 40W for Birchen |

**Expected:** real product catalogue with actual SKUs and descriptions.

### 8. Orders have zero line items 🔴 BLOCKER

`get_sales_order` for `VSO-2026-0001` returns `items: []`. The agent cannot answer "what's on my order", "how many did I order", or "what's the total" — the most common logistics questions.

**Expected:** order line items populated.

### 9. Status contradicts OEM fields (PIX-20) 🟠 HIGH

Order `VSO-2026-0001`:
```
status         = "In Production"
esd_date       = 2026-10-01
oem_ordered_at = (absent)
oem_status     = (absent)
```

The order shows "In Production" but the supplier order was never placed. The agent correctly says "being processed", but **any human reading the myERP UI tells the customer something different**.

**Expected:** populate `oem_ordered_at` / `oem_status` when an order genuinely enters production, OR stop the UI setting status to "In Production" before the supplier order is placed.

### 10. Lookup latency 🟠 MEDIUM

| Tool | Observed |
|------|----------|
| `get_customer_360` | **6.52s** |
| `list_products` (unfiltered) | **6.35s** |
| `get_sales_order` | 1.08s |
| `find_customer_by_phone` | 0.84–1.16s |
| `get_caller_context` | 0.46s |

Anything over ~2s is audible dead air on a voice call. **Target sub-2s** on critical-path lookups.

### 11. Post-call webhook not logging calls 🔴 BLOCKER

ElevenLabs IS sending the transcript and the follow-up field came back populated:
```
follow_up_task = "Send verified dispatch information for order VSO-2026-0001 in writing"
```
…but **nothing appears on the customer record** in myERP after repeated test calls. No interaction history, no call count, no follow-up tasks.

**Check (in order):**
1. **HMAC signature mismatch** — the live key is registered server-wide; if ElevenLabs signs with its own workspace secret, myERP rejects every delivery. Populate the `wsec_…` webhook secret field on the key.
2. **Is ElevenLabs sending?** — workspace webhook must be registered + enabled.
3. **Receives but doesn't persist?** — the endpoint returns 200 but nothing is written.

**Fastest diagnosis:** myERP → `Settings → Defaults & Customization → Audit Log`. If deliveries are arriving and being rejected, they show there.

---

## 🌍 C. ENVIRONMENT / Data Readiness

| # | Item | Why |
|---|------|-----|
| 12 | **Production tenant** | Demo tenant can't go live — no real products, orders, invoices |
| 13 | **Production API keys** (new `mo_…` tokens) for MCP + webhook | Demo keys can't serve production traffic |
| 14 | **Real customer records** (contacts, phones, emails) | Only 2 test contacts exist (Sarah Mills, Junaid) |
| 15 | **Billing contact name** | Agent ends call early on "who do I contact about billing?" — no data (PIX-22, currently accepted) |

---

## 🎯 Priority Summary — the one-line version for the team

> **🔴 P0 / Blockers:** ① `create_interaction` + `create_task` + `create_customer` (call logging + memory) ② `find_customer_by_company` ③ fix `list_products` search ④ real product catalogue ⑤ order line items ⑥ webhook actually writing rows.
>
> **🟠 High:** `get_customer_360` fix · OEM fields vs status · production tenant + keys · real customer records.
>
> **🟡 Medium:** lookup latency (sub-2s target) · billing contact name.