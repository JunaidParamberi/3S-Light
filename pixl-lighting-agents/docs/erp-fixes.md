# myERP — Defects & Data Gaps Blocking the Voice Agent

**Raised:** 2026-09-14 · **Owner:** myERP team
**Evidence:** live call `conv_2201m2fzhqkke00t1g05y4ynsf02` (product search) and `conv_9901m2fxy64xey4r4qys27crf1xg` (order lookup)

The voice agent's behaviour is now correct under test. What remains broken is the data and the MCP layer beneath it. Every item below was observed in a real call with tool payloads captured.

---

## E-1 — `list_products` search parameter returns nothing (BLOCKER)

**Severity:** blocker — product enquiries cannot be answered at all.

Any non-empty `search` value returns an empty array. Only an empty search returns rows.

| Call | Result | Latency |
|---|---|---|
| `list_products {"search": "24-volt LED strip"}` | `[]` | 3.10s |
| `list_products {"search": "LED strip"}` | `[]` | 1.22s |
| `list_products {"search": "LED"}` | `[]` | 1.85s |
| `list_products {"search": "stadium floodlight"}` | `[]` | 2.03s |
| `list_products {"search": "floodlight"}` | `[]` | 1.41s |
| `list_products {"search": ""}` | **5 products** | 6.35s |

`"LED"` returning nothing from a lighting catalogue is the clearest proof: the filter is not matching on product name or description at all.

**Impact.** The agent correctly retried with progressively shorter terms, was told "empty" five times, and truthfully reported the catalogue had no such product. One 300-second call, 2,286 credits, no answer delivered.

**Expected.** `search` should perform a case-insensitive partial match across item code, description, manufacturer and product line.

---

## E-2 — Catalogue contains only test data (BLOCKER)

`list_products` with no filter returns 5 rows, and they are placeholders:

| Item | Description |
|---|---|
| `00001` | Body |
| `BDY-Birchen` | — |
| `Birchen 40W` | — |
| `LFC Test- 4 ft` | — |
| `PSU-40W` | PSU 40W for Birchen |

No real SKUs, three rows with no description at all. Even with E-1 fixed, no realistic product question has a correct answer. **Product flows cannot be validated until a real catalogue is loaded.**

---

## E-3 — Sales order has zero line items

`get_sales_order` for `VSO-2026-0001` returns `items: []`.

The agent cannot answer "what's on my order", "how many did I order", or "what's the total" — the commonest logistics questions. The order header exists; the contents do not.

---

## E-4 — `oem_status` / `oem_ordered_at` absent while status reads "In Production" (PIX-20, confirmed live)

`VSO-2026-0001` returns:

```
status               = In Production
esd_date             = 2026-10-01
oem_ordered_at       = (field absent)
oem_status           = (field absent)
```

This is the exact condition the agent's hardest guardrail exists for. Per the disclosure rules, missing OEM fields mean the supplier order was never placed, so the order must be described as **"being processed"** — never "in production". The ERP's own `status` field directly contradicts its OEM fields.

The agent is correctly ignoring `status` and following the OEM fields. But the underlying record is self-contradictory, and any human reading the myERP UI will tell the customer something different from what the agent says.

**Needed:** either populate `oem_ordered_at` / `oem_status` when an order genuinely enters production, or stop the UI setting `status` to "In Production" before the supplier order is placed.

---

## E-5 — No `find_customer_by_company` tool

Unchanged from the existing spec in [find-customer-by-company-spec.md](find-customer-by-company-spec.md). A caller who offers only a company name cannot be identified; the agent must ask for a direct phone or email.

---

## E-6 — Lookup latency

| Tool | Observed |
|---|---|
| `get_customer_360` | **6.52s** |
| `list_products` (unfiltered) | **6.35s** |
| `get_sales_order` | 1.08s |
| `list_sales_orders` | 1.09s |
| `find_customer_by_phone` | 0.84–1.16s |
| `get_caller_context` | 0.46s |

