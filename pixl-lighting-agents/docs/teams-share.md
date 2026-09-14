Hey team 👋

Here's where we're at with the Pixl voice agents:

---

**What we've done so far:**

Built 4 voice agents on ElevenLabs that answer Pixl's phones and pull live data from myERP. They sound like a real person — you genuinely can't tell it's AI.

The agents:

🎤 **Maya** — Main receptionist. Picks up the phone, knows who's calling before they even say their name (pulls customer data by phone number), answers questions about quotes, orders, invoices.

🎤 **Claire** — Same thing but also logs every call and can set follow-up tasks automatically.

🎤 **Rachel** — Sales line. Can actually do stuff while you're on the phone — create customers, start quotes, log interactions. Not just taking messages.

🎤 **Jordan** — Internal staff line. No "how can I help you" — just gets straight to the number you need. Reads codes in full because we write them down.

All 4 are configured, published, and ready to go on ElevenLabs.

---

**How it works:**

Caller dials in → Agent picks up → Pulls customer data by phone → Answers the question using live ERP data → Call ends → Everything gets logged to myERP automatically.

The agents have guardrails so they never promise something we can't deliver — no reading out estimated dates, no saying an order is "in production" when the supplier hasn't even been contacted, no guessing at specs.

---

**Test results:**

Ran the test suite on Maya (Agent 1):
- ✅ Correctly queried ERP before answering
- ✅ Never tried to escalate something it could handle
- ❌ Ended a call too early when the caller had a follow-up question — known issue, we don't have the billing contact info to pass along yet

Agents 2, 3, 4 don't have test suites attached yet — need to create those.

---

**What's blocking us from going live:**

🚫 **Phone number** — We need to register a number on ElevenLabs. Until then no agent can receive real calls.
🚫 **Shared mailbox** — Needed for the guardrails that send written confirmations for late orders, new products, etc.
🚫 **Production myERP** — Right now everything is pointed at the demo tenant. Once myERP becomes Pixl's primary ERP we just swap the token, no config changes needed.
🚫 **Test suites** — Only Maya has tests. Need to build them for Claire, Rachel, and Jordan.

Once we have the phone number and shared mailbox, these agents can start taking real calls within a day. The tech side is done — it's just operational stuff now.

---

**Full documentation:**

Everything is here — architecture, agent profiles, workflows, data model, setup guide, troubleshooting, the works:

👉 https://github.com/JunaidParamberi/3S-Light

No credentials in the repo. All secrets stay in ElevenLabs and myERP admin.

---

Let me know if you have questions or want to jump on a call to walk through any of it.
