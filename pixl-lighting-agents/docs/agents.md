# Agent Profiles

## Overview

The Pixl Lighting inbound system is built on an **Orchestrator → Sub-Agent** architecture matching the system mental model. Inbound calls are answered by the Orchestrator, which identifies the caller, determines the inquiry type, and transfers them to the appropriate specialized sub-agent.

---

## 1. Orchestrator — "Pixl Lighting — Main Assistant"

**Role:** Main line receptionist/router. Greets caller, matches phone number to myERP, identifies query type, and executes warm transfer to the specialized department.

**ElevenLabs ID:** `agent_9901m25rmysyefva90xs89chy3nd`  
**Branch:** Main

### Responsibilities
- Immediate caller identification via `get_caller_context`
- Fallback lookups via `find_customer_by_phone` or `find_customer_by_email`
- Classify inquiry: Sales, Logistics, or Accounting
- Transfer using `transfer_to_agent` system tool

### First Message
> "Pixl Lighting, how can I direct your call today?"

---

## 2. Sub-Agent: Sales — "Pixl Lighting — Sales & Projects"

**Role:** Sales-focused specialist with write access. Handles quotes, catalogue pricing, and new customer account creation.

**ElevenLabs ID:** `agent_7601m27jcm7ten787a5hpz68sz5j`  
**Branch:** Main

### Responsibilities
- Search product catalogue (`list_products`, `get_product`)
- Handle open quotes (`list_open_quotes`, `get_quote`, `create_quote`, `update_quote`)
- Onboard new leads on the call (`create_customer`)
- Guardrail: Cannot convert quotes to orders or issue invoices (human-only)

### First Message
> "Pixl Lighting, how can I help you today?"

---

## 3. Sub-Agent: Logistics — "Pixl Lighting — Logistics Agent"

**Role:** Order fulfilment and dispatch specialist. Handles all delivery, shipping, and manufacturing tracking.

**ElevenLabs ID:** `agent_1001m27jcfqnf3mb6jzszw3w3xf0`  
**Branch:** Main

### Responsibilities
- Order status & line items (`list_sales_orders`, `get_sales_order`)
- Supplier manufacturing status (`oem_ordered_at`, `oem_status`)
- Guardrail: Never confirm unplaced supplier orders
- Guardrail: Never say estimated ship dates (`esd_date`) out loud
- Guardrail: Delays over 2 weeks follow up in writing

### First Message
> "Pixl Lighting, how can I help you today?"

---

## 4. Sub-Agent: Accounting — "Pixl Lighting — Accounting"

**Role:** Invoicing and receivables specialist. Handles all payment status, invoice balances, and statements.

**ElevenLabs ID:** `agent_0101m2fwfttne85stk1hwcjwkzjb`  
**Branch:** Main

### Responsibilities
- Invoice lookups (`list_invoices`, `get_invoice`)
- Payment history and allocations
- Send formal statements and payment links in writing
- Guardrail: Never collect credit card details over the phone

### First Message
> "Pixl Lighting, how can I help you today?"

---

## Technical Escalation
All agents escalate technical engineering questions (wiring diagrams, driver loads, DMX/DALI, IP ratings) to **Sophia Charles**. Routine questions are never escalated.
