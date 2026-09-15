# Entity Relationship Diagram — myERP

## Overview

This document describes the myERP data model as it relates to the voice agents. The agents query these entities through MCP tools to answer caller questions.

---

## Core Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ name                                                            │
│ company                                                         │
│ email                                                           │
│ phone                                                           │
│ address                                                         │
│ created_at                                                      │
│ updated_at                                                      │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│      QUOTE        │  │   SALES_ORDER     │  │     INVOICE       │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤
│ id (PK)           │  │ id (PK)           │  │ id (PK)           │
│ customer_id (FK)  │  │ customer_id (FK)  │  │ customer_id (FK)  │
│ quote_number      │  │ order_number      │  │ invoice_number    │
│ status            │  │ status            │  │ status            │
│ total_amount      │  │ total_amount      │  │ total_amount      │
│ currency          │  │ currency          │  │ currency          │
│ created_at        │  │ created_at        │  │ due_date          │
│ updated_at        │  │ updated_at        │  │ paid_at           │
│                   │  │ oem_ordered_at    │  │                   │
│                   │  │ oem_status        │  │                   │
│                   │  │ esd_date          │  │                   │
└───────┬───────────┘  └───────┬───────────┘  └───────────────────┘
        │                      │
        │ 1:N                  │ 1:N
        ▼                      ▼
┌───────────────────┐  ┌───────────────────┐
│   QUOTE_LINE      │  │ ORDER_LINE        │
├───────────────────┤  ├───────────────────┤
│ id (PK)           │  │ id (PK)           │
│ quote_id (FK)     │  │ order_id (FK)     │
│ product_id (FK)   │  │ product_id (FK)   │
│ quantity          │  │ quantity          │
│ unit_price        │  │ unit_price        │
│ total_price       │  │ total_price       │
│ description       │  │ description       │
└───────────────────┘  └───────────────────┘
```

---

## Product Catalogue

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCT                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ sku                                                             │
│ name                                                            │
│ description                                                     │
│ category                                                        │
│ subcategory                                                     │
│ price                                                           │
│ currency                                                        │
│ color_temperature (e.g., "3000K", "4000K")                     │
│ wattage                                                         │
│ voltage                                                         │
│ ip_rating (e.g., "IP65", "IP20")                               │
│ dimensions                                                      │
│ weight                                                          │
│ in_stock (boolean)                                              │
│ lead_time_days                                                  │
│ created_at                                                      │
│ updated_at                                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Activity Tracking

```
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│    INTERACTION    │  │      TASK         │  │      DEAL         │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤
│ id (PK)           │  │ id (PK)           │  │ id (PK)           │
│ customer_id (FK)  │  │ customer_id (FK)  │  │ customer_id (FK)  │
│ type              │  │ title             │  │ name              │
│ summary           │  │ description       │  │ stage             │
│ direction         │  │ status            │  │ value             │
│ agent_name        │  │ priority          │  │ currency          │
│ transcript        │  │ due_date          │  │ created_at        │
│ duration_seconds  │  │ assigned_to       │  │ updated_at        │
│ created_at        │  │ created_at        │  │                   │
│                   │  │ completed_at      │  │                   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

---

## Manufacturing & Supply Chain

```
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   WORK_ORDER      │  │ PURCHASE_ORDER    │  │   ORDER_LINE      │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤
│ id (PK)           │  │ id (PK)           │  │ id (PK)           │
│ sales_order_id(FK)│  │ supplier_id (FK)  │  │ work_order_id(FK) │
│ status            │  │ status            │  │ product_id (FK)   │
│ quantity          │  │ order_date        │  │ quantity          │
│ start_date        │  │ expected_date     │  │ status            │
│ completion_date   │  │ total_amount      │  │                   │
│ notes             │  │ notes             │  │                   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

---

## Key Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| Customer → Quotes | 1:N | A customer can have many quotes |
| Customer → Orders | 1:N | A customer can have many orders |
| Customer → Invoices | 1:N | A customer can have many invoices |
| Customer → Tasks | 1:N | A customer can have many tasks |
| Customer → Interactions | 1:N | A customer can have many interactions |
| Customer → Deals | 1:N | A customer can have many deals |
| Quote → Quote Lines | 1:N | A quote has many line items |
| Order → Order Lines | 1:N | An order has many line items |
| Order → Work Orders | 1:N | An order can generate work orders |
| Work Order → Purchase Orders | 1:N | Work orders trigger POs |
| Product → Quote Lines | 1:N | A product appears on many quotes |
| Product → Order Lines | 1:N | A product appears on many orders |

---

## Important Fields for Voice Agents

### Quote Status Values
- `draft` — Being prepared
- `sent` — Sent to customer
- `accepted` — Customer accepted
- `rejected` — Customer rejected
- `expired` — Validity period passed
- `converted` — Converted to sales order

### Sales Order Status Values
- `confirmed` — Order confirmed
- `in_production` — Being manufactured ⚠️ (see PIX-20 bug)
- `shipped` — On its way
- `delivered` — Received by customer
- `cancelled` — Order cancelled

### Invoice Status Values
- `draft` — Being prepared
- `sent` — Sent to customer
- `paid` — Payment received
- `overdue` — Past due date
- `partial` — Partial payment received

### OEM Fields (Critical for Guardrails)
- `oem_ordered_at` — When the supplier order was placed
- `oem_status` — Status of the supplier order
- `esd_date` — Estimated ship date (INTERNAL USE ONLY)

**Guardrail:** If `oem_ordered_at` is null, the supplier order has NOT been placed — regardless of what the internal status says.

---

## Phone Matching

Phone matching uses the **last 10 digits** of the phone number. This means:
- Country codes don't matter
- Formatting differences don't matter
- `+1 416 555 0101` matches `4165550101` matches `(416) 555-0101`

The agent should never ask a caller to "repeat your number in a different format."

---

## Data Access Patterns

### What Each Workflow Node Uses

Access is no longer split per agent — one agent holds the workspace MCP connection, and every node reads through it. The table below is which entities each node actually touches.

| Entity | Reception | Sales | Logistics | Accounting |
|--------|-----------|-------|-----------|------------|
| Customer | Read | Read | Read | Read |
| Quote | — | Read | — | — |
| Sales Order | — | — | Read | — |
| Invoice | — | — | — | Read |
| Product | — | Read | — | — |
| Task | via webhook only | via webhook only | via webhook only | via webhook only |
| Interaction | via webhook only | via webhook only | via webhook only | via webhook only |

**There is no write access at all.** The MCP server exposes 16 tools and every one is read-only — no `create_customer`, `create_quote`, `create_interaction` or `create_task` exists (see [erp-fixes.md](erp-fixes.md#e-10)). Task and Interaction rows can only be written by the post-call webhook, which is not currently landing (E-9). Quote creation, order conversion and invoice issuing remain human-only by design.
| Materials | — | — | — | Read |
