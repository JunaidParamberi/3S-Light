# Progress Log

## Current State: September 14, 2026

**Phase:** Agent Configuration & Naturalness Optimization  
**Status:** 3 customer-facing agents configured, published, and rewritten for premium human tone. Jordan (internal agent) deleted — not needed in inbound flow.  
**Blocked on:** Phone number registration, shared mailbox, myERP production tenant

### September 14, 2026 — Premium Tone Rewrite & Jordan Removal (latest)

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
- Agent 3 (Sales): `mo_EC3pblxRyyuFH8YK6wIcke0v1GUaQKzW6_4qnyUReNc` — Estimator, read+write
- Agent 4 (Internal): `mo_imd8JVRcyAwOuL3Kx86-5Ml5ZTFzkYzJO0fp7a2vcuIC` — Estimator, read-only
- Note: Workspace-level MCP server was used instead of per-agent instances

---

## Important Decisions

### 1. GPT-5.6 Luna as LLM
**Decision:** Keep GPT-5.6 Luna for all agents.  
**Reason:** Gemini 2.5 Flash was removed from ElevenLabs (only Gemini 3.x Flash remains). GPT-5.6 Luna was working for 7/9 tests; loop prevention fix resolved remaining failures.

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

| Setting | Agent 1 (Maya) | Agent 2 (Claire) | Agent 3 (Rachel) | Agent 4 (Jordan) |
|---------|---------------|-----------------|-----------------|-----------------|
| Voice | Amber King | Amber King | Amber King | Jordan |
| LLM | GPT-5.6 Luna | GPT-5.6 Luna | GPT-5.6 Luna | GPT-5.6 Luna |
| TTS | V3 Conversational | V3 Conversational | V3 Conversational | V3 Conversational |
| Expressive | ✅ | ✅ | ✅ | ✅ |
| Focus | ✅ | ✅ | ✅ | ✅ |
| Manipulation | ✅ | ✅ | ✅ | ✅ |
| Loop Prevention | ✅ | ✅ | ✅ | ✅ |
| Approval | No Approval | No Approval | Fine-Grained | No Approval |
| Write Access | ❌ | ❌ | ✅ | ❌ |
| MCP Tools | 16 | 16 | 22 | 16 |
| Webhook | ✅ | ✅ | ✅ | ✅ |
| Data Collection | ✅ | ✅ | ❌ | ❌ |
| Published | ✅ Main | ✅ Main | ✅ Main | ✅ Main |

---

## File Locations

| File | Path |
|------|------|
| Handover Doc | `/Users/junaidparamberi/Downloads/pixl-voice-agent-handover.md` |
| Integration Brief | `/Users/junaidparamberi/Downloads/ELEVENLABS-VOICE-AGENTS-SETUP 1 (1).md` |
| Documentation | `/Users/junaidparamberi/projects/3S Light/` |
| ElevenLabs Dashboard | `https://elevenlabs.io/app/agents/` |
| myERP Demo | `https://myerp.infinitebarakah.com` |
