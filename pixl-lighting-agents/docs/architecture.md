# System Architecture

## Overview

The Pixl Lighting voice agent platform connects ElevenLabs conversational AI agents to the myERP system via MCP (Model Context Protocol). Inbound calls enter an **Orchestrator Agent**, which matches caller ID to the ERP record, identifies the inquiry type, and routes the call to specialized sub-agents.

```
                    INBOUND CALL
                         │
                   Caller ID lookup
             phone number → ERP/CRM record
                         │
               ┌─────────────────────┐
               │ Orchestrator Agent  │
               │ (Main Assistant)    │
               └──────────┬──────────┘
                          │ classifies query
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │   Sales   │    │ Logistics │    │Accounting │
   │   Agent   │    │   Agent   │    │   Agent   │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
               Knowledge base (RAG)
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

| Role | ElevenLabs Label | ID | Responsibility | Key Tools |
|------|------------------|----|----------------|-----------|
| **Orchestrator** | Pixl Lighting — Main Assistant | `agent_9901m25rmysyefva90xs89chy3nd` | Greets caller, matches phone number, identifies query, routes call | `get_caller_context`, `transfer_to_agent`, `find_customer_by_phone`, `find_customer_by_email` |
| **Sales** | Pixl Lighting — Sales & Projects | `agent_7601m27jcm7ten787a5hpz68sz5j` | Quotes, catalogue, pricing, creates new customer records | `list_products`, `get_product`, `list_open_quotes`, `get_quote`, `create_customer`, `create_quote` |
| **Logistics** | Pixl Lighting — Logistics Agent | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` | Order status, delivery schedules, manufacturing/OEM tracking, dispatches | `list_sales_orders`, `get_sales_order`, `list_sales_orders_page`, `get_caller_context` |
| **Accounting** | Pixl Lighting — Accounting | `agent_0101m2fwfttne85stk1hwcjwkzjb` | Invoices, payment allocations, statements of account, billing questions | `list_invoices`, `get_invoice`, `get_caller_context` |

---

## Technical Escalation

For deep electrical and engineering questions (wiring diagrams, driver loads, DMX/DALI protocols, IP ratings compliance), all agents escalate to **Sophia Charles**. Routine questions (pricing, delivery dates, invoices) are never escalated.

---

## Components

### 1. ElevenLabs Voice Agents
- **Platform:** ElevenLabs Conversational AI
- **Model:** V3 Conversational (TTS)
- **Features:** Expressive mode, Focus guardrails, Manipulation guardrails, Loop prevention
- **Voice:** Amber King (external line)
- **Branch:** Main

### 2. MCP Server (Model Context Protocol)
- **URL:** `https://myerp.infinitebarakah.com/api/mcp`
- **Auth:** Bearer token (`mo_...`)
- **Protocol:** JSON-RPC 2.0 over HTTP POST
- **Scope:** Workspace-level (shared across all agents)
- **Tools:** 16 available tools for ERP data access

### 3. myERP System
- **Tenant:** Demo (`myerp.infinitebarakah.com`)
- **Data:** Customers, quotes, orders, invoices, products, tasks, interactions
- **API:** RESTful API with MCP adapter

### 4. Post-Call Webhook & Memory
- **URL:** `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
- **Events:** Transcript, Audio, Call Initiation Failures
- **Auth:** HMAC signing
- **Purpose:** Automatic call logging against customer records so caller history persists across calls.

---

## Call Flow Sequence

1. **Inbound Call** → ElevenLabs Orchestrator picks up
2. **First Action** → `get_caller_context` called with caller's phone number (`{{system__caller_id}}`)
3. **Context Loaded** → Customer name, company, open quotes, open orders, overdue invoices
4. **Classification** → Orchestrator identifies if caller needs Sales, Logistics, or Accounting
5. **Transfer** → `transfer_to_agent` executes with context
6. **Sub-Agent Handles** → Specialist answers questions using MCP tools
7. **Call Ends** → Agent closes warmly
8. **Post-Call** → Webhook logs transcript, audio, and follow-up data to myERP
