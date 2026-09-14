# Troubleshooting

## Common Issues and Fixes

---

### 1. Agent Says "I'm an AI" or Breaks Character

**Symptoms:** Agent reveals it's a bot, AI, or automated system.

**Cause:** System prompt doesn't have strong enough character instructions, or the LLM is overriding them.

**Fix:**
- Verify the "Never break character" instruction is in the system prompt
- Add: "You are Amber/Maya/Claire/Rachel/Jordan. A real person. You work at Pixl Lighting. That is who you are."
- Enable Manipulation guardrail
- Test with adversarial prompts

---

### 2. Agent Can't Find Customer

**Symptoms:** `get_caller_context` returns `matched: false` for a known customer.

**Cause:** Phone number mismatch or customer not in system.

**Fix:**
- Check that phone matching uses last 10 digits
- Verify customer exists in myERP with matching phone
- Test with `find_customer_by_phone` directly
- If customer is new, agent should collect details

---

### 3. Agent Reads ESD Date Out Loud

**Symptoms:** Agent tells caller "your order ships on October 1st" when the date is an estimate.

**Cause:** Guardrail 2 not enforced in system prompt.

**Fix:**
- Verify Guardrail 2 is in the system prompt: "Never say an estimated date out loud"
- Test with order status questions
- Remind agent: "esd_date is an ESTIMATE for internal use"

---

### 4. Agent Says "In Production" When Order Isn't Ordered

**Symptoms:** Agent says "your order is in production" but `oem_ordered_at` is null.

**Cause:** PIX-20 myERP UI bug — status shows "In Production" but OEM fields are empty.

**Fix:**
- Verify Guardrail 1 is in the system prompt: "Never confirm an order the supplier hasn't been given yet"
- Check `oem_ordered_at` and `oem_status` before describing order
- If either is empty, say "being processed" — never "in production"

---

### 5. Agent Ends Call Prematurely

**Symptoms:** Agent uses `end_call` while caller still has an unanswered question.

**Cause:** Agent doesn't have the "NEVER use end_call while caller has outstanding question" instruction.

**Fix:**
- Add to beginning of system prompt: "NEVER use the end_call tool while the caller has an outstanding question"
- Test with multi-question calls
- Verify agent asks "Anything else?" before closing

---

### 6. MCP Authentication Fails (401)

**Symptoms:** Agent can't call MCP tools, gets 401 error.

**Cause:** Token missing "Bearer" prefix or token is invalid.

**Fix:**
- Ensure token starts with `Bearer ` (with space)
- Test token directly: `curl -H "Authorization: Bearer mo_..." https://myerp.infinitebarakah.com/api/mcp`
- If 401, request new token from myERP team

---

### 7. Agent Loops on Tool Calls

**Symptoms:** Agent keeps calling the same tool repeatedly without resolving the caller's question.

**Cause:** MCP returns unexpected data, or agent gets stuck in a retry pattern.

**Fix:**
- Enable Loop Prevention (PIX-24 fix)
- Check MCP tool responses for errors
- Verify the agent's system prompt has clear fallback instructions
- Test with edge case scenarios

---

### 8. Agent Asks "Which One?" When There's Only One

**Symptoms:** Agent asks "which order are you asking about?" when there's only one open order.

**Cause:** Agent didn't check `get_caller_context` results before asking.

**Fix:**
- Add to system prompt: "If they say 'my order' and there's exactly one open, that's the one. Don't ask which one."
- Test with single-order scenarios
- Verify agent uses `get_caller_context` first

---

### 9. Agent Sounds Too Robotic

**Symptoms:** Agent speaks in a flat, monotonous tone without natural variation.

**Cause:** Voice settings not optimized, or system prompt lacks naturalness instructions.

**Fix:**
- Verify V3 Conversational model is selected
- Verify Expressive Mode is enabled
- Add "Sound like a real person" section to system prompt
- Include natural speech patterns (hesitations, varied openings)

---

### 10. Agent Can't Find Product