On a voice call anything over ~2s is audible dead air; the agent has to talk over it with filler. `get_customer_360` at 6.5s needs two or three filler lines to cover, which is why calls feel slow. Sub-2s should be the target for anything on the critical path.

---

## E-8 — `get_customer_360` rejects an ID that `find_customer_by_phone` just returned

**Severity:** high — breaks the caller-context flow, and burns 6.5 seconds doing it.

Observed in sequence on the same call:

```
find_customer_by_phone("+971581976818")
  → customer.id = 31f5c24e-9f60-4d45-80a3-2b7468cd0353   (Northline Developments)

get_customer_360(31f5c24e-9f60-4d45-80a3-2b7468cd0353)
  → Tool "get_customer_360" failed: Customer not found: 31f5c24e-...   [6.52s]
```

One tool hands back a customer ID the next tool denies exists. Either they read different tables/tenants, or `get_customer_360` expects a different identifier. The 6.5s cost is spent entirely on failing.

---

## E-9 — Calls are not visible as interactions on the customer record

The post-call webhook is configured (`transcript`, JSON, HMAC) and ElevenLabs **is** extracting the data correctly — the follow-up field came back populated:

```
follow_up_task = "Send verified dispatch information for order VSO-2026-0001 in writing"
```

But after repeated test calls, nothing is visible against the customer in myERP. No interaction history, no call count, no follow-up tasks created.

This breaks the core premise in `architecture.md` — *"call logging against customer records so caller history persists across calls."* Without it:
- nobody can see how many times a customer has called, or about what
- the agent starts every call blind to the previous one
- committed follow-ups are never actioned, because they exist only in a transcript nobody reads

**Needed:** confirm the webhook endpoint is receiving, and that it writes an Interaction row per call plus a Task row when `follow_up_task` is populated.

**With E-10 confirmed, this is now the only write path that exists.** If the webhook does not land, nothing is ever recorded — there is no fallback.

### Diagnosing it

myERP's own key registry is already wired for this. The live key row reads:

```
ElevenLabs – Inbound receptionist (demo) v2 — with products
agent_9901m25rmysyefva90xs89chy3nd · server-wide secret
```

So myERP knows to map post-call webhooks from that agent ID back to this organisation. The mapping is configured; the rows still aren't appearing. Three candidates, in order of likelihood:

1. **Signature mismatch.** The key is registered against the *server-wide* secret. If the ElevenLabs workspace is signing with its own webhook secret instead, myERP will reject every delivery as unauthenticated. The key form has an optional `ELEVENLABS WEBHOOK SECRET (wsec_…)` field for exactly this case — populate it if the workspace issues its own.
2. **ElevenLabs isn't sending.** The agent carries `workspace_overrides.webhooks = {events: ["transcript"]}`, but that is an override — the workspace-level webhook must also have a URL registered and be enabled.
3. **myERP receives but doesn't persist.** Endpoint returns 200, nothing written.

**Check this first:** Settings → Defaults & Customization → **Audit Log** in myERP. If deliveries are arriving and being rejected, they will show there — which separates (1) and (3) from (2) in seconds, without touching any code.

---

## E-10 — The MCP server is read-only: no way to log a call from inside the conversation (BLOCKER)

**Severity:** blocker for call logging, caller history, and any on-call write.

**Confirmed 2026-09-14** by unticking "Read-only" on a new key in myERP → Integrations and filtering "Restrict to specific tools":

| Tool | Exists at write scope? |
|---|---|
| `create_task` | ✅ **yes** |
| `create_interaction` | ❌ **no** |

Write tools do exist on the server — `create_quote`, `update_quote`, `convert_quote_to_sales_order`, `create_sales_order`, `update_order_status`, `add_sales_order_item` — so this is not a server-wide read-only restriction. **Only the interaction-write endpoint is absent.**

**Consequence:** follow-up tasks can be written in-call today. Call logging cannot. The scope of this defect is therefore narrower than first recorded — one missing endpoint, not a missing write layer.

