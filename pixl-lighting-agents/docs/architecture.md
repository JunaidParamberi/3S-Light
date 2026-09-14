# System Architecture

## Overview

The Pixl Lighting voice agent platform connects ElevenLabs conversational AI agents to the myERP system via MCP (Model Context Protocol), enabling real-time customer data lookup during live phone calls.

## Components

### 1. ElevenLabs Voice Agents
- **Platform:** ElevenLabs Conversational AI
- **Model:** V3 Conversational (TTS) + GPT-5.6 Luna (LLM)
- **Features:** Expressive mode, Focus guardrails, Manipulation guardrails, Loop prevention
- **Voice:** Amber King (Raspy, Authentic and Kind) — shared across external agents
- **Branch:** Each agent has a dedicated branch for configuration management

### 2. MCP Server (Model Context Protocol)
- **URL:** `https://myerp.infinitebarakah.com/api/mcp`
- **Auth:** Bearer token (`mo_...`)
- **Protocol:** JSON-RPC over HTTP
- **Scope:** Workspace-level (shared across all agents)
- **Tools:** 16 available tools for ERP data access

### 3. myERP System
- **Tenant:** Demo (`myerp.infinitebarakah.com`)
- **Login:** `demo@yyzlighting.com`
- **Data:** Customers, quotes, orders, invoices, products, tasks, interactions
- **API:** RESTful API with MCP adapter

### 4. Post-Call Webhook
- **URL:** `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
- **Events:** Transcript, Audio, Call Initiation Failures
- **Auth:** HMAC signing
- **Purpose:** Automatic call logging against customer records

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Caller    │────▶│  ElevenLabs  │────▶│  MCP Server │────▶│  myERP   │
│  (Phone)    │◀────│    Agent     │◀────│  (Adapter)  │◀────│   API    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Post-Call   │
                    │   Webhook    │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  myERP       │
                    │  (Logging)   │
                    └──────────────┘
```

## Call Flow Sequence

1. **Inbound Call** → ElevenLabs picks up
2. **First Message** → Agent greets caller by name (if known)
3. **Mandatory Lookup** → `get_caller_context` called with caller's phone number
4. **Context Loaded** → Customer name, open quotes, open orders, overdue invoices, recent interactions
5. **Conversation** → Agent answers questions, looks up additional data as needed
6. **Guardrails Enforced** → Focus, manipulation protection, data protection
7. **Call Ends** → Agent closes naturally
8. **Post-Call** → Webhook logs transcript, audio, and metadata to myERP

## MCP Tool Registry

All 16 tools available through the MCP server:

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `get_caller_context` | Full caller context (customer, quotes, orders, invoices, tasks) | Read |
| `find_customer_by_phone` | Customer lookup by phone number | Read |
| `find_customer_by_email` | Customer lookup by email address | Read |
| `get_customer_360` | Full customer profile | Read |
| `list_open_quotes` | All open quotes for a customer | Read |
| `get_quote` | Quote details with line items | Read |
| `get_quote_revisions` | Quote revision history | Read |
| `list_sales_orders` | All sales orders for a customer | Read |
| `get_sales_order` | Sales order details | Read |
| `list_sales_orders_page` | Paginated sales orders | Read |
| `list_products` | Product catalogue search | Read |
| `get_product` | Product details (specs, pricing) | Read |
| `list_invoices` | All invoices for a customer | Read |
| `get_invoice` | Invoice details | Read |
| `list_tasks` | Open tasks for a customer | Read |
| `list_interactions` | Recent interaction history | Read |

## Guardrails

### 1. Focus Guardrail
Keeps the agent on-topic and prevents drift into unintended behavior.

### 2. Manipulation Guardrail
Protects against prompt injection and social engineering attacks.

### 3. Content Guardrail (Alpha)
Blocks specific content based on custom criteria.

### 4. Custom Guardrail
Agent-specific rules defined in the system prompt.

## Loop Prevention

Enabled on all agents (PIX-24 fix). Prevents infinite tool-calling loops when:
- MCP returns unexpected data
- Agent gets stuck in a retry pattern
- Tool calls don't resolve the caller's question

## Voice Configuration

| Setting | Value |
|---------|-------|
| Voice Model | V3 Conversational (GA) |
| Expressive Mode | Enabled |
| Stability | Auto-optimized (V3) |
| Similarity | Auto-optimized (V3) |
| Style | Auto-optimized (V3) |
| LLM | GPT-5.6 Luna |

V3 Conversational model automatically optimizes voice settings — no manual tuning required.