**Symptoms:** `list_products` returns empty results for a product that exists.

**Cause:** Search term mismatch or product not in catalogue.

**Fix:**
- Try shorter, simpler search terms
- Check product name/SKU in myERP
- Agent should say "I can't find it in front of me" — never "we don't carry it"
- Take details for written follow-up

---

### 11. Webhook Not Logging Calls

**Symptoms:** Post-call webhook doesn't record transcript to myERP.

**Cause:** Webhook URL wrong, HMAC secret mismatch, or webhook disabled.

**Fix:**
- Verify webhook URL: `https://myerp.infinitebarakah.com/api/webhooks/elevenlabs`
- Check HMAC signing secret matches
- Verify events are enabled: Transcript, Audio, Call Initiation Failures
- Check ElevenLabs webhook logs for errors

---

### 12. Agent Uses "Certainly" or Other Banned Phrases

**Symptoms:** Agent says "Certainly", "How may I assist you?", "I'd be happy to", etc.

**Cause:** System prompt doesn't explicitly ban these phrases.

**Fix:**
- Add banned phrases list to system prompt
- Include natural replacements: "Sure", "Yeah", "Let me look", "Got it", "Anything else?"
- Test with various caller queries

---

## Known Bugs

### PIX-19: Backward Routing Loop
**Status:** Fixed  
**Description:** Agent would get stuck in a loop when caller changed subject mid-call.  
**Fix:** Added backward conditions to workflow edges.

### PIX-20: myERP Status Bug
**Status:** Open (myERP issue)  
**Description:** Order status shows "In Production" but `oem_ordered_at` is null.  
**Workaround:** Agent guardrails handle this correctly — says "being processed".

### PIX-21: Quote Total Shows $0.00
**Status:** Open (myERP UI issue)  
**Description:** Quote totals show $0.00 in myERP UI but MCP API returns correct data.  
**Workaround:** Agent uses MCP data, not UI data.

### PIX-22: Agent Ends Call on Unanswerable Question
**Status:** Accepted  
**Description:** Agent uses `end_call` when caller asks about billing contact (no data in ERP).  
**Workaround:** Added stronger end_call instructions. Contact info not available yet.

### PIX-23: Escalation Overuse
**Status:** Fixed  
**Description:** Agent escalated routine questions to Sophia.  
**Fix:** Clarified escalation is only for technical detail.

### PIX-24: Infinite Loop on MCP Error
**Status:** Fixed  
**Description:** Agent would loop infinitely when MCP returned unexpected data.  
**Fix:** Enabled Loop Prevention toggle on all agents.

---

## Test Data Reference

### Northline Developments
- **Phone:** +1 416 555 0101
- **Contact:** Sarah Mills
- **Quote:** VOICE-2026-0001 ($48,250 CAD)
- **Order:** VSO-2026-0001 (status "In Production" but OEM not ordered)
- **Invoice:** VINV-2026-0001 ($24,125 unpaid)

### Other Test Callers
| Company | Phone | Purpose |
|---------|-------|---------|
| Coastal | +1 438 555 0104 | Test unmatched caller |
| Harbourfront | +1 647 555 0102 | Test order status |
| Meridian | +1 905 555 0103 | Test invoice lookup |
| Bluewater | +1 289 555 0105 | Test product questions |
| Unknown | +1 555 999 0000 | Test unmatched flow |

---

## Diagnostic Commands

### Test MCP Connection
```bash
curl -X POST https://myerp.infinitebarakah.com/api/mcp \
  -H "Authorization: Bearer mo_KkDGxbeU9rkkifrbrrbYqDBca5TvDmKpDvXtHrSnhok" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_caller_context","arguments":{"phone":"4165550101"}},"id":1}'
```

### Test Webhook
```bash
curl -X POST https://myerp.infinitebarakah.com/api/webhooks/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Check Agent Status
1. Go to ElevenLabs Dashboard
2. Navigate to agent
3. Check branch status (should be "Main")
4. Verify published version matches latest changes
