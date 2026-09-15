# Inbound Workflows & Routing Logic

## Overview

Every inbound call is handled by **one agent** — `Pixl Lighting — Main Assistant` (`agent_9901m25rmysyefva90xs89chy3nd`), persona "Sarah". Routing happens inside an ElevenLabs **workflow graph**: each node swaps in an `additional_prompt` on top of the shared base prompt, so the caller stays in one conversation with one voice throughout.

```
                  [ Caller on Phone ]
                           │
                           ▼
                  ┌────────────────┐
                  │   start_node   │
                  └────────┬───────┘
                           │ unconditional
                           ▼
                  ┌────────────────┐
                  │   RECEPTION    │  get_caller_context
                  └────────┬───────┘
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    SALES     │    │  LOGISTICS   │    │  ACCOUNTING  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └─────────┬─────────┘                   │
                 ▼                             │
         ┌───────────────┐                     │
         │  ESCALATION   │                     │
         │ Sophia Charles│                     │
         └───────┬───────┘                     │
                 └──────────┬──────────────────┘
                            ▼
                     ┌────────────┐
                     │  end_node  │
                     └────────────┘
```

---

## Why one agent, not four

The system previously ran an Orchestrator that used the `transfer_to_agent` system tool to hand callers to three separate published agents. That was removed on 2026-09-14 for three reasons:

1. **Double billing.** `transfer_op: replace` starts a *new* conversation on the target agent. One caller was billed as two conversations.
2. **Split source of truth.** The Orchestrator's base prompt did not reach the standalone sub-agents — they had entirely separate prompts. A guardrail added in one place silently failed to apply in the others. This is how the `esd_date` rule ended up enforced in one place and breached in another.
3. **An audible seam that made no sense.** All agents shared the same voice, so the caller heard *"let me connect you to our order specialist"* followed by the same voice continuing. The handoff announced itself without delivering anything.

The three standalone agents (`agent_7601`, `agent_1001`, `agent_0101`) are still published but receive no traffic. Their prompt files in this repo are **historical** — they are not what runs.

---

## Edges

Routing conditions are LLM-evaluated. Forward edges move the caller into a specialism; backward edges let them change subject without restarting.

| Edge | Direction | Fires when |
|---|---|---|
| `start_to_reception` | → | Call connects (unconditional) |
| `reception_sales` | ⇄ | Product, price, availability, or a quote |
| `reception_logistics` | ⇄ | An existing order — status, production, shipping, tracking, arrival |
| `reception_accounting` | ⇄ | An invoice, balance, payment, or statement of account |
| `reception_escalation` | → | An explicit technical question (specs, wiring, drivers, IP rating, dimming protocol, compatibility) |
| `sales_escalation` | ⇄ | Technical question the catalogue or quote cannot answer |
| `logistics_escalation` | ⇄ | Technical question the order record cannot answer |
| `reception_end` / `sales_end` / `logistics_end` / `accounting_end` | → | Question answered **and** caller has said goodbye |
| `escalation_end` | → | Details taken, caller knows Sophia is picking it up, caller done |

Two deliberate guards are written into the edge conditions themselves:

- Every `*_end` condition states *"Never true while the caller still has an unanswered question."* This stops the agent hanging up mid-problem — an observed failure (Agent 1, Criterion 3).
- The escalation conditions state escalation is **not** met merely because the agent has not yet answered, because a search returned nothing, or because the caller is unhappy. This fixes PIX-23, escalation overuse.

---

## Node responsibilities

Each node appends to the base prompt in `orchestrator-prompt.md`. The base prompt carries persona, identity, ownership and the hard guardrails; nodes carry only what is specific to them.

### Reception
Calls `get_caller_context` with `{{system__caller_id}}` before anything else, greeting the caller by name on a match. Falls back to `find_customer_by_phone`, then `find_customer_by_email`. Reads intent and moves on — no menu, no list of capabilities, at most one clarifying question. Does not read out order details or dates.

> **No `find_customer_by_company` tool exists.** If a caller gives only a company name it cannot be looked up. Ask for a direct phone or email. See [find-customer-by-company-spec.md](find-customer-by-company-spec.md).

### Sales
`list_products` then `get_product`. Reads quotes from the ERP and talks through lines, quantities, totals, what is still open.

An empty catalogue result is **not** proof Pixl doesn't stock something — retry once with a shorter term, silently. Anything genuinely off-catalogue (a new part, substitute, or equivalent) is never answered live; details are taken and sent by email so anything non-standard lands in writing. Never improvise a spec, price, or lead time.

### Logistics
The tightest guardrails in the system.

- Check `oem_ordered_at` and `oem_status` before describing any order. Either empty ⇒ the supplier order is not placed ⇒ "being processed", never "in production" or "on its way". The internal status field does not override this (see PIX-20).
- `esd_date` is never read aloud, anywhere.
- Slippage beyond ~2 weeks stops being handled on the call and moves to writing.

### Accounting
`list_invoices`, `get_invoice`. Matter-of-fact about money — answering a question, not collecting a debt. Cannot take a payment or alter an invoice; takes details and owns the follow-up. Never collects card details over the phone.

### Escalation
Technical detail requiring a data sheet. Does not guess, does not half-answer. Names Sophia Charles — a real colleague, so naming her is allowed under the personal-ownership rule — and confirms the handoff personally. Returns to normal handling if the caller raises something non-technical afterwards.
