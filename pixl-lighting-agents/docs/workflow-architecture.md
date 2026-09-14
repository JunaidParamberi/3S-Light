# Voice Agent Mental Model

Source: Claude artifact — working synthesis of meeting transcript

## The System, End to End

One backbone, two call directions. Inbound routes and answers; outbound triggers on schedule and stops itself.

```
                    INBOUND
                        │
                  Inbound call
                  customer or agent
                        │
                  Caller ID lookup
                  phone number → ERP/CRM record
                        │
                  Orchestrator agent
                  classifies query type
                  ≈90–95% of inbound calls: agents asking product info or order status
                        │
            ┌───────────┼───────────┐
            ↓           ↓           ↓
      Sales agent  Logistics   Accounting
                    agent       agent
            │           │           │
            └───────────┼───────────┘
                        │
              Knowledge base — vectorized docs
              data sheets, wiring diagrams (RAG retrieval)
                        │
                  no answer →
                  escalate: Sophia Charles
                        │
              ERP + CRM — shared backbone
              orders · delivery status · comms history · shared mailbox

                    OUTBOUND
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
  Invoice aging    Shipment created   Supplier price/order
  (AR)                                 
        ↓               ↓               ↓
  Payment follow-up  Automated email  Manual — Sujit
  agent              + tracking #     email / WeChat, not voice
  up to 3 calls:     sent immediately future automation candidate
  day 10, +5d, +5d   on ship          phase 3, not yet scoped
  then stops
  polite, non-aggressive tone
```

## Inbound: Identify, Then Route

Most inbound volume is narrow and repeatable — which is exactly what makes it automatable first.

- **90–95%** of inbound calls are agents, asking product info or order status
- **3** sub-agents: sales, logistics, accounting — direct-line feel, orchestrator underneath
- **1** human fallback for technical questions: Sophia Charles

Caller identification is the hinge: matching the inbound number to a company or agent record in the ERP/CRM is what turns a cold call into a personalized one, and it's what lets the orchestrator route without asking "who is this and what do you need" every time.

New-product questions (not in the existing catalog) don't get answered live — they're pushed to an email follow-up on purpose, so there's a written record of anything non-standard.

## Outbound: Three Narrow Jobs

Outbound is scoped tighter than inbound on purpose — it starts only after the inbound agent and its knowledge base are stable.

| Trigger | Action | Cadence / limit | Status |
|---------|--------|-----------------|--------|
| Invoice aging | Payment follow-up call | day 10 → +5d → +5d, then stop | phase 2 |
| Shipment created | Automated email + tracking # | immediate, no call | ERP logistics module |
| Delivery delay > 2 weeks | Email, not a call | written notice only | rule, not a feature |
| Supplier price / order | Manual — Sujit, email/WeChat | as needed | future automation |

## Guardrails

The rules that keep the agent from saying something the company can't stand behind.

1. **No premature disclosure** — Never confirm an order to a client if the supplier order hasn't actually been placed yet.
2. **Confirmed dates only** — Delivery commitments are only relayed once they're confirmed — not estimated out loud.
3. **Delay escalation path** — Variance over two weeks moves to email, specifically to avoid a verbal promise that turns out wrong.
4. **Follow-up fatigue cap** — Payment calls stop after three attempts regardless of whether the invoice is paid.

## Build Sequence & Owners

| Owner | Item | When |
|-------|------|------|
| Shameer | Update MCP documentation with ERP + voice agent workflow details | — |
| Shameer | Set up Canadian phone number in 11Labs | Friday |
| Chris | Hand off technical escalation to Sophia Charles; get KB docs uploaded & vectorized in 11Labs | — |
| Team | Stand up shared customer-support mailbox | — |
| Team | Pick a CRM path — 3S's CRM vs. a free tool vs. building the module into the ERP | — |
| Team | Write the explicit ERP rules for order-status and delivery-date disclosure | — |
| Sajit | Document the current supplier communication workflow | — |

## To Get Ahead of

Not decided in the meeting — worth having a point of view on before he asks.

1. **CRM decision** — 3S's CRM, a free tool, or a module built into the ERP? This decides the whole integration shape — a bolt-on CRM means a sync layer; a built-in module means the ERP schema changes.

2. **Catalog boundary** — Where exactly is the line between "existing catalog" and "new product equivalent"? The whole inbound routing logic (answer live vs. push to email) hinges on this distinction, and it wasn't precisely defined.

3. **Escalation logging** — What does an escalation to Sophia Charles actually write back to the KB? The plan says escalations improve future training — but there's no stated mechanism for turning a resolved human call into a new KB entry.

4. **Multi-channel sequencing** — WhatsApp, WeChat, and Teams are deprioritized for now — but supplier contact today is mostly WeChat. If supplier automation is "phase 3," it may need WeChat before phone/email.

5. **QA before go-live** — No mention yet of how the voice agent gets tested against real call patterns before it's live on a real number. Worth proposing a short test script before the Canadian number goes live Friday.

---

*Source: voice-agent-mental-model · junaid · draft for internal thinking*
