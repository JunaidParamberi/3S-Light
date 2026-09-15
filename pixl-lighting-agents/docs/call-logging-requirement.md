# 📞 Call Logging Requirement — Voice Agent (for ERP Team)

## The goal

Every call made to Pixl Lighting gets logged, so that the next time the same customer calls, the agent knows who they are and remembers what was discussed.

**First call → unknown customer**

```
Customer calls (first time ever)
   ↓
Sarah answers: "Pixl Lighting, this is Sarah..."
   ↓
No match in the system → agent collects details
   (name / company / phone / email / what they need)
   ↓
Call ends → interaction is saved to myERP:
   • phone number
   • customer details
   • summary of the call
   • follow-up task if something was promised
```

**Second call → same customer, next week**

```
Same number calls again
   ↓
Agent looks up the number → MATCH ✅
   ↓
Agent can see: last call + what was discussed + open follow-up
   ↓
"Welcome back! I see we were working on a quote for the Birchen 40W
units — still need that confirmation?"
```

The customer feels remembered. Caller context and memory persist across calls.

---

## What's needed from the ERP/myERP team

### 1. `create_interaction` — log every call (BLOCKER)

One row per call, written after each call ends (before the next call starts).

| Field | Notes |
|-------|-------|
| `customerId` | from caller lookup; nullable when caller is unknown |
| `contactId` | which contact was on the line, when known |
| `type` | `voice_call` |
| `direction` | `inbound` |
| `occurredAt` | ISO 8601 timestamp |
| `summary` | short summary of what was discussed |
| `externalRef` | the ElevenLabs `conversation_id` (idempotency + transcript lookup) |
| `phone` | raw caller ID — **unknown callers are still recorded** |

### 2. `create_task` — save follow-ups

For the `follow_up_task` / `follow_up_due` fields the agent already collects ("Send verified dispatch information for order VSO-2026-0001 in writing").

### 3. `create_customer` — register brand-new customers

A new caller has no record yet. To "remember" them on the next call, the system needs to be able to create a customer record (from the details collected on the first call) so the second call finds them.

### 4. Fix the post-call webhook (current calls are NOT being logged)

ElevenLabs is sending transcripts + follow-up fields, but **nothing appears on the customer record in myERP**. Needs to be checked:

1. HMAC signature — the registered key may need the `wsec_…` webhook secret field populated
2. myERP **Audit Log** (`Settings → Defaults & Customization → Audit Log`) — confirms whether deliveries are arriving and being rejected

---

## Why this matters

Without call logging:

- Every caller is greeted as if it were their first call — even return customers
- Follow-ups live only in transcripts nobody reads, so promised actions are never actioned
- Nobody can see how many times a customer called, or about what

With it:

- The agent starts each call knowing the customer, their history, and open promises
- Follow-ups become real tasks in the ERP
- Call history is visible to the whole team

---

**Priority:** 🔴 **Blocker** — call logging is a core requirement for go-live.