# Inbound Workflows & Routing Logic

## Overview

The Pixl Lighting inbound system follows an **Orchestrator → Sub-Agents** routing model:

```
                  [ Caller on Phone ]
                           │
                           ▼
          ┌──────────────────────────────────┐
          │  Orchestrator Agent              │
          │  "Pixl Lighting — Main Assistant"│
          │  (agent_9901m25...)              │
          └────────────────┬─────────────────┘
                           │
               Caller ID & Inquiry Classify
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Sales Agent  │    │Logistics Agt │    │Accounting Agt│
│(agent_760...)│    │(agent_100...)│    │(agent_010...)│
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 1. The Orchestrator Flow

1. **Pickup:** Orchestrator answers with: *"Pixl Lighting, how can I direct your call today?"*
2. **First Action:** Automatically calls `get_caller_context` with `phone: {{system__caller_id}}`.
3. **Lookup Match:**
   - If `matched: true`: Customer name, open quotes, orders, and open invoices are loaded.
   - If `matched: false`: Fallback to `find_customer_by_phone` or `find_customer_by_email`.
4. **Classification & Transfer:**
   - **Sales Inquiry:** Product pricing, catalogue specifications, new project quote, new customer setup → Transfers to `agent_7601m27jcm7ten787a5hpz68sz5j`.
   - **Logistics Inquiry:** Order status, manufacturing schedule, shipping dates, freight tracking → Transfers to `agent_1001m27jcfqnf3mb6jzszw3w3xf0`.
   - **Accounting Inquiry:** Invoice balance, wire transfer instructions, payment receipt, billing dispute → Transfers to `agent_0101m2fwfttne85stk1hwcjwkzjb`.

---

## 2. Sales Sub-Agent Flow (`agent_7601m27jcm7ten787a5hpz68sz5j`)

- **Role:** Handles all pre-sales, product selection, and quote generation.
- **Capabilities:**
  - Product specs: Queries `list_products` and `get_product`.
  - Quote review: Queries `list_open_quotes` and `get_quote`.
  - New Customer Onboarding: Uses `create_customer` on live call.
  - Quote Drafting: Uses `create_quote` and `update_quote`.
- **Guardrail:** Cannot convert quote to sales order or issue invoice (human-only).

---

## 3. Logistics Sub-Agent Flow (`agent_1001m27jcfqnf3mb6jzszw3w3xf0`)

- **Role:** Handles post-sales order fulfilment and dispatch.
- **Capabilities:**
  - Queries `list_sales_orders` and `get_sales_order`.
  - Checks supplier manufacturing status (`oem_ordered_at`, `oem_status`).
- **Guardrails:**
  - If OEM status is blank, order is NOT in production — stated as "being processed".
  - Estimated ship dates (`esd_date`) are NEVER read out loud. Confirmed dates only.
  - Delays > 2 weeks are followed up in writing via email.

---

## 4. Accounting Sub-Agent Flow (`agent_0101m2fwfttne85stk1hwcjwkzjb`)

- **Role:** Handles financial records and receivables.
- **Capabilities:**
  - Queries `list_invoices` and `get_invoice`.
  - Confirms outstanding balance and due dates.
- **Guardrails:**
  - Never collects credit card numbers over the phone.
  - Payment confirmation links and wire instructions sent in writing to verified email.

---

## 5. Technical Escalation (All Agents)

If a question requires deep engineering specifications (wiring schematics, driver loads, DMX/DALI protocols, IP ratings compliance, customized mounting details):
- The agent does not guess.
- The inquiry is escalated to **Sophia Charles** with project details.
- Routine questions (pricing, delivery dates, invoices) are never escalated.
