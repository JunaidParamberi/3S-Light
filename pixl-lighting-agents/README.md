# 3S Light — Pixl Lighting Voice Agent Platform

> AI-powered voice agent system for Pixl Lighting's inbound call handling, built on ElevenLabs Conversational AI and integrated with myERP via Model Context Protocol (MCP).

## What This Is

An inbound voice system. A single ElevenLabs agent answers every call and moves through an internal **workflow graph** — Reception identifies the caller, then the conversation flows into Sales, Logistics, Accounting or Technical Escalation as the caller's needs change, and back again if they switch subject.

The caller experiences one continuous conversation with one person. There is no audible handoff.

The line is answered by a **named human persona, "Sarah"**. The agent presents as a real member of the Pixl Lighting team and never identifies itself as an AI, bot, or assistant under any questioning. It speaks with personal ownership ("I'll get back to you", never "the team will get back to you"), keeps talking while ERP lookups run so the line never goes silent, and avoids phrases that expose internal search mechanics. Every call is logged into the ERP so caller context and memory persist across calls.

---

## Architecture at a Glance

All of this happens **inside one agent** (`agent_9901m25rmysyefva90xs89chy3nd`, persona "Sarah"). Nodes are conversational modes, not separate agents — they share the base prompt, the voice, and one billed conversation.

```
                    INBOUND CALL
                         │
                   Caller ID lookup
           get_caller_context({{system__caller_id}})
                         │
               ┌─────────────────────┐
               │  RECEPTION node     │  identify & read intent
               └──────────┬──────────┘
                          │  (LLM edge conditions)
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │   SALES   │    │ LOGISTICS │    │ACCOUNTING │
   │  node     │◄──►│   node    │◄──►│   node    │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         │  technical Q   │                │
         └────────┬───────┘                │
                  ↓                        │
         ┌──────────────────┐              │
         │ ESCALATION node  │              │
         │ → Sophia Charles │              │
         └────────┬─────────┘              │
                  └───────────┬────────────┘
                              ↓
                          END node
                              │
         ERP Backbone (myERP MCP Server)
      orders · quotes · inventory · invoices
```

Edges are **bidirectional** — `reception_sales`, `reception_logistics` and `reception_accounting` each carry a `backward_condition`, so a caller who starts on an order and switches to an invoice is followed without restarting the call.

---

## The Live Agent

Everything callers reach runs on **one** agent:

| | |
|---|---|
| **Dashboard name** | `Pixl Lighting — Main Assistant` |
| **Agent ID** | `agent_9901m25rmysyefva90xs89chy3nd` |
| **Persona** | Sarah |
| **First message** | *"Pixl Lighting, this is Sarah — how can I help you today?"* |
| **System tools** | `end_call` only |
| **MCP** | workspace server `iRZUVO4FTNPItBWbbmoR` |

### Workflow nodes

| Node | Handles | Key tools |
|---|---|---|
| **Reception** | Caller ID, intent detection, routing | `get_caller_context`, `find_customer_by_phone`, `find_customer_by_email` |
| **Sales** | Catalogue, pricing, quotes | `list_products`, `get_product`, `list_open_quotes`, `get_quote`, `get_quote_revisions` — **read-only; no quote or customer creation exists** |
| **Logistics** | Order status, dispatch, OEM tracking | `list_sales_orders`, `get_sales_order` |
| **Accounting** | Invoices, balances, payments, statements | `list_invoices`, `get_invoice` |
| **Escalation** | Technical questions → Sophia Charles | — |

### Dormant agents

These three remain published but **no longer receive traffic** — `transfer_to_agent` was removed from the Orchestrator, so nothing routes to them. Their prompts (`sales-prompt.md`, `logistics-prompt.md`, `accounting-prompt.md`) are **not** the live behaviour; the workflow node prompts are.

