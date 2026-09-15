# Progress Log

## Current State: September 15, 2026

**Phase:** Demo readiness & ERP requirements
**Status:** Single-agent architecture verified live and confirmed complete for demos. Workflow graph in the ElevenLabs dashboard matches the documented nodes/edges. Live audit found **no new behavioural defects** — all previously-observed failures are documented/fixed. New ERP requirement docs created (`erp-requirements.md`, `call-logging-requirement.md`). System is demo-ready via the ElevenLabs preview widget; waiting on management sign-off, then phone number + production myERP.
**Blocked on:** Phone number registration, shared mailbox, myERP production tenant (E-1/E-2/E-3/E-9/E-10)
**Credits:** ⚠️ 33,450 / 36,131 chars used (92.6%) — ~1 short demo call left; reset Oct 6; Starter cannot extend → Creator upgrade recommended ($22/mo)

---

### September 15, 2026 — Live Audit, Demo Readiness & ERP Requirements (latest)

**Context restored from scratch:** a fresh session audited the live system entirely through the ElevenLabs MCP tools (no project docs open at first). Early conclusions built on a wrong mental model ("four agents = four employees") were corrected once the project docs were read. The audit below reflects the true architecture.

**Audit findings (verified live):**
- **Subscription:** Starter (annual, $60 next invoice), 33,450/36,131 chars used (92.6%), `can_extend_character_limit: false`, no overage, status active. Reset Unix `1791700704` ≈ **2026-10-06**. Only ~2,680 chars (~1 short demo call) remain.
- **Phone numbers:** `list_phone_numbers` = **zero** — confirms "blocked" from the docs. All traffic so far is test calls.
- **Agents:** 4 published (Main Assistant + 3 dormant). Verified dormant agents have **no conversations since 2026-09-14** — the `transfer_to_agent` removal is holding. Safe to archive per docs.
- **Main Assistant traffic:** 50+ conversations (pagination continues). Reviewed transcripts: `conv_9901m2fxy64xey4r4qys27crf1xg` (**the reference failure call**), `conv_2201...` (product search, 2,286 credits — the E-1/E-2 evidence call), `conv_8801...` (caller-ID + Birchen 40W), plus short/drop calls. All defects seen match issues already documented as fixed on 2026-09-14 (identity, esd_date, team-wording, announced transfer, greeting variance).
- **Transcript "None" artifact understood:** `agent: None` lines in transcripts are ElevenLabs' rendering of tool-call-only turns — **not spoken audio**. Earlier assumption that callers hear "None" was wrong; the real problem was the opposite (silence), already fixed with fillers + `soft_timeout_config` 2.5s.
- **Workflow graph:** confirmed in the ElevenLabs dashboard — `start → Reception → (Sales ⇄ Logistics ⇄ Accounting) → Escalation (Sophia Charles) → end`, bidirectional "different topic" edges. Matches `docs/workflows.md` and `docs/architecture.md` exactly.

