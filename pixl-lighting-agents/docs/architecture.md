# System Architecture

## Overview

The Pixl Lighting voice agent platform connects an ElevenLabs conversational AI agent to the myERP system via MCP (Model Context Protocol). A **single agent** answers every inbound call, matches caller ID to the ERP record, and moves through an internal workflow graph as the conversation develops.

```
                    INBOUND CALL
                         │
                   Caller ID lookup
             phone number → ERP/CRM record
                         │
               ┌─────────────────────┐
               │   RECEPTION node    │
               │  identify & route   │
               └──────────┬──────────┘
                          │ LLM edge conditions
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │   SALES   │    │ LOGISTICS │    │ACCOUNTING │
   │   node    │    │   node    │    │   node    │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
               Knowledge base (RAG)
             data sheets & wiring specs
                          │ (unresolved technical)
                          ↓
             ESCALATION node → Sophia Charles
                          │
         ERP Backbone (myERP MCP Server)
      orders · quotes · inventory · invoices
```

All five nodes are modes of one agent, sharing one base prompt, one voice, and one billed conversation. Edges into Sales, Logistics and Accounting are bidirectional, so a caller who changes subject is followed rather than restarted.

---

## The Agent

| Role | ElevenLabs Label | ID | Responsibility |
|------|------------------|----|----------------|
| **All inbound** | Pixl Lighting — Main Assistant | `agent_9901m25rmysyefva90xs89chy3nd` | Answers as "Sarah", identifies the caller, and handles sales, logistics and accounting inline via workflow nodes |

Three sub-agents (`agent_7601`, `agent_1001`, `agent_0101`) remain published but dormant — `transfer_to_agent` was removed on 2026-09-14, so nothing routes to them. See [workflows.md](workflows.md#why-one-agent-not-four).

---

## Technical Escalation

For deep electrical and engineering questions (wiring diagrams, driver loads, DMX/DALI protocols, IP ratings compliance), the call escalates to **Sophia Charles**. Routine questions (pricing, delivery dates, invoices) are never escalated — the edge conditions explicitly state that escalation is *not* warranted merely because the agent has not yet answered, because a search returned nothing, or because the caller is unhappy (PIX-23).

---

## Components

### 1. ElevenLabs Voice Agent
- **Platform:** ElevenLabs Conversational AI
- **LLM:** `qwen36-35b-a3b`, temperature 0.8, `reasoning_effort` low
- **TTS:** `eleven_v3_conversational` with Expressive Mode — required for `[laughs]` / `[chuckles]` audio tags to render as real laughter
- **Voice:** `F89WkXaQbUlVyNvtlD3X`
- **Guardrails:** Focus, Prompt injection
- **Turn model:** `turn_v3`, 7s turn timeout
- **Soft-timeout fillers:** 2 messages, firing after 2.5s of silence
- **Max call duration:** 300s
- **Branch:** Main

### 2. MCP Server (Model Context Protocol)
- **URL:** `https://myerp.infinitebarakah.com/api/mcp`
- **Auth:** Bearer token (`mo_...`)
- **Protocol:** JSON-RPC 2.0 over HTTP POST
- **Scope:** Workspace-level (`iRZUVO4FTNPItBWbbmoR`)
- **Tools:** 16 available tools for ERP data access
- **Missing:** no `find_customer_by_company` — a caller giving only a company name cannot be looked up

### 3. myERP System
- **Tenant:** Demo (`myerp.infinitebarakah.com`)
- **Data:** Customers, quotes, orders, invoices, products, tasks, interactions
- **API:** RESTful API with MCP adapter

### 4. Post-Call Webhook & Memory
- **URL:** `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
- **Events:** Transcript
- **Auth:** HMAC signing
- **Purpose:** Automatic call logging against customer records so caller history persists across calls
- **Data collection fields:** `follow_up_task`, `follow_up_due`

---

## Call Flow Sequence

1. **Inbound Call** → agent answers as Sarah: *"Pixl Lighting, this is Sarah — how can I help you today?"*
2. **First Action** → `get_caller_context` with `{{system__caller_id}}`, spoken filler covering the latency
3. **Context Loaded** → customer name, company, open quotes, open orders, overdue invoices
4. **Intent Read** → Reception node determines Sales, Logistics, Accounting or Escalation
5. **Node Transition** → workflow edge fires; same voice, same conversation, no announced handoff
6. **Specialist Handling** → the node answers using MCP tools under its own guardrails
7. **Subject Change** → backward edges return the caller to Reception and onward to a different node
8. **Call Ends** → only once the caller's question is answered *and* they have said goodbye
9. **Post-Call** → webhook logs transcript and follow-up data to myERP

---

## Cost Profile

Per-minute LLM cost dominates, followed by v3 TTS characters. The four levers that were pulled on 2026-09-14, and why, are documented in the [README](../README.md#cost-controls). The largest single factor was the LLM: the agent had been running `qwen35-397b-a17b` at $0.0105/min, **four times** the cost of the model now in use.

Use the `agents_calculate_llm_usage` endpoint to get live per-minute pricing across all available models before changing the LLM.

### Choosing a model

Price spread is wide and does not track intuition — newer is not cheaper, and a generation's flagship can cost 10× its lite sibling.

| Model | $/min | Note |
|---|---|---|
| `gpt-5-nano` | 0.00070 | Cheapest available; nano-class, expect persona degradation |
| `gemini-2.5-flash` | 0.00199 | *Deprecated — in the API price list but absent from the dashboard* |
| **`qwen36-35b-a3b`** | **0.00250** | **Current.** MoE, ~3B active params — low latency by architecture, not just size |
| `gemini-3.1-flash-lite` | 0.00341 | |
| `gemini-3.5-flash-lite` | 0.00421 | |
| `qwen35-397b-a17b` | 0.01050 | Previous. 17B active params |
| `gemini-3.5-flash` | 0.02043 | 10× the lite variant, ~2× the model that caused the original burn |

**Why `qwen36-35b-a3b`:** it is a mixture-of-experts model with roughly 3B active parameters per token, so latency is low for structural reasons rather than because the model is simply small. It is the same family as the `qwen35-397b-a17b` the system already ran successfully, so tool-calling behaviour across 2–4 chained MCP lookups is known-good. `reasoning_effort` is set to `low` to trim thinking time on voice turns — qwen supports the field, Gemini models reject it.

**Do not pick on headline price alone.** `gpt-5-nano` is 3.5× cheaper again, but nano-class models degrade exactly the things this persona depends on: varied phrasing, audio-tag placement, banned-phrase compliance, and multi-tool chains.
