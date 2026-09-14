# Call Workflows

## Overview

This document describes the call flows for all four voice agents, including routing logic, escalation paths, and edge case handling.

---

## Universal Call Flow

Every inbound call follows this sequence:

```
1. Caller dials Pixl Lighting
2. ElevenLabs agent picks up
3. Agent delivers first message (name + greeting)
4. Agent calls get_caller_context(phone=caller_id)
5. System returns:
   - matched: true/false
   - customer name, company
   - open quotes
   - open orders
   - overdue invoices
   - open tasks
   - last 5 interactions
6. If matched: greet by name, answer their question
7. If unmatched: collect name, company, what they need
8. Conversation continues with additional tool calls as needed
9. Call ends naturally when caller says goodbye
10. Post-call webhook logs everything to myERP
```

---

## Agent 1 — Maya (Receptionist) Call Flow

### Inbound Call Handling

```
Caller connects
    │
    ▼
Maya: "Pixl Lighting, Maya speaking."
    │
    ▼
get_caller_context(phone=caller_id)
    │
    ├── matched: true
    │   │
    │   ▼
    │   Greet by name: "Hey [Name], what's up?"
    │   │
    │   ├── Caller asks about quote
    │   │   └── If 1 open quote → answer directly
    │   │   └── If multiple → ask which one
    │   │
    │   ├── Caller asks about order
    │   │   └── If 1 open order → answer directly
    │   │   └── If multiple → ask which one
    │   │
    │   ├── Caller asks about invoice
    │   │   └── list_invoices → get_invoice
    │   │
    │   ├── Caller asks about product
    │   │   └── list_products → get_product
    │   │
    │   ├── Caller has technical question
    │   │   └── Escalate to Sophia Charles
    │   │
    │   └── Caller wants to place order / convert quote
    │       └── "That's a human decision — I'll have someone follow up"
    │
    └── matched: false
        │
        ▼
        "I don't have you in the system — what's your name and company?"
        │
        ▼
        Collect details, take message
        │
        ▼
        "Got it, I'll pass that along."
```

### Product Question Flow

```
Caller: "Do you carry [product]?"
    │
    ▼
list_products(search=term)
    │
    ├── Results found
    │   └── get_product(id=match)
    │       └── Read specs, pricing, availability
    │
    └── No results
        │
        ▼
        Try shorter/simpler term
        │
        ├── Results found → answer
        │
        └── Still empty
            │
            ▼
            "I can't find it in front of me — let me have someone confirm
             rather than get it wrong. I'll take the details."
```

### Order Status Flow

```
Caller: "Where's my order?"
    │
    ▼
get_caller_context → find open orders
    │
    ├── 1 order open
    │   └── get_sales_order(id=order_id)
    │       │
    │       ├── oem_ordered_at is empty OR oem_status is empty
    │       │   └── "It's being processed — someone will confirm when it's ordered."
    │       │       (NEVER say "in production" or "on its way")
    │       │
    │       └── oem_ordered_at is set
    │           └── Read status honestly
    │
    └── Multiple orders
        └── "Which order are you asking about?"
```

### Invoice Flow

```
Caller: "I got an invoice — what's the status?"
    │
    ▼
list_invoices → find matching invoice
    │
    ├── Found
    │   └── get_invoice(id=invoice_id)
    │       └── Read amount, due date, status
    │
    └── Not found
        └── "I don't see that one in front of me — can you read me the number?"
```

### Escalation Flow

```
Technical question (wiring, specs, drivers, IP ratings, dimming)
    │
    ▼
"I'll connect you with Sophia — she handles the technical side."
    │
    ▼
transfer_to_number (Sophia's direct line)
```

**Note:** Order status, invoices, prices, delivery dates, angry callers — none of these are escalations. Maya handles them herself.

### Call Ending Flow

```
Caller: "That's all, thanks" / "Just wanted to check" / "Thanks, bye"
    │
    ▼
Maya: "Take care." / "Bye." / "Have a good one."
    │
    ▼
end_call
```

**Rules:**
- Never let a payment reminder be the last thing they hear
- Never end a call while caller still has an unanswered question
- Don't start a new topic when they're wrapping up

