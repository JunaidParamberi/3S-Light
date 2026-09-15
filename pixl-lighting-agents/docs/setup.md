# Setup Guide

## Prerequisites

1. **ElevenLabs Account** — with Conversational AI access
2. **myERP Tenant** — demo (`myerp.infinitebarakah.com`) or production
3. **MCP Server** — myERP MCP server running at `https://myerp.infinitebarakah.com/api/mcp`
4. **Phone Number** — registered on ElevenLabs and assigned to the agent (**still blocked** — zero numbers registered)

---

## Step 1: The Agent

One agent serves all inbound traffic.

| | |
|---|---|
| **Dashboard name** | `Pixl Lighting — Main Assistant` |
| **Agent ID** | `agent_9901m25rmysyefva90xs89chy3nd` |
| **Branch ID** | `agtbrch_3201m25rn01rf789hhvs9sbnpzx9` (this is also `main_branch_id`) |
| **First message** | *"Pixl Lighting, this is Sarah — how can I help you today?"* |

### Model configuration

| Setting | Value | Note |
|---|---|---|
| LLM | `qwen36-35b-a3b` | $0.0025/min |
| Temperature | `0.8` | **Do not set to 0.** Deterministic sampling makes the agent repeat phrasing verbatim. |
| `reasoning_effort` | `low` | Trims thinking time on voice turns. Supported by qwen; must be cleared if ever switching to a Gemini model, which rejects it. |
| TTS | `eleven_v3_conversational` | Expressive Mode on — needed for audio tags |
| Voice | `F89WkXaQbUlVyNvtlD3X` | |
| Max duration | `300` seconds | |

### System prompt

`docs/orchestrator-prompt.md` holds the live base prompt. Every workflow node inherits it and appends its own `additional_prompt`.

Node prompts live **only in the agent config**, not in this repo. `sales-prompt.md`, `logistics-prompt.md` and `accounting-prompt.md` belong to the three dormant agents and are historical.

### Guardrails

Enable on the Guardrails tab: **Focus** and **Prompt injection**.

---

## Step 2: MCP Server

1. Go to **Tools → MCP** on the agent.
2. Ensure `myERP MCP` (`https://myerp.infinitebarakah.com/api/mcp`) is connected — workspace server ID `iRZUVO4FTNPItBWbbmoR`.
3. Verify 16 tools are available (`get_caller_context`, `list_products`, `list_sales_orders`, `list_invoices`, …).

---

## Step 3: Workflow Graph

Routing is the workflow graph, not `transfer_to_agent`. **Do not re-enable `transfer_to_agent`** — it starts a second billed conversation per transfer and splits the prompt source of truth.

Nodes: `start_node` → `reception` → `sales` / `logistics` / `accounting` / `escalation` → `end_node`.

⚠️ **The workflow object is replaced wholesale, not merged.** A partial update containing only the node you want to change is rejected with *"Workflow must contain a start node."* Always send the complete graph — every node and every edge — when editing any part of it.

---

## Step 4: Never-Go-Quiet Fillers

Under **Turn** settings, `soft_timeout_config`:

```json
{
  "timeout_seconds": 2.5,
  "message": "One sec...",
  "additional_soft_timeout_messages": ["Just pulling that up now..."],
  "randomize_fillers": true,
  "max_soft_timeouts_per_generation": 2,
  "disable_until_first_user_message": true
}
```

⚠️ The API **overrides `max_soft_timeouts_per_generation` to the number of filler messages supplied.** Requesting 2 while supplying 6 messages yields 6. To cap at 2, supply exactly 2 messages (`message` + one entry in `additional_soft_timeout_messages`). Each filler is a billed v3 TTS generation.

---

## Step 5: Post-Call Webhook & Memory

1. **Settings → Webhooks**
2. Endpoint: `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
3. Event: `Transcript`
4. Data collection fields: `follow_up_task`, `follow_up_due`

Purpose: ingests transcript, caller ID and follow-up fields into myERP so the customer's history is available on the next call.

---

## Step 6: Publishing

Saving an agent update creates a **new version but does not make it live.** A separate deployment call is required.

```
POST /v1/convai/agents/{agent_id}/deployments
{
  "deployment_request": {
    "requests": [{
      "branch_id": "agtbrch_3201m25rn01rf789hhvs9sbnpzx9",
      "deployment_strategy": { "type": "percentage", "traffic_percentage": 100 }
    }]
  }
}
```

Confirm the response returns `{"traffic_percentage_branch_id_map": {"agtbrch_...": 100}}`.

A percentage below 100 can be used to canary a risky persona change across live traffic.
