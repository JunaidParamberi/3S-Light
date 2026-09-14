# Setup Guide

## Prerequisites

1. **ElevenLabs Account** — With Conversational AI access
2. **myERP Tenant** — Demo or production
3. **MCP Server** — myERP MCP adapter running
4. **Phone Number** — Registered on ElevenLabs (not yet done)

---

## Step 1: ElevenLabs Agent Setup

### Create Agent
1. Go to ElevenLabs Dashboard → Agents → Create Agent
2. Name the agent (e.g., "Maya — Inbound Receptionist")
3. Select the voice (Amber King for external agents, Jordan for internal)
4. Set the TTS model to V3 Conversational
5. Enable Expressive Mode

### Configure System Prompt
1. Paste the agent's system prompt into the System Prompt field
2. Ensure the first instruction is the mandatory `get_caller_context` call
3. Verify the `{{system__caller_id}}` dynamic variable is used correctly
4. Add the "Sound like a real person" section for naturalness

### Set First Message
Each agent has a specific first message:
- **Maya:** "Pixl Lighting, Maya speaking."
- **Claire:** "Pixl Lighting, this is Claire — give me one sec, I'll pull you up."
- **Rachel:** "Pixl Lighting, this is Rachel — give me one sec, I'll pull you up."
- **Jordan:** "Pixl internal — go ahead."

### Enable Guardrails
1. Go to Guardrails tab
2. Enable **Focus** guardrail
3. Enable **Manipulation** guardrail
4. Leave Content and Custom as-is

### Enable System Tools
1. Go to Agent Actions
2. Enable **End Conversation** tool
3. Enable **Transfer to Number** tool (configure number later)

---

## Step 2: MCP Server Configuration

### Attach MCP Server
1. Go to agent's Tools tab
2. Click "Add MCP Server"
3. Select workspace-level "myERP MCP" server
4. Verify 16 tools are available

### Configure Tool Access
- **Read-only agents (Maya, Claire, Jordan):** No Approval mode
- **Write-capable agent (Rachel):** Fine-Grained approval mode
  - Auto-approve: Read tools, `log_interaction`, `create_task`
  - Require approval: All other write tools

### Verify Authentication
1. Test that the MCP token works: `mo_KkDGxbeU9rkkifrbrrbYqDBca5TvDmKpDvXtHrSnhok`
2. Ensure the token includes "Bearer" prefix
3. Test a simple tool call (e.g., `get_caller_context`)

---

## Step 3: Post-Call Webhook

### Create Webhook
1. Go to ElevenLabs Settings → Webhooks
2. Create webhook: `myErp-post-webhook`
3. URL: `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
4. Events: Transcript ✅, Audio ✅, Call Initiation Failures ✅
5. Auth: HMAC signing (send secret to myERP team)

### Verify Webhook
1. Make a test call
2. Check myERP for the logged transcript
3. Verify audio file is accessible

---

## Step 4: Data Collection Fields

### Add to Agent 1 and 2
1. Go to agent settings
2. Add field: `follow_up_task` (string)
3. Add field: `follow_up_due` (date, YYYY-MM-DD)

These fields are populated by the agent when a follow-up is needed.

---

## Step 5: Phone Number Registration

### On ElevenLabs
1. Go to Settings → Phone Numbers
2. Purchase or port a number
3. Assign to agent
4. Test inbound call

### On myERP
1. Configure the phone number in the tenant settings
2. Set up call routing rules
3. Test end-to-end

---

## Step 6: Publishing

### Publish to Main Branch
1. Make all changes on the agent's branch
2. Click "Publish"
3. Review changes in the dialog
4. Add commit message
5. Confirm publish

### Verify Published Version
1. Check that the branch shows "Main" as the published version
2. Verify all settings are live
3. Make a test call to confirm

---

## Step 7: Testing

### Test Suite
Agent 1 has a test suite with 9 test cases:
1. Call is not ended or escalated before the caller is answered
2. Agent greets caller by name when matched
3. Agent handles unmatched callers correctly
4. Agent looks up quote details accurately
5. Agent handles order status questions
6. Agent handles invoice questions
7. Agent handles product questions
8. Agent escalates technical questions appropriately
9. Agent ends call naturally

### Run Tests
1. Go to agent's Tests tab
2. Select test case
3. Run test
4. Review results
5. Fix any failures

---

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `system__caller_id` | Dynamic | Caller's phone number (auto-filled) |
| MCP Token | `Bearer mo_...` | Authentication for myERP API |
| Webhook URL | `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs` | Post-call logging |
| Demo Login | `demo@yyzlighting.com` | myERP demo tenant |

---

## Branching Strategy

Each agent has its own branch for configuration management:
- **Agent 1:** `agtbrch_3201m25rn01rf789hhvs9sbnpzx9`
- **Agent 2:** `agtbrch_7101m27jcgn8fdaan8p2syhkf3sm`
- **Agent 3:** `agtbrch_0701m27jcne9f44bg0148k923gve`
- **Agent 4:** `agtbrch_2801m27jcvh1erts885ktas0mhy4`

Changes are made on the branch, then published to Main.
