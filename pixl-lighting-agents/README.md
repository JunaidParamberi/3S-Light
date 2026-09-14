# 3S Light — Pixl Lighting Voice Agent Platform

> AI-powered voice agent system for Pixl Lighting's inbound call handling, built on ElevenLabs Conversational AI and integrated with myERP via Model Context Protocol (MCP).

## What This Is

An inbound voice system structured on an **Orchestrator → Sub-Agents** architecture. Inbound calls are answered by an Orchestrator that identifies the caller, classifies their inquiry, and transfers them to one of three specialized department sub-agents: Sales, Logistics, or Accounting.

The agents speak as **one unified company voice ("Pixl Lighting")** with senior client specialist personas. They never use personal names, never call themselves "receptionists", eliminate robotic search phrases, and maintain conversational presence while querying myERP. Every call is logged into the ERP so caller context and memory persist across calls.

---

## Architecture at a Glance

```
                    INBOUND CALL
                         │
                   Caller ID lookup
             phone number → ERP/CRM record
                         │
               ┌─────────────────────┐
               │ Orchestrator Agent  │  (Pixl Lighting — Main Assistant)
               │ (agent_9901m25...)  │
               └──────────┬──────────┘
                          │ transfer_to_agent
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │   Sales   │    │ Logistics │    │Accounting │
   │   Agent   │    │   Agent   │    │   Agent   │
   │(agent_760)│    │(agent_100)│    │(agent_010)│
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
               Knowledge Base (RAG)
             data sheets & wiring specs
                          │ (unresolved technical)
                          ↓
               Escalate: Sophia Charles
                          │
         ERP Backbone (myERP MCP Server)
      orders · quotes · inventory · invoices
```

---

## The Agents

| Role | ElevenLabs Dashboard Name | ElevenLabs Agent ID | Responsibility | Key Tools |
|---|---|---|---|---|
| **Orchestrator** | `Pixl Lighting — Main Assistant` | `agent_9901m25rmysyefva90xs89chy3nd` | Identifies caller, classifies query, transfers to department | `get_caller_context`, `transfer_to_agent`, `find_customer_by_phone`, `find_customer_by_email` |
| **Sales** | `Pixl Lighting — Sales & Projects` | `agent_7601m27jcm7ten787a5hpz68sz5j` | Quotes, catalogue, pricing, onboarding new customer records | `list_products`, `get_product`, `list_open_quotes`, `get_quote`, `create_customer`, `create_quote` |
| **Logistics** | `Pixl Lighting — Logistics Agent` | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` | Order status, delivery schedules, manufacturing/OEM tracking | `list_sales_orders`, `get_sales_order`, `list_sales_orders_page`, `get_caller_context` |
| **Accounting** | `Pixl Lighting — Accounting` | `agent_0101m2fwfttne85stk1hwcjwkzjb` | Invoices, payment allocations, statements, wire instructions | `list_invoices`, `get_invoice`, `get_caller_context` |

*Note: The internal staff line (formerly Jordan) was deleted as internal team members query myERP directly.*

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
- **[Missing Tool Specification](docs/find-customer-by-company-spec.md)** — `find_customer_by_company` tool spec for myERP team

---

## Environment

- **ERP:** myERP (demo tenant at `myerp.infinitebarakah.com`)
- **Voice Platform:** ElevenLabs Conversational AI
- **Voice Model:** Amber King (Raspy, Authentic and Kind) on V3 Conversational
- **MCP Server:** `https://myerp.infinitebarakah.com/api/mcp`
- **Post-Call Webhook:** `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