**Master plan confirmed:** the Claude artifact (https://claude.ai/code/artifact/55048113-9028-4cbb-a618-90367ea55c9a) is the authoritative system plan. Decisions confirmed with user:
- **Layer 1 (Inbound)** — built, correct, demo-ready. ✅
- **Layer 2 (Outbound)** — payment follow-up agent, shipment emails, supplier comms — **deliberately deferred to a later phase**. Not now.
- **Layer 3 (RAG knowledge base)** — deferred. Not now.
- **Current gaps are expected/acceptable** (demo tenant data, call logging, phone number) — not a blocker to demoing with management.

**New documents created:**
1. `docs/erp-requirements.md` — consolidated, complete ask for the myERP team: 5 MCP tools to build (`create_interaction`, `create_task`, `create_customer`, `find_customer_by_company`, fix `get_customer_360`), 6 data/behaviour fixes (product search E-1, catalogue E-2, order line items E-3, OEM fields E-4, latency E-6, webhook E-9), 4 environment items (production tenant, production keys, real customer records, billing contact). Read-ready for sharing in Teams.
2. `docs/call-logging-requirement.md` — call-logging flow spec: first call of a new customer is collected and logged; second call recognizes them via `get_caller_context` ("welcome back…"). Requires `create_interaction` + `create_task` + **`create_customer`** (new-caller records). Copy-paste ready for the ERP team / Teams.

**Decisions this session:**
- Sarah / Sarah Mills collision (E-7) **dropped from the requirements** — matching first names are normal and not an issue. Not worth renaming data or persona.
- ElevenLabs **plan upgrade recommended: Starter → Creator** ($22/mo, 121k credits ≈ 4× current, overage so no hard cut-off mid-call, professional voice cloning unlocks a custom branded voice; first month $11; annual $220/yr ≈ $18.33/mo). Pro/Scale not needed until real volume or multi-seat.
- Demo approach: use the ElevenLabs **"Start a call" preview widget** (no phone number required) with a shortened Script B from `docs/stress-test.md` (caller ID → order status → persona probe → close). One short demo call fits the remaining credit budget.

**What still needs verification (next session):**
- Re-run stress-test **Script A** (persona regression) against the deployed fixes — the reference calls observed were the pre-fix state; a fresh pass confirms the Sep 14 fixes held.
- Confirm the demo with management, then register the phone number and assign to the Main Assistant.
- Push the `find_customer_by_company` and write-tool requests (E-9/E-10) to the myERP team.

---

### September 14, 2026 — Persona Hardening & Cost Reduction

**Trigger:** live test call `conv_9901m2fxy64xey4r4qys27crf1xg`. Four defects observed, one a guardrail breach.

**Defects found:**

| # | Defect | Root cause |
|---|---|---|
| 1 | Agent admitted to being an AI when asked | The "never say you are an AI" instruction existed in the pre-workflow prompt and was **lost during the workflow rebuild**. Nothing in the live base prompt or any node prompt covered identity. |
| 2 | Identical deflection repeated 5× verbatim | **`temperature: 0`.** Deterministic sampling — no number of prompt variants can fix this. The prompt was not the problem. |
| 3 | Silence during `find_customer_by_phone` | The filler rule covered catalogue searches only, and was prompt-level (best-effort) with no platform backstop. `soft_timeout_config` was disabled (`-1`). |
| 4 | Banned phrase leaked — *"Let me try a broader search"* | Ban list covered "simpler", not "broader". |
| 5 | **Guardrail breach:** orchestrator spoke *"estimated ship date of October 1st, 2026"* | The `esd_date` rule lived **only in the Logistics node**. Reception had no such constraint and read it out freely. The Logistics node correctly refused moments later — the same call both breached and honoured the rule. |
| 6 | *"I'll have our team check stock"* | The **Accounting node prompt explicitly instructed this**: *"Say 'I'll pass your details along and someone from the team will get back to you'"*. A base-prompt fix alone would not have worked. |

**Fixes applied:**
1. **Identity section** — never AI/bot/assistant/system/program; six varied deflections with `[laughs]`/`[chuckles]` audio tags; explicit ban on repeating a deflection or reciting name+company.
2. **`temperature` 0 → 0.8** — the fix that actually makes the variant banks function.
3. **Personal ownership section** — first-person promises only; "team"/"someone" banned; Sophia Charles exempt as a named individual. Applied to base prompt **and** the Sales, Logistics, Accounting and Escalation node prompts.
4. **Never-go-quiet** extended to every tool call, plus `soft_timeout_config` enabled at 2.5s as a platform-level backstop.
5. **`esd_date` guardrail moved to the base prompt** so it binds on every node.
6. Ban list extended: broader/different search, "as I mentioned", "I'm here to help you with", "I don't share personal background", "I can't personally".

**Cost reduction** (credit burn investigation, same day):

| Lever | Was | Now | Effect |
|---|---|---|---|
| LLM | `qwen35-397b-a17b` ($0.0105/min) | `qwen36-35b-a3b` ($0.0025/min) | **76% saving** |
| Routing | `transfer_to_agent`, `transfer_op: replace` | workflow graph | Ends double-billing — one caller was billed as two conversations |
| Soft-timeout fillers | 6 | 2 | Fewer billed v3 TTS generations |
| Max call duration | 600s | 300s | Caps runaway calls |

**Architecture change:** `transfer_to_agent` removed entirely. Rationale in `docs/workflows.md` — double billing, split prompt source of truth (the cause of defects 5 and 6), and an audible seam where Sarah announced connecting the caller to a specialist who shared her voice.

**Platform behaviours learned:**
- Agent updates create a version but **do not go live** — a separate deployment call is required.
- The `workflow` object is **replaced wholesale**, not merged. Partial updates are rejected with *"Workflow must contain a start node."*
- `max_soft_timeouts_per_generation` is overridden to the **number of filler messages supplied**, regardless of the requested value.
- `reasoning_effort` is supported by qwen (set to `low` for latency) but rejected by Gemini models — clear it before any switch to Gemini.
- **The API price list is not the same as the dashboard model list.** `agents_calculate_llm_usage` returns `gemini-2.5-flash`, and `agents_update` accepts it without error — but it is deprecated and no longer offered in the ElevenLabs dashboard. A config value being accepted is **not** evidence the model will serve a live call. Settled on `qwen36-35b-a3b`.
- Corollary: the older note claiming Gemini 2.5 Flash "was removed from ElevenLabs" was closer to right than the price list suggested. It was dismissed as wrong mid-session on the strength of the API response, which was the wrong source to trust. Verify against the dashboard.

**Still open:** the three dormant agents can be archived. Their prompt files (`sales-prompt.md`, `logistics-prompt.md`, `accounting-prompt.md`) are historical and do not describe live behaviour.

### September 14, 2026 — Orchestrator → Sub-Agents Architecture Restructure (latest)

**Goal:** Reconfigure the system to match the exact target architecture diagram from Claude artifact.

**Changes Applied:**
1. **Agent 1 (`agent_9901m25rmysyefva90xs89chy3nd`): Converted to pure Inbound Orchestrator**
   - First Message: *"Pixl Lighting, how can I direct your call today?"*
   - Enabled and configured `transfer_to_agent` system tool in JSON mode with 3 routing targets:
     - Sales (`agent_7601m27jcm7ten787a5hpz68sz5j`)
     - Logistics (`agent_1001m27jcfqnf3mb6jzszw3w3xf0`)
     - Accounting (`agent_0101m2fwfttne85stk1hwcjwkzjb`)
   - Published to Main.
2. **Agent 2 (`agent_1001m27jcfqnf3mb6jzszw3w3xf0`): Reconfigured as Logistics Agent**
   - Renamed: `Pixl Lighting — Logistics Agent`
   - First Message: *"Pixl Lighting, how can I help you today?"*
   - Specialized prompt for order fulfillment, manufacturing schedules, and tracking (`docs/logistics-prompt.md`).
   - Published to Main.
3. **Agent 3 (`agent_7601m27jcm7ten787a5hpz68sz5j`): Sales Agent**
   - Renamed: `Pixl Lighting — Sales & Projects`
   - Specialized prompt for catalogue pricing, quotes, and new lead onboarding (`docs/sales-prompt.md`).
   - Published to Main.
4. **Agent 4 (`agent_0101m2fwfttne85stk1hwcjwkzjb`): Created new Accounting Agent**
   - Renamed: `Pixl Lighting — Accounting`
   - Attached `myERP MCP` server for invoice lookups.
   - Specialized prompt for invoices, balances, wire instructions, and statements (`docs/accounting-prompt.md`).
   - Published to Main.
5. **Cleaned up workspace & repo:**
   - Deleted old prompt files (`maya-prompt-v2`, `claire-prompt-v2`, `rachel-prompt-v2`, `rachel-prompt`, `pixl-master-prompt`).
   - Removed 135+ temporary browser snapshot files and ignored `.playwright-mcp/`.
   - Updated `README.md`, `architecture.md`, `agents.md`, `workflows.md`, and `setup.md`.

---

### September 14, 2026 — Premium Tone Rewrite & Jordan Removal

**Issues found from live test call:**
1. Agent said "let me try a simpler search" and "I'm not finding anything with those search terms" out loud — sounded robotic, exposed internal mechanics
2. Agent called itself "the receptionist" and said "I'm just the receptionist here" — undermined the premium feel
3. Agent said "I'll pass your details along" / implied "a team member will follow up" — no personal ownership
4. Agent names (Maya, Claire, Rachel) were being spoken to callers — broke "one company, one voice" requirement
5. No explicit instruction that every call should be logged into the ERP so the next caller's history is already there

**Fix applied (all 3 customer-facing agents):**
- Renamed agents in ElevenLabs dashboard (labels only, not spoken): 
  - Agent 1 → "Pixl Lighting — Main Assistant"
  - Agent 2 → "Pixl Lighting — Dedicated Assistant"
  - Agent 3 → "Pixl Lighting — Sales & Projects"
- Rewrote first message for all 3: "Pixl Lighting, how can I help you today?" (no personal name)
- Rewrote system prompts (`docs/pixl-master-prompt.md` is the Agent 1/2 baseline; Rachel/Agent 3 variant adds write-tool environment + human-only order guardrail):
  - "Who you are" now: "senior client assistant and lighting specialist" — explicit instruction to NEVER say "receptionist"
  - New "Personal ownership" section — banned phrases ("a team member will follow up", "I'll pass your details along") replaced with "I'll follow up with you directly", "I'll get that over to you in writing"
  - New "Looking things up — conversational presence with NO dead pauses" section — banned phrases list ("let me try a simpler search", "I'm not finding anything with those search terms") replaced with warm active fillers ("Let me pull up our architectural specs for you right now...")
  - New "Finding the caller & building permanent memory" section — explicit instruction to log every call/new customer into the ERP via `create_customer` / data collection fields so the next call already has full history
- Published all 3 to Main branch
- **Deleted Agent 4 (Jordan)** entirely from ElevenLabs (not archived — full delete, including conversation history) per decision that internal staff assistant isn't needed in the inbound flow

**Reference:** `docs/pixl-master-prompt.md`

### September 14, 2026 — Customer Lookup Fix

**Issue:** Agent incorrectly used `find_customer_by_email` when caller gave company name ("Blue Water Industrial"). No `find_customer_by_company` tool exists in MCP.

**Fix applied:**
- Updated Agent 1 (Maya) system prompt with new "Finding the caller — lookup order" section
- Added explicit lookup order: phone → email → collect details
- Added instruction: "if they give you a company name, you cannot look it up directly"
- Published to Main branch

**Still needed:**
- Add `find_customer_by_company` tool to MCP server (see `docs/find-customer-by-company-spec.md`)
- Apply same system prompt fix to Agents 2, 3, 4

### September 14, 2026 — Agent Audit

**Issues found across all 4 agents:**

| Agent | Missing Sections | Priority | Status |
|-------|------------------|----------|--------|
| Maya | None (fixed today) | ✅ | ✅ Published |
| Claire | "Finding the caller", "Escalation" | P1 | ✅ Published |
| Rachel | "Finding the caller", "Escalation" | P1 | ✅ Published |
| Jordan | Guardrails, end_call instruction | P1 | ✅ Published |

**All 4 agents now have consistent sections:**
- ✅ "Finding the caller — lookup order" (Maya, Claire, Rachel)
- ✅ "Escalation is for technical detail only" (Maya, Claire, Rachel)
- ✅ "Guardrails — these override everything" (All 4)
- ✅ end_call instruction (All 4)

**Full audit:** `docs/agent-audit.md`
**Stress test scenarios:** `docs/stress-test.md`

---

## What's Completed

### Agent 1 — Maya (Inbound Receptionist) ✅
- [x] System prompt with Amber persona → updated to Maya
- [x] First message: "Pixl Lighting, Maya speaking."
- [x] MCP server attached (workspace-level, 16 tools verified)
- [x] System tools enabled: End Conversation, Transfer to Number
- [x] Guardrails: Focus ✅, Manipulation ✅
- [x] Loop Prevention enabled (PIX-24 fix)
- [x] Post-call webhook configured (Transcript, Audio, Call Initiation Failures)
- [x] Data collection fields: follow_up_task, follow_up_due
- [x] Natural speech patterns section added
- [x] Stray "undefined" removed from prompt
- [x] Published to Main branch
- [x] Test suite: 3 of 4 criteria pass (Criterion 3 accepted — premature end_call on unanswerable question)

### Agent 2 — Claire (Receptionist + Call Logging) ✅
- [x] System prompt with persona → updated to Claire
- [x] First message: "Pixl Lighting, this is Claire — give me one sec, I'll pull you up."
- [x] MCP server attached (workspace-level)
- [x] System tools enabled: End Conversation, Transfer to Number
- [x] Guardrails: Focus ✅, Manipulation ✅
- [x] Natural speech patterns section added
- [x] Stray "undefined" removed from prompt
- [x] Published to Main branch

### Agent 3 — Rachel (Sales Agent) ✅
- [x] System prompt with write-capable persona → updated to Rachel
- [x] First message: "Pixl Lighting, this is Rachel — give me one sec, I'll pull you up."
- [x] MCP server attached (workspace-level)
- [x] System tools enabled: End Conversation, Transfer to Number
- [x] Guardrails: Focus ✅, Manipulation ✅
- [x] Extra guardrail: "order and invoice line is human-only"
- [x] Fine-Grained approval mode configured
- [x] Natural speech patterns section added
- [x] Stray "undefined" removed from prompt
- [x] Published to Main branch

### Agent 4 — Jordan (Internal Staff Assistant) ✅
- [x] System prompt with colleague-mode persona → updated to Jordan
- [x] First message: "Pixl internal — go ahead."
- [x] MCP server attached (workspace-level)
- [x] System tools enabled: End Conversation, Transfer to Number
- [x] Guardrails: Focus ✅, Manipulation ✅
- [x] Natural speech patterns section added
- [x] Stray "undefined" removed from prompt
- [x] Published to Main branch

### Voice & Naturalness Optimization ✅
- [x] Voice: V3 Conversational (most natural model, GA)
- [x] Expressive Mode: Enabled on all agents
- [x] Voice model: Amber King (external), Jordan (internal)
- [x] First messages optimized for naturalness
- [x] System prompts enhanced with "Sound like a real person" section
- [x] Banned phrases: "Certainly", "How may I assist you?", "I'd be happy to", etc.
- [x] Natural replacements: "Sure", "Yeah", "Let me look", "Got it", "Anything else?"
- [x] Hesitation patterns: "um", "let me see", "hang on", "one sec"
- [x] Energy matching: match caller's tone
- [x] Sentence variation: never open 3 replies the same way

### Documentation ✅
- [x] README.md — Project overview
- [x] docs/architecture.md — System design, MCP integration, data flow
- [x] docs/agents.md — Agent profiles, personas, tools, guardrails
- [x] docs/workflows.md — Call flows, routing logic, escalation paths
- [x] docs/erd.md — Entity relationship diagram, data model
- [x] docs/setup.md — Deployment and configuration guide
- [x] docs/troubleshooting.md — Known issues and fixes
- [x] docs/progress.md — This document

### myERP API Keys Created
- Agent 3 (Sales): `mo_EC3pblxRyyuFH8YK6wIcke0v1GUaQKzW6_4qnyUReNc` — Estimator, issued as read+write. **The key's scope is irrelevant: the MCP server exposes no write tools at all (E-10).**
- Agent 4 (Internal): `mo_imd8JVRcyAwOuL3Kx86-5Ml5ZTFzkYzJO0fp7a2vcuIC` — Estimator, read-only
- Note: Workspace-level MCP server was used instead of per-agent instances

---

## Important Decisions

### 1. LLM choice — ~~GPT-5.6 Luna~~ → `qwen36-35b-a3b` (revised 2026-09-14)

**Original note:** *"Gemini 2.5 Flash was removed from ElevenLabs (only Gemini 3.x Flash remains)."* — used to justify keeping GPT-5.6 Luna.

**What was actually running:** neither. By 2026-09-14 the agent was on `qwen35-397b-a17b` at **$0.0105/min**, the single largest driver of credit burn.

**Current decision:** `qwen36-35b-a3b` at **$0.0025/min** — a **76% reduction** against the 397B qwen, selected for cost *and* latency.

**Why this one:** mixture-of-experts with ~3B active parameters per token, so it is fast for structural reasons rather than merely being small. Same family as `qwen35-397b-a17b` (17B active), which the system already ran successfully — so behaviour across 2–4 chained MCP lookups is known-good rather than assumed. `reasoning_effort: low` trims thinking time on voice turns.

**Note — silent model remapping.** The request sent `qwen35-35b-a3b`; the API returned `qwen36-35b-a3b`. ElevenLabs auto-forwarded the deprecated `qwen35` to its `qwen36` successor without warning. Same price, same architecture, so the outcome was fine — but *always read back the `llm` field from the update response rather than trusting what was sent.*

**Why not `gemini-2.5-flash`?** At $0.0020/min it is cheaper, appears in the `agents_calculate_llm_usage` price list, and `agents_update` accepts it without error. It is nonetheless **deprecated and absent from the ElevenLabs dashboard**. It was briefly configured during this session on the strength of the API response, then reverted. No live call ever ran on it.

**Why not `gemini-3.5-flash`?** $0.0204/min — 10× its own lite variant and roughly double the qwen that caused the problem. A generation's flagship is not a safe default.

**Why not `gpt-5-nano`?** $0.0007/min, 3.5× cheaper again. Nano-class models degrade precisely what this persona depends on: varied phrasing, audio-tag placement, banned-phrase compliance, multi-tool chains. Not worth the saving.

**Lessons:**
1. The API price list enumerates more models than the dashboard offers. A value being *accepted* by `agents_update` does not mean it will *serve a call*. Check the dashboard.
2. Price spread within a generation is ~5–10×. Compare before switching; lite/flash/pro do not track intuition.
3. The API may silently substitute a deprecated model id for its successor. Read back the response.
4. For a voice agent, active parameter count matters more than total size. An MoE model with 3B active beats a dense model of similar headline size on latency.

**Constraint:** `reasoning_effort` is supported by qwen and set to `low`. It must be cleared before switching to any Gemini model, which rejects it with *"Reasoning effort is not supported for this LLM."*

### 2. Workspace-Level MCP Server
**Decision:** All 4 agents share the same workspace-level MCP server.  
**Reason:** Simpler management, single token, consistent data access. Per-agent MCP instances were considered but not needed.

### 3. Agent Names
**Decision:** Each agent has a distinct name reflecting their role.  
- Maya (receptionist) — warm, approachable
- Claire (call logging) — organized, detail-oriented
- Rachel (sales) — energetic, capable
- Jordan (internal) — neutral, efficient

### 4. Voice Consistency
**Decision:** External agents share the same voice (Amber King), internal agent uses Jordan voice.  
**Reason:** Consistent brand experience for external callers. Internal line has different tone.

### 5. Criterion 3 Test Failure Accepted
**Decision:** Agent 1 test Criterion 3 failure accepted for now.  
**Reason:** Agent ends call when caller asks "who do I contact?" about an unpaid invoice (ERP has no contact info). User confirmed: "it's okay as of now we don't have that too."

### 6. Natural Speech Patterns
**Decision:** Added "Sound like a real person, not a recording" section to all prompts.  
**Reason:** User requirement: "it should never feel like AI so make it exactly like the voices, the answers, the naturalness, all"

---

## Known Issues

### Open
| ID | Issue | Impact | Status |
|----|-------|--------|--------|
| PIX-20 | myERP UI shows "In Production" but OEM not ordered | Agent says "being processed" (correct behavior) | Open (myERP issue) |
| — | Quote totals show $0.00 in myERP UI | Agent uses MCP data (correct) | Open (myERP UI issue) |
| — | No phone number registered | No agent can receive real calls | Blocked |
| — | Shared mailbox not set up | Guardrails 2, 3, 4 depend on it | Blocked |
| — | Billing contact name not available | Agent 1 test Criterion 3 fails | Accepted |
| — | myERP is demo tenant | Agents can't go live until production | Blocked (PIX-20) |

### Fixed
| ID | Issue | Fix |
|----|-------|-----|
| PIX-19 | Backward routing loop | Added backward conditions to workflow edges |
| PIX-23 | Escalation overuse | Clarified escalation is only for technical detail |
| PIX-24 | Infinite loop on MCP error | Enabled Loop Prevention toggle |
| — | Stray "undefined" in prompts | Removed from all 4 agent prompts |
| — | Agent 1 first message too formal | Updated to "Pixl Lighting, Maya speaking." |

---

## Test Results — September 14, 2026

### Agent 1 — Maya (Inbound Receptionist)
| Criterion | Result | Detail |
|-----------|--------|--------|
| 1. Query ERP first | ✅ | Called get_caller_context + get_sales_order before answering |
| 2. No escalation | ✅ | Never tried to transfer to Sophia |
| 3. Don't end with outstanding question | ❌ | Ended call after caller's follow-up about hold-up |
| 4. Handle subject change | ⚠️ | Not assessed — call ended too early |

**Known issue:** Agent uses `end_call` when caller has a follow-up question. Accepted by user — contact info not available yet.

**Note:** Agent name "Maya" not yet reflected in test simulation (still shows "Amber"). May need test re-run after propagation.

### Agent 2 — Claire (Receptionist + Call Logging)
**No tests attached.** Test suite needs to be created.

### Agent 3 — Rachel (Sales Agent)
**No tests attached.** Test suite needs to be created.

### Agent 4 — Jordan (Internal Staff Assistant)
**No tests attached.** Test suite needs to be created.

---

## What Should Be Done Next

### Immediate (This Week)
1. **Register phone number** — Purchase or port a number on ElevenLabs (Settings → Phone Numbers)
2. **Assign phone to agents** — Configure which agent handles the number
3. **Set up shared mailbox** — Required for guardrails 2, 3, 4
4. **Add billing contact name** — When available, update Agent 1 prompt
5. **Re-run Agent 1 test suite** — After contact info is available
6. **Create test suites for Agents 2, 3, 4** — Currently no tests attached

### Short-Term (This Month)
6. **Test all 4 agents end-to-end** — Real calls with test data
7. **Configure workflow nodes/edges** — Review and optimize routing for Agents 2, 3, 4
8. **Set up production myERP tenant** — PIX-20 prerequisite for going live
9. **Create test suites for Agents 2, 3, 4** — Currently only Agent 1 has tests
10. **Monitor call quality** — Review transcripts, adjust prompts as needed

### Medium-Term (Next Month)
11. **Production tenant migration** — Move from demo to production myERP
12. **Reissue API keys** — Generate production tokens (agent config doesn't change)
13. **Performance tuning** — Optimize based on real call data
14. **Additional guardrails** — Content and Custom guardrails as needed
15. **Documentation updates** — Reflect production configuration

### Blocked
- **Phone number** — Zero numbers registered on ElevenLabs
- **Shared mailbox** — Not set up
- **Production myERP** — PIX-20 must be resolved first
- **Billing contact name** — Not available yet

---

## Configuration Summary

> The Maya / Claire / Rachel / Jordan table that previously sat here described personas retired on 2026-09-14 and an LLM (GPT-5.6 Luna) no longer in use. Removed rather than corrected — it was being read as current.

**Live configuration — `Pixl Lighting — Main Assistant` (`agent_9901m25rmysyefva90xs89chy3nd`)**

| Setting | Value |
|---|---|
| Persona | Sarah |
| Voice | `F89WkXaQbUlVyNvtlD3X` |
| LLM | `qwen36-35b-a3b`, temperature 0.8, `reasoning_effort` low |
| TTS | `eleven_v3_conversational`, Expressive ✅ |
| Guardrails | Focus ✅ · Prompt injection ✅ |
| System tools | `end_call` only |
| Routing | Workflow graph (5 nodes, 12 edges) |
| MCP Tools | 16, workspace server `iRZUVO4FTNPItBWbbmoR` |
| Max duration | 300s |
| Soft-timeout fillers | 2, at 2.5s |
| Webhook | ✅ Transcript |
| Data Collection | ✅ `follow_up_task`, `follow_up_due` |
| Published | ✅ Main, 100% traffic |

**Dormant** — published, no traffic, prompts historical:

| Agent | ID | Voice |
|---|---|---|
| Sales & Projects | `agent_7601m27jcm7ten787a5hpz68sz5j` | `F89WkXaQbUlVyNvtlD3X` |
| Logistics Agent | `agent_1001m27jcfqnf3mb6jzszw3w3xf0` | `F89WkXaQbUlVyNvtlD3X` |
| Accounting | `agent_0101m2fwfttne85stk1hwcjwkzjb` | `cjVigY5qzO86Huf0OWal` ⚠️ different voice |

---

## File Locations

| File | Path |
|------|------|
| Handover Doc | `/Users/junaidparamberi/Downloads/pixl-voice-agent-handover.md` |
| Integration Brief | `/Users/junaidparamberi/Downloads/ELEVENLABS-VOICE-AGENTS-SETUP 1 (1).md` |
| Documentation | `/Users/junaidparamberi/projects/3S Light/` |
| ElevenLabs Dashboard | `https://elevenlabs.io/app/agents/` |
| myERP Demo | `https://myerp.infinitebarakah.com` |
