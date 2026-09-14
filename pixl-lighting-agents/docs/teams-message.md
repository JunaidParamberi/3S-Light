# Teams Message — Copy & Paste

---

## Pixl Voice Agents — Status Update (Sep 14)

**What we built:** 4 AI voice agents that answer Pixl Lighting's phones using ElevenLabs + myERP integration. They look up customer data in real time and handle calls naturally — you can't tell it's not a human.

**The 4 agents:**
🎤 **Maya** — Main receptionist. Answers external calls, looks up quotes/orders/invoices by phone number.
🎤 **Claire** — Same as Maya but also logs calls and sets follow-up tasks automatically.
🎤 **Rachel** — Sales agent. Can create customers, quotes, deals during the call.
🎤 **Jordan** — Internal staff line. No small talk, reads codes in full, gets straight to numbers.

**What's working:**
✅ All 4 agents configured and published
✅ MCP connection verified (16 ERP tools accessible)
✅ Post-call webhook logging to myERP
✅ Voice: V3 Conversational + Expressive Mode (most natural available)
✅ Natural speech patterns — hesitations, varied openings, energy matching
✅ Guardrails: no false promises, no estimated dates, no improvising specs
✅ Loop prevention enabled
✅ Full documentation on GitHub

**Test results (Agent 1 — Maya):**
✅ Queried ERP correctly before answering
✅ No unnecessary escalation
❌ Ended call on follow-up question (known issue — no billing contact info yet)
⚠️ Subject change test couldn't run (call ended too early)

**What's blocking us:**
🚫 Phone number — not registered on ElevenLabs yet
🚫 Shared mailbox — not set up
🚫 Production myERP — still on demo tenant
🚫 Test suites — only Agent 1 has tests, need to create for 2, 3, 4

**Next steps:**
1. Register phone number → agents can receive real calls
2. Set up shared mailbox → guardrails fully active
3. Create test suites for Agents 2, 3, 4
4. Move to production myERP

**Bottom line:** Platform is functionally complete. Once phone number + shared mailbox are set up, we can start receiving real calls within a day.

Docs: https://github.com/JunaidParamberi/3S-Light
