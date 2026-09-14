# Setup Guide

## Prerequisites

1. **ElevenLabs Account** — With Conversational AI and Agent Transfer access
2. **myERP Tenant** — Demo (`myerp.infinitebarakah.com`) or production
3. **MCP Server** — myERP MCP server running at `https://myerp.infinitebarakah.com/api/mcp`
4. **Phone Number** — Registered on ElevenLabs and assigned to Orchestrator (blocked)

---

## Step 1: ElevenLabs Agent Architecture Setup

The system consists of 1 Orchestrator and 3 Department Sub-Agents:

| Role | ElevenLabs Dashboard Name | ElevenLabs Agent ID | First Message |
|---|---|---|---|
| **Orchestrator** | `Pixl Lighting — Main Assistant` | `agent_9901m25rmysyefva90xs89chy3nd` | *"Pixl Lighting, how can I direct your call today?"* |
| **Sales** | `Pixl Lighting — Sales & Projects` | `agent_7601m27jcm7ten787a5hpz68sz5j` | *"Pixl Lighting, how can I help you today?"* |
| **Logistics** | `Pixl Lighting — Logistics Agent` | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` | *"Pixl Lighting, how can I help you today?"* |
| **Accounting** | `Pixl Lighting — Accounting` | `agent_0101m2fwfttne85stk1hwcjwkzjb` | *"Pixl Lighting, how can I help you today?"* |

### Voice Configuration
- **Model:** Amber King (Raspy, Authentic and Kind)
- **TTS:** V3 Conversational
- **Expressive Mode:** Enabled

### System Prompts
- Orchestrator: `docs/orchestrator-prompt.md`
- Sales: `docs/sales-prompt.md`
- Logistics: `docs/logistics-prompt.md`
- Accounting: `docs/accounting-prompt.md`

### Enable Guardrails
1. Go to Guardrails tab on each agent.
2. Enable **Focus** guardrail.
3. Enable **Manipulation** guardrail.
4. Enable **Loop Prevention** toggle.

---

## Step 2: MCP Server Configuration

All agents connect to the workspace-level `myERP MCP` server:

1. Go to agent's **Tools → MCP** tab.
2. Ensure `myERP MCP` (`https://myerp.infinitebarakah.com/api/mcp`) is connected.
3. Verify 16 tools are available (`get_caller_context`, `list_products`, `list_sales_orders`, `list_invoices`, etc.).
4. Verify authentication token `mo_KkDGxbeU9rkkifrbrrbYqDBca5TvDmKpDvXtHrSnhok`.

---

## Step 3: Configure Orchestrator `transfer_to_agent`

On the Orchestrator (`agent_9901m25rmysyefva90xs89chy3nd`):

1. Go to **Tools** tab.
2. Enable **Transfer to agent** system tool.
3. Switch to JSON Mode and configure the transfers:
   - Target 1: `agent_7601m27jcm7ten787a5hpz68sz5j` (Sales)
   - Target 2: `agent_1001m27jcfqnf3mb6jzszw3w3xf0` (Logistics)
   - Target 3: `agent_0101m2fwfttne85stk1hwcjwkzjb` (Accounting)
4. Save and Publish to Main.

---

## Step 4: Post-Call Webhook & Memory

Ensure the workspace webhook is active:

1. Go to ElevenLabs **Settings → Webhooks** (or Developer Webhooks).
2. Endpoint: `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
3. Events subscribed:
   - `Transcript` ✅
   - `Audio` ✅
   - `Call Initiation Failures` ✅
4. Purpose: Ingests the call transcript, caller ID, and follow-up data collection fields into myERP so the customer's history is immediately retrieved on subsequent calls.

---

## Step 5: Publishing

1. Ensure all changes on each agent's branch are tested.
2. Click **Publish** → Confirm.
3. Verify all agents show **Main** branch active.
