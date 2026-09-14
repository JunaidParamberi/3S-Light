# MCP Tool Spec: `find_customer_by_company`

## Purpose

Look up a customer by company name. This tool fills a gap in the current MCP toolset — agents can search by phone and email, but not by company name. When a caller says their company name but doesn't have a phone or email on file, the agent has no way to find them.

## Current State

The MCP server has 16 tools:
- `find_customer_by_phone` ✅
- `find_customer_by_email` ✅
- `find_customer_by_company` ❌ **MISSING**

This causes agents to:
1. Use the wrong tool (e.g., calling `find_customer_by_email` when given a company name)
2. Fail to identify callers who provide company name but not phone/email
3. Route to escalation incorrectly when lookup fails

## Tool Specification

```json
{
  "name": "find_customer_by_company",
  "description": "Look up a customer by company name. Performs a case-insensitive partial match on the company field. Returns null when no customer matches. Use this when the caller provides their company name but no phone number or email is available.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "company": {
        "type": "string",
        "description": "The company name to search for. Partial matches are accepted (e.g., 'Bluewater' matches 'Bluewater Industrial')."
      }
    },
    "required": ["company"]
  }
}
```

## Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "customer": {
      "id": "uuid",
      "name": "David Chan",
      "company": "Bluewater Industrial",
      "email": "david.chan@bluewater.test",
      "phone": "+1 289 555 0105",
      "address": "123 Industrial Way, Toronto, ON"
    }
  }
}
```

Or if no match:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "customer": null
  }
}
```

## Implementation Notes

1. **Case-insensitive**: Search should be case-insensitive ("bluewater" matches "Bluewater Industrial")
2. **Partial match**: Accept partial company names ("Blue" matches "Bluewater Industrial")
3. **Multiple matches**: If multiple customers match, return the first match (or all matches if needed)
4. **Performance**: Index the `company` field for fast lookup
5. **Return full customer object**: Include id, name, company, email, phone, address

## Agent Usage Flow

```
1. get_caller_context(phone=caller_id) → matched: false
2. find_customer_by_phone(phone=caller_id) → null
3. find_customer_by_email(email=caller_email) → null
4. find_customer_by_company(company="Bluewater Industrial") → customer found ✅
5. get_customer_360(customer_id=...) → full context
6. Continue conversation with customer data
```

## Priority

**P0** — This is the root cause of customer identification failures in live tests.

## Related Issues

- Test transcript: David Chan call (Bluewater Industrial)
- Agent incorrectly used `find_customer_by_email` when given company name
- Agent escalated to Sophia Charles for customer lookup failure (wrong)
