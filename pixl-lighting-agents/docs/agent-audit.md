# Agent Audit — September 14, 2026

> **Historical snapshot — superseded.** This audit describes the four-agent `transfer_to_agent` architecture as it stood earlier on 2026-09-14. Later the same day the system was collapsed to a single agent with a workflow graph, and `transfer_to_agent` was removed. The three sub-agents below are now dormant. For live state see [agents.md](agents.md) and [workflows.md](workflows.md). Kept for the audit trail, not as a reference.

## Summary

| Role | ElevenLabs Dashboard Name | ID | Status | Focus Area |
|---|---|---|---|---|
| **Orchestrator** | `Pixl Lighting — Main Assistant` | `agent_9901m25rmysyefva90xs89chy3nd` | ✅ Active (Main) | Caller lookup & transfer via `transfer_to_agent` |
| **Sales Sub-Agent** | `Pixl Lighting — Sales & Projects` | `agent_7601m27jcm7ten787a5hpz68sz5j` | ✅ Active (Main) | Quotes, catalogue, lead creation |
| **Logistics Sub-Agent** | `Pixl Lighting — Logistics Agent` | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` | ✅ Active (Main) | Orders, manufacturing status, dispatch tracking |
| **Accounting Sub-Agent** | `Pixl Lighting — Accounting` | `agent_0101m2fwfttne85stk1hwcjwkzjb` | ✅ Active (Main) | Invoices, payment history, account statements |

*Note: Jordan (internal staff assistant) was deleted — internal staff query myERP directly.*

---

## 1. Orchestrator (`agent_9901m25rmysyefva90xs89chy3nd`)
- **First Message:** *"Pixl Lighting, how can I direct your call today?"*
- **Mandatory Lookup:** Calls `get_caller_context` with `{{system__caller_id}}`.
- **System Tool:** `transfer_to_agent` active with routing conditions to Sales, Logistics, and Accounting.
- **Guardrails:** Does not answer substantive questions itself; transfers immediately once query is classified.

---

## 2. Sales Sub-Agent (`agent_7601m27jcm7ten787a5hpz68sz5j`)
- **First Message:** *"Pixl Lighting, how can I help you today?"*
- **Tools:** `list_products`, `get_product`, `list_open_quotes`, `get_quote`, `create_customer`, `create_quote`, `create_deal`.
- **Guardrail:** Cannot convert quote to sales order or issue invoice (human-only).
- **Tone:** Senior client specialist; personal ownership ("I'll follow up with you directly").

---

## 3. Logistics Sub-Agent (`agent_1001m27jcfqnf3mb6jzszw3w3xf0`)
- **First Message:** *"Pixl Lighting, how can I help you today?"*
- **Tools:** `list_sales_orders`, `get_sales_order`, `list_sales_orders_page`, `get_caller_context`.
- **Guardrail:** Never confirms unplaced supplier orders (`oem_ordered_at` / `oem_status` check).
- **Guardrail:** Never says estimated ship dates (`esd_date`) out loud.
- **Guardrail:** Delays > 2 weeks follow up in writing.

---

## 4. Accounting Sub-Agent (`agent_0101m2fwfttne85stk1hwcjwkzjb`)
- **First Message:** *"Pixl Lighting, how can I help you today?"*
- **MCP Server:** Connected to `myERP MCP`.
- **Tools:** `list_invoices`, `get_invoice`, `get_caller_context`.
- **Guardrail:** Never collects payment card details over the phone. Wire and payment links sent in writing.