| Name | ID | Status |
|---|---|---|
| `Pixl Lighting — Sales & Projects` | `agent_7601m27jcm7ten787a5hpz68sz5j` | dormant — safe to archive |
| `Pixl Lighting — Logistics Agent` | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` | dormant — safe to archive |
| `Pixl Lighting — Accounting` | `agent_0101m2fwfttne85stk1hwcjwkzjb` | dormant — safe to archive |

*The internal staff line (formerly Jordan) was deleted; internal team members query myERP directly.*

### Persona & Behavioural Rules

All caller-facing behaviour is enforced in the Orchestrator's base system prompt, which every workflow node inherits:

| Rule | What it means |
|---|---|
| **Named human persona** | Answers as "Sarah". Never says AI / bot / assistant / system / voice agent, however the caller probes. Deflects with varied, light replies — never the same line twice in a call. |
| **Personal ownership** | Says "I'll check that and come back to you". Banned: "the team will get back to you", "someone will follow up", "I'll pass your details along". Only a *named* colleague (Sophia Charles) may be referenced. |
| **Never go quiet** | Speaks a filler before every tool call — caller lookups and order lookups included, not just catalogue searches. Backed by a platform-level soft-timeout filler at 2.5s. |
| **No exposed mechanics** | Banned: "let me try a simpler/broader search", "no results with those search terms", "I don't have access to", "I'm unable to". |
| **No estimated ship dates** | `esd_date` is never spoken aloud on any topic, in any node. Confirmed dates only, in writing. |
| **Unplaced orders** | If `oem_ordered_at` or `oem_status` is empty the order is "being processed" — never "in production" or "on its way". |

---

## System Prompts

- **[Orchestrator Prompt](docs/orchestrator-prompt.md)** — Agent 1 configuration
- **[Sales Prompt](docs/sales-prompt.md)** — Agent 3 configuration
- **[Logistics Prompt](docs/logistics-prompt.md)** — Agent 2 configuration
- **[Accounting Prompt](docs/accounting-prompt.md)** — Agent 4 configuration

---

## Key Documents

- **[Architecture](docs/architecture.md)** — Complete system design and data flow
- **[Agent Profiles](docs/agents.md)** — Detailed profiles, tools, and guardrails
- **[Workflows](docs/workflows.md)** — Call flows and `transfer_to_agent` routing logic
- **[Setup Guide](docs/setup.md)** — Deployment and configuration guide
- **[Progress Log](docs/progress.md)** — Full development chronology and decisions
- **[Troubleshooting](docs/troubleshooting.md)** — Known issues, error patterns, and fixes
- **[Stress Tests](docs/stress-test.md)** — 30+ scenario testing framework
- **[Entity Relationship Diagram](docs/erd.md)** — myERP schema reference
- **[ERP Defects & Data Gaps](docs/erp-fixes.md)** — blockers in myERP/MCP that limit the agent (broken product search, test-only catalogue, empty order lines)
- **[ERP Requirements (full list)](docs/erp-requirements.md)** — consolidated ask for the myERP team: tools to build, data fixes, environment items. Ready to share
- **[Call Logging Requirement](docs/call-logging-requirement.md)** — first-call/call-memory flow spec for the myERP team
- **[Missing Tool Specification](docs/find-customer-by-company-spec.md)** — `find_customer_by_company` tool spec for myERP team

---

## Environment

- **ERP:** myERP (demo tenant at `myerp.infinitebarakah.com`)
- **Voice Platform:** ElevenLabs Conversational AI
- **TTS Model:** `eleven_v3_conversational`, Expressive Mode enabled (so `[laughs]` / `[chuckles]` audio tags render as real laughter)
- **Voice:** `F89WkXaQbUlVyNvtlD3X`
- **LLM:** `qwen36-35b-a3b`, **temperature 0.8**
- **Max call duration:** 300s · **Soft-timeout fillers:** 2, firing at 2.5s of silence
- **MCP Server:** `https://myerp.infinitebarakah.com/api/mcp`
- **Post-Call Webhook:** `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`

---

## Cost Controls

Credit burn was investigated on 2026-09-14 and four changes applied. Check these first if spend climbs again.

| Lever | Was | Now | Why |
|---|---|---|---|
| **LLM** | `qwen35-397b-a17b` — $0.0105/min | `qwen36-35b-a3b` — $0.0025/min | **76% saving.** A 397B model was running every turn of every call. Routing + ERP lookup does not need it. |
| **Routing** | `transfer_to_agent` (`transfer_op: replace`) | workflow graph | Each transfer started a **second billed conversation**. One caller now costs one conversation. |
| **Soft-timeout fillers** | 6 max | 2 max | Each filler is a billed v3 TTS generation. Note: the API sets `max_soft_timeouts_per_generation` to the *number of filler messages supplied* — to cap at 2, supply exactly 2. |
| **Max call duration** | 600s | 300s | Caps a runaway call. Longest real test call was 175s. |

Still on the premium tier by choice: `eleven_v3_conversational` with Expressive Mode. That is what makes `[laughs]` render as real laughter, so it is load-bearing for the persona — but it is billed per character, and every filler line adds characters.

Run `agents_calculate_llm_usage` against the agent for current per-minute pricing across all models before changing the LLM again.