---

## Agent 2 — Claire (Call Logging) Flow

Same as Maya, with these additions:

1. After answering the question, Claire may ask: "Want me to set a follow-up for that?"
2. If yes, she populates `follow_up_task` and `follow_up_due`
3. The post-call webhook automatically logs the transcript against the customer
4. Claire can log additional notes via `log_interaction` if available

---

## Agent 3 — Rachel (Sales) Flow

### Sales-Specific Call Flow

```
Caller connects
    │
    ▼
Rachel: "Pixl Lighting, this is Rachel — give me one sec, I'll pull you up."
    │
    ▼
get_caller_context(phone=caller_id)
    │
    ├── New customer
    │   │
    │   ▼
    │   create_customer(name, company, email, phone)
    │   │
    │   ▼
    │   "Got you set up — what can I help with?"
    │
    └── Existing customer
        │
        ▼
        Standard lookup + sales actions
```

### Quote Creation Flow

```
Caller: "I need a quote for [products]"
    │
    ▼
list_products → find matching products
    │
    ▼
create_quote(customer_id, line_items)
    │
    ▼
"I'll get that quote over to you — [quote number]. Anything else?"
```

### Deal Management Flow

```
Caller: "I want to move forward on that deal"
    │
    ▼
get_caller_context → find open deals
    │
    ▼
update_deal_stage(deal_id, new_stage)
    │
    ▼
"Done — I've moved it to [stage]. Want me to do anything else?"
```

### Rachel's Guardrails

- **Cannot** convert quotes to orders (human decision)
- **Cannot** create sales orders (human decision)
- **Cannot** issue invoices (human decision)
- **Can** create customers, quotes, deals, tasks, log interactions

---

## Agent 4 — Jordan (Internal) Flow

### Internal Call Flow

```
Staff member connects
    │
    ▼
Jordan: "Pixl internal — go ahead."
    │
    ▼
Staff member states what they need
    │
    ├── "What's the pipeline look like?"
    │   └── get_pipeline_summary
    │
    ├── "Any overdue invoices?"
    │   └── get_my_overdue
    │
    ├── "What's the status on order [code]?"
    │   └── get_sales_order(code)
    │       └── Read code in FULL: "V-S-O twenty twenty-six, oh oh oh one"
    │
    ├── "How are materials looking?"
    │   └── get_material_requirements
    │
    └── "What's on the reorder report?"
        └── get_reorder_report
```

### Jordan's Speech Pattern
- Reads codes in FULL (staff write them down)
- No pleasantries, no small talk
- Answers and stops talking
- Matches the staff member's energy

---

## Backward Routing (Subject Changes)

The workflow graph allows callers to change subject mid-call:

```
Reception → Logistics
Reception → Accounting
Reception → Sales
Logistics → Reception (back)
Accounting → Reception (back)
Sales → Reception (back)
Any → Escalation (if needed)
```

**Backward conditions** allow the caller to switch topics and return to where they were. This was the source of bugs PIX-19 through PIX-24, which have been resolved with loop prevention and better routing logic.

---

## Edge Cases

### Unknown Caller
- `matched: false` → collect name, company, what they need
- Never invent a customer, quote, or order number
- Take details and say someone will follow up

### Multiple Open Items
- Only ask "which one?" when there genuinely are several
- If only one open, name it directly — don't ask

### Caller Asks for Something Agent Can't Do
- "I can't change that record, but I'll pass your details along"
- "That's a human decision — I'll have someone follow up"
- Never end the call by escalating something the agent could answer

### Caller Is Upset
- Don't repeat the same answer harder
- Say what you're seeing, then offer a different route
- "I hear you — let me see what I can do"
- Never give the same answer twice in the same words

### Product Not Found
- Try a shorter, simpler search term
- If still empty: "I can't find it in front of me — let me have someone confirm"
- Never say Pixl doesn't carry something on the strength of an empty search

### Order Status Bug (PIX-20)
- myERP UI shows "In Production" but `oem_ordered_at: null`
- Agent must say "being processed" — never "in production"
- This is a myERP UI bug, not an agent issue
