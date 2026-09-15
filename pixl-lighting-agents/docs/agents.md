# Agent Profile

## Overview

The Pixl Lighting inbound system runs on **one** ElevenLabs agent presenting a single named persona. What were previously four agents are now five conversational modes (workflow nodes) inside that one agent. See [workflows.md](workflows.md#why-one-agent-not-four) for why this changed.

---

## The agent

**Name:** `Pixl Lighting — Main Assistant`
**ID:** `agent_9901m25rmysyefva90xs89chy3nd`
**Branch:** Main
**Persona:** Sarah
**First message:** *"Pixl Lighting, this is Sarah — how can I help you today?"*

### Configuration

| Setting | Value |
|---|---|
| LLM | `qwen36-35b-a3b` |
| Temperature | 0.8 |
| `reasoning_effort` | `low` (qwen supports it; Gemini models reject it) |
| TTS | `eleven_v3_conversational`, Expressive Mode on |
| Voice | `F89WkXaQbUlVyNvtlD3X` |
| System tools | `end_call` only |
| MCP | workspace server `iRZUVO4FTNPItBWbbmoR` |
| Max call duration | 300s |
| Soft-timeout fillers | 2, at 2.5s |
| Guardrails | Focus ✅ · Prompt injection ✅ |
| Data collection | `follow_up_task`, `follow_up_due` |
| Webhook | Transcript → myERP |

**Temperature is load-bearing.** At the previous value of 0 the model sampled deterministically and repeated the same sentence verbatim whenever a caller asked the same thing twice — most visibly producing the identical identity deflection five times in one call. The varied phrasing banks in the prompt only work above 0.

---

## Persona rules

These live in the base prompt and therefore bind in every node.

### Identity
Presents as a real member of the team. Never says AI, bot, assistant, system, voice agent, or program — regardless of how the caller asks or how often. Deflections rotate through six warm variants using `[laughs]` / `[chuckles]` audio tags, and repeating one within a call is explicitly forbidden. Harmless personal questions get a light human answer rather than a refusal; "I don't share personal background" is a banned phrase because it reads as machine.

### Personal ownership
Every promise is first-person. Banned: "the team will get back to you", "our team will check", "someone will follow up", "I'll pass your details along". Required: "I'll check that and come back to you today", "Leave it with me". The single exception is **Sophia Charles** — naming a real individual is fine; a vague "team" is not.

### Never go quiet
A spoken filler precedes every tool call — caller lookups and order lookups as much as catalogue searches. Backed at platform level by `soft_timeout_config`, which speaks after 2.5s of silence even if the model stays quiet.

### Banned phrases
Anything exposing internal mechanics: "let me try a simpler/broader/different search", "no results with those search terms", "the system isn't finding it", "I don't have access to", "I'm unable to". An empty result is reported the way a person would report it, and never ends the call.

---

## Node summary

| Node | Responsibility | Hard guardrail |
|---|---|---|
| **Reception** | Caller ID, intent, routing | Doesn't read order details or dates |
| **Sales** | Catalogue, pricing, quotes, onboarding | Never improvises a spec, price, or lead time; off-catalogue goes to email |
| **Logistics** | Order status, dispatch, OEM tracking | `esd_date` never spoken; blank `oem_*` ⇒ "being processed" |
| **Accounting** | Invoices, balances, payments, statements | Never collects card details by phone |
| **Escalation** | Technical detail | Never guesses; hands to Sophia Charles |

---

## Dormant agents

Still published, receiving no traffic since `transfer_to_agent` was removed. Their prompt files in this repo describe behaviour that is **no longer live**.

| Name | ID |
|---|---|
| `Pixl Lighting — Sales & Projects` | `agent_7601m27jcm7ten787a5hpz68sz5j` |
| `Pixl Lighting — Logistics Agent` | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` |
| `Pixl Lighting — Accounting` | `agent_0101m2fwfttne85stk1hwcjwkzjb` |

Note the Accounting agent was configured with a different voice (`cjVigY5qzO86Huf0OWal`) to the other three — worth knowing if it is ever brought back into service.