> This was verified rather than assumed. The tool list *is* filtered by key scope — the live key `ElevenLabs – Inbound receptionist (demo) v2 — with products` (`mo_KkDGxbeU9…`) is labelled "Read-only · 16 tools" in myERP, so a read-only key advertising only read tools proves nothing on its own. Granting write scope and re-checking is what settled it.

The workspace MCP server (`iRZUVO4FTNPItBWbbmoR`) exposes **16 tools, every one of them read-only**:

```
list_interactions        list_tasks             get_customer_360
find_customer_by_phone   find_customer_by_email get_caller_context
list_open_quotes         get_quote              get_quote_revisions
list_sales_orders        get_sales_order        list_sales_orders_page
list_products            get_product            list_invoices
get_invoice
```

There is no `create_interaction`, no `create_task`, no `create_customer`, no `create_quote`.

### Consequences

1. **A logging step cannot be added to the workflow.** The obvious fix for E-9 — have the agent write the interaction itself during the call, where success or failure is observable — is not buildable. There is nothing to call.
2. **The post-call webhook is the single point of failure** for everything reaching the database. It is asynchronous and fire-and-forget, so a silent failure looks exactly like a working system until someone checks the ERP and finds nothing.
3. **Documented write capability does not exist.** `README.md`, `agents.md` and `workflows.md` list `create_customer`, `create_quote` and `update_quote` on the Sales agent; `progress.md` records "22 tools, write access ✅" and an API key issued as "Estimator, read+write". None of those tools are on the server. On-call customer onboarding and quote drafting have never been possible and should not be promised to anyone.

### Requested tools

**`create_interaction`** — the one genuinely missing endpoint. One row per call, written before the call ends.

| Field | Notes |
|---|---|
| `customerId` | from `get_caller_context` / `find_customer_by_*`; nullable when unmatched |
| `contactId` | which contact was on the line, when known |
| `type` | `voice_call` |
| `direction` | `inbound` / `outbound` |
| `occurredAt` | ISO 8601 |
| `summary` | short free text |
| `externalRef` | the ElevenLabs `conversation_id`, for idempotency and transcript lookup |
| `phone` | raw caller ID, so unmatched callers are still recorded |

**`create_task`** — for the `follow_up_task` / `follow_up_due` fields the agent already collects correctly.

| Field | Notes |
|---|---|
| `customerId`, `contactId` | as above |
| `title` | e.g. "Send verified dispatch information for order VSO-2026-0001 in writing" |
| `dueDate` | ISO date, optional |
| `sourceRef` | the `conversation_id` |

**Idempotency matters.** If both the in-call write and the post-call webhook end up live, keying on `conversation_id` prevents duplicate rows.

### Interim position

Until these exist, the agent cannot record that a call happened, and **every caller is greeted as if it were their first call**. `get_caller_context` already returns "their last five interactions" and `list_interactions` already exists — so the read path is built and waiting. The moment writes land, caller history works with no change to the agent.

---

## E-7 — Contact name collides with the agent persona

`VSO-2026-0001`'s default contact at Northline Developments is **"Sarah Mills"**. The voice agent's persona is also **"Sarah"**.

On a matched call the agent greets the caller by name — producing "Hi Sarah, this is Sarah". Not an ERP bug, but it surfaces here: either rename the demo contact or rename the persona before go-live.

---

## Priority

| # | Item | Blocks | Owner |
|---|---|---|---|
| E-1 | `list_products` search broken | All product enquiries | myERP |
| E-2 | Catalogue is test data | All product enquiries | Data/Product |
| E-3 | Order line items empty | Order content questions | myERP |
| E-4 | OEM fields vs status contradiction | Correct disclosure (PIX-20) | myERP |
| E-6 | `get_customer_360` 6.5s | Perceived call speed | myERP |
| E-10 | MCP is read-only — no way to log calls | Call logging, caller history | myERP |
| E-5 | `find_customer_by_company` | Company-name callers | myERP |
| E-7 | Sarah / Sarah Mills collision | Go-live polish | This repo |

**E-1 and E-2 together mean product-related testing measures the ERP, not the agent.** Until both are resolved, validate the agent against order and invoice flows, which do return real data.
