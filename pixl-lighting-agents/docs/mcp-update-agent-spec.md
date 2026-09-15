# MCP Tool Spec: `update_agent`

## Purpose

Allow updating an existing ElevenLabs Conversational AI agent's configuration (system prompt, voice, model settings, first message, etc.) without creating a new agent.

## Current Gap

The ElevenLabs MCP currently supports:
- `get_agent` — read-only
- `create_agent` — creates NEW agent (new ID)
- `list_agents` — list all agents

**Missing:** `update_agent` — modify existing agent by ID

## API Reference

ElevenLabs API supports this via:

```
PATCH https://api.elevenlabs.io/v1/convai/agents/{agent_id}
```

### Request Body (all fields optional — only send what you want to change)

```json
{
  "name": "string",
  "first_message": "string",
  "system_prompt": "string",
  "voice_id": "string",
  "model_id": "string",
  "temperature": number,
  "max_duration_seconds": number,
  "enable_background_noise_removal": boolean,
  "enable_language_detection": boolean
}
```

### Authentication

```
xi-api-key: {API_KEY}
Content-Type: application/json
```

### Response

Returns the updated agent object (same format as `get_agent`).

---

## Proposed MCP Tool Definition

```json
{
  "name": "update_agent",
  "description": "Update an existing ElevenLabs Conversational AI agent's configuration. Only provided fields are updated; omitted fields remain unchanged.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "The ID of the agent to update (e.g., 'agent_9901m25rmysyefva90xs89chy3nd')"
      },
      "name": {
        "type": "string",
        "description": "New display name for the agent"
      },
      "first_message": {
        "type": "string",
        "description": "The greeting message the agent says when a call connects"
      },
      "system_prompt": {
        "type": "string",
        "description": "The system prompt that defines the agent's behavior"
      },
      "voice_id": {
        "type": "string",
        "description": "Voice ID to use (e.g., 'F89WkXaQbUlVyNvtlD3X' for Amber King)"
      },
      "model_id": {
        "type": "string",
        "description": "LLM model ID (e.g., 'qwen36-35b-a3b')"
      },
      "temperature": {
        "type": "number",
        "description": "Temperature for LLM sampling (0.0 - 1.0). Higher = more varied responses."
      },
      "max_duration_seconds": {
        "type": "integer",
        "description": "Maximum call duration in seconds"
      }
    },
    "required": ["agent_id"]
  }
}
```

---

## Example Usage

### Update only the system prompt

```json
{
  "agent_id": "agent_9901m25rmysyefva90xs89chy3nd",
  "system_prompt": "Your new prompt here..."
}
```

### Update prompt + voice + temperature

```json
{
  "agent_id": "agent_9901m25rmysyefva90xs89chy3nd",
  "system_prompt": "Your new prompt here...",
  "voice_id": "F89WkXaQbUlVyNvtlD3X",
  "temperature": 0.8
}
```

---

## Implementation Notes

1. **PATCH, not PUT** — Only send fields you want to change. Omitted fields stay as-is.
2. **Publish separately** — After updating, the agent must be published to Main branch for changes to go live. Consider adding a `publish_agent` tool as well.
3. **Validation** — `voice_id` should be validated against the workspace's available voices. `model_id` should be a valid ElevenLabs model.
4. **Error handling** — Return clear errors for:
   - `404` — Agent not found
   - `422` — Invalid field values
   - `401` — Invalid API key

---

## Also Consider: `publish_agent`

After updating an agent, changes are saved as a draft. To make them live:

```json
{
  "name": "publish_agent",
  "description": "Publish an agent's draft changes to the Main branch, making them live for incoming calls.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": {
        "type": "string",
        "description": "The ID of the agent to publish"
      }
    },
    "required": ["agent_id"]
  }
}
```

### ElevenLabs API

```
POST https://api.elevenlabs.io/v1/convai/agents/{agent_id}/publish
```

---

## Summary

| Tool | Status | Purpose |
|---|---|---|
| `get_agent` | ✅ Exists | Read agent config |
| `list_agents` | ✅ Exists | List all agents |
| `create_agent` | ✅ Exists | Create new agent |
| `update_agent` | ❌ **Missing** | Update existing agent |
| `publish_agent` | ❌ **Missing** | Publish draft to Main |
| `delete_agent` | ❌ Missing (optional) | Remove agent |
