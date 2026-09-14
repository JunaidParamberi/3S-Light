# Agent Audit — September 14, 2026

## Summary

| Agent | Name | Status | Critical Issues |
|-------|------|--------|-----------------|
| 1 | Maya | ✅ Updated | None (fixed today) |
| 2 | Claire | ✅ Updated | None (fixed today) |
| 3 | Rachel | ✅ Updated | None (fixed today) |
| 4 | Jordan | ✅ Updated | None (fixed today) |

---

## Agent 1 — Maya (Inbound Receptionist)

**Status:** ✅ Updated today  
**System Prompt Length:** ~8,000 chars  
**Sections Present:**
- [x] Who you are
- [x] First action — mandatory
- [x] Finding the caller — lookup order (ADDED TODAY)
- [x] Environment
- [x] Don't make them pick when there's nothing to pick from
- [x] Product questions — always check the catalogue
- [x] Guardrails — these override everything
- [x] Escalation is for technical detail only
- [x] How you talk
- [x] Sound like a real person, not a recording
- [x] Reference codes — only when asked
- [x] Ending a call
- [x] Rules
- [x] Goal

**Missing:** Nothing critical

---

## Agent 2 — Claire (Receptionist + Call Logging)

**Status:** ⚠️ Needs update  
**System Prompt Length:** ~6,700 chars  
**Sections Present:**
- [x] Who you are
- [x] First action — mandatory
- [ ] Finding the caller — lookup order ❌ MISSING
- [x] Environment
- [x] Don't make them pick when there's nothing to pick from
- [x] Product questions — always check the catalogue
- [x] Guardrails — these override everything
- [ ] Escalation is for technical detail only ❌ MISSING
- [x] How you talk
- [x] Sound like a real person, not a recording
- [x] Reference codes — only when asked
- [x] Ending a call
- [x] Rules
- [x] Goal

**Critical Issues:**
1. **Missing "Finding the caller" section** — Agent will incorrectly use wrong tools for lookup
2. **Missing "Escalation" section** — Agent may escalate routine questions to Sophia

---

## Agent 3 — Rachel (Sales Agent)

**Status:** ⚠️ Needs update  
**System Prompt Length:** ~6,800 chars  
**Sections Present:**
- [x] Who you are
- [x] First action — mandatory
- [ ] Finding the caller — lookup order ❌ MISSING
- [x] Environment
- [x] Don't make them pick when there's nothing to pick from
- [x] Product questions — always check the catalogue
- [x] Guardrails — these override everything
- [ ] Escalation is for technical detail only ❌ MISSING
- [x] How you talk
- [x] Sound like a real person, not a recording
- [x] Reference codes — only when asked
- [x] Ending a call
- [x] Rules
- [x] Goal
- [x] Order and invoice guardrail (human-only)

**Critical Issues:**
1. **Missing "Finding the caller" section** — Agent will incorrectly use wrong tools for lookup
2. **Missing "Escalation" section** — Agent may escalate routine questions to Sophia

---

## Agent 4 — Jordan (Internal Staff Assistant)

**Status:** ⚠️ Needs update  
**System Prompt Length:** ~3,500 chars  
**Sections Present:**
- [x] Who you are
- [ ] First action — mandatory ❌ MISSING (not needed for internal)
- [ ] Finding the caller — lookup order ❌ NOT NEEDED (internal)
- [x] Environment
- [ ] Don't make them pick when there's nothing to pick from ❌ MISSING
- [ ] Product questions — always check the catalogue ❌ MISSING
- [ ] Guardrails — these override everything ❌ MISSING
- [ ] Escalation is for technical detail only ❌ NOT NEEDED (internal)
- [x] How you talk
- [x] Sound like a real person, not a recording
- [x] Reference codes — only when asked (reads in FULL)
- [ ] Ending a call ❌ MISSING
- [x] Rules
- [x] Goal

**Critical Issues:**
1. **Missing Guardrails section** — Agent may:
   - Confirm orders the supplier hasn't been given yet
   - Say estimated dates out loud
   - Not redirect late orders to email
2. **Missing end_call instruction** — Agent may end calls prematurely
3. **Missing "Don't make them pick" section** — Minor but useful

---

## Recommended Fixes

### Priority 1: Add "Finding the caller" to Agents 2 & 3

Add this section after "First action — mandatory":

```
# Finding the caller — lookup order
When get_caller_context returns matched: false, you need to identify the caller. Here are your lookup tools in order:
1. find_customer_by_phone — try this first with any phone number the caller provides
2. find_customer_by_email — try this if they give you an email address
3. get_customer_360 — use this once you have a customer ID from any lookup

Above all: if they give you a company name, you cannot look it up directly. Ask for their phone number or email instead. If they insist they're a customer but none of your lookups match, collect their name, company, email, and phone — then say "I'll pass your details along and someone will follow up." Never invent a customer record.
```

### Priority 2: Add "Escalation" to Agents 2 & 3

Add this section before "How you talk":

```
# Escalation is for technical detail only
Sophia Charles handles wiring, specifications, drivers, compatibility, IP ratings, dimming protocols — the things that need a data sheet in front of you. Never guess at technical detail; pass it to her.

That is the only reason to escalate. An order status question, an invoice question, a price, a delivery date, a caller who is annoyed — none of those are escalations. Handle them yourself. Do not hand a routine call to Sophia, and never end a call by escalating something you were perfectly able to answer.
```

### Priority 3: Add Guardrails to Agent 4

Add this section after "Environment":

```
# Guardrails — these override everything
These exist so you never say something Pixl can't stand behind. If a guardrail conflicts with being helpful, the guardrail wins.

1. Never confirm an order the supplier hasn't been given yet.
Check the order before you describe it. If oem_ordered_at is empty or oem_status is empty, the supplier order has NOT been placed — no matter what the internal status says. Say it's being processed and someone will confirm.

2. Never say an estimated date out loud.
esd_date is an ESTIMATE for internal use. Not a commitment, and you don't read it to callers. If they ask when something ships: give a date only if it's genuinely confirmed.

3. More than about two weeks out of line goes to email, not the phone.
If an order's running significantly late, tell them you'll get it over in writing.

4. New products get answered in writing.
Something genuinely not in the catalogue — don't improvise a spec or a price. It comes back by email.
```

### Priority 4: Add end_call instruction to Agent 4

Add this at the beginning of the prompt:

```
NEVER use the end_call tool while the caller has an outstanding question — even if you don't have the answer. If they ask who handles something, say "I'll have someone from the team follow up with you on that" or "Let me pass your details along and the right person will get back to you". Then ask if there's anything else. Only end the call when the caller says goodbye or confirms they have nothing else.
```

---

## Test Data Reference

| Company | Phone | Agent Match |
|---------|-------|-------------|
| Northline Developments | +1 416 555 0101 | Sarah Mills |
| Harbourfront Retail Group | +1 647 555 0102 | — |
| Meridian Property Partners | +1 905 555 0103 | — |
| Coastal | +1 438 555 0104 | — |
| Bluewater Industrial | +1 289 555 0105 | David Chan |
