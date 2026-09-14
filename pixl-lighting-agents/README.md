# 3S Light — Pixl Lighting Voice Agent Platform

> AI-powered voice agents for Pixl Lighting's inbound call handling, powered by ElevenLabs and integrated with myERP.

## What This Is

Four ElevenLabs voice agents that answer Pixl Lighting's phones, look up customer data in real time, and handle calls naturally — from order status checks to sales inquiries to internal staff lookups.

The agents are designed to be **indistinguishable from a human receptionist**. They use natural speech patterns, know the caller's name and history before they even ask, and follow strict guardrails so nothing gets promised that Pixl can't deliver.

## Architecture at a Glance

```
Caller → Phone → ElevenLabs Agent → MCP Server → myERP API
                                    ↓
                              Post-call Webhook → myERP (logs transcript, audio, metadata)
```

## The Four Agents

| # | Name | Role | Line | Voice |
|---|------|------|------|-------|
| 1 | Maya | Inbound Receptionist | External main line | Amber King |
| 2 | Claire | Receptionist + Call Logging | External (overflow) | Amber King |
| 3 | Rachel | Sales Agent | External (sales) | Amber King |
| 4 | Jordan | Internal Staff Assistant | Internal line | Jordan |

## Key Documents

- **[Architecture](docs/architecture.md)** — System design, MCP integration, data flow
- **[Agent Profiles](docs/agents.md)** — Each agent's persona, tools, guardrails, and configuration
- **[Workflows](docs/workflows.md)** — Call flows, routing logic, escalation paths
- **[Entity Relationship Diagram](docs/erd.md)** — myERP data model and how agents query it
- **[Setup Guide](docs/setup.md)** — How to deploy and configure from scratch
- **[Troubleshooting](docs/troubleshooting.md)** — Known issues and fixes
- **[Progress Log](docs/progress.md)** — What's done, what's next, decisions made

## Quick Start

1. See [Setup Guide](docs/setup.md) for prerequisites and deployment
2. See [Agent Profiles](docs/agents.md) for persona details
3. See [Progress Log](docs/progress.md) for current status

## Environment

- **ERP:** myERP (demo tenant at `myerp.infinitebarakah.com`)
- **Voice Platform:** ElevenLabs Conversational AI
- **LLM:** GPT-5.6 Luna (Agent 1), configurable per agent
- **TTS Model:** V3 Conversational with Expressive Mode
- **MCP Protocol:** Model Context Protocol for ERP integration
- **Phone:** Not yet registered (blocked)

---

*No credentials are stored in this repository. All secrets are managed through ElevenLabs dashboard and myERP admin panel.*
