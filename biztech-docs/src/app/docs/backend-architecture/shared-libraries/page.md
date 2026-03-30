---
title: Shared Libraries
nextjs:
  metadata:
    title: Shared Libraries
    description: The shared lib/ modules covering the database layer, handler helpers, email, search, and SNS notification helpers.
---

Deep dive into the shared libraries in `lib/` that every backend service imports: the database module, response helpers, email senders, search, and notifications. {% .lead %}

---

## Database Layer (`lib/db.js`)

The DB module wraps DynamoDB operations and **automatically appends the environment suffix** to table names:

| Method | DynamoDB Operation | Description |
| --- | --- | --- |
| `create(item, table)` | PutItem (conditional) | Creates a new item, fails if already exists |
| `getOne(id, table, sortKey?)` | GetItem | Get a single item by primary key |
| `scan(table, filterExpression?)` | Scan | Full table scan with optional filter |
| `updateDB(id, params, table, sortKey?)` | UpdateItem | Update specific fields on an item |
| `deleteOne(key, table)` | DeleteItem | Delete a single item |
| `batchGet(keys, table)` | BatchGetItem | Fetch multiple items at once |
| `batchWrite(items, table)` | BatchWriteItem | Write multiple items at once |
| `put(item, table)` | PutItem (unconditional) | Overwrite an item |
| `query(params)` | Query | Run a query with a key condition |

{% callout type="warning" title="Environment Suffix" %}
Every table name gets the `ENVIRONMENT` variable appended. In dev, `biztechEvents` stays `biztechEvents`. In production, it becomes `biztechEventsPROD`. This happens inside `db.js`, so you never need to add the suffix manually.
{% /callout %}

The `updateDB` method is smart about DynamoDB reserved words. It automatically aliases attribute names that conflict with reserved words (like `name`, `status`, `year`) using `#` prefix notation.

---

## Handler Helpers (`lib/handlerHelpers.js`)

Standard response builders that every handler uses:

| Helper | Status | When to Use |
| --- | --- | --- |
| `createResponse(code, body)` | Any | Standard response with CORS headers |
| `inputError(message)` | 400 | Missing required fields |
| `missingIdQueryResponse()` | 400 | Missing ID or query parameters |
| `missingPathParamResponse(param)` | 400 | Missing URL path parameter |
| `notFoundResponse(entity)` | 404 | Item not found in database |
| `duplicateResponse(entity)` | 409 | Item already exists |
| `notAcceptableResponse(reason)` | 406 | Validation failure |
| `checkPayloadProps(body, schema)` | - | Validates required fields and types |

All responses include CORS headers (`Access-Control-Allow-Origin: *`).

---

## Email Helpers

Two email systems:

| Module | Service | Used For |
| --- | --- | --- |
| `sesHelper.js` | AWS SES v1 | Simple emails, bulk emails |
| `sesV2Client.js` | AWS SES v2 | Template management (CRUD) |
| **SendGrid** (in registrations) | SendGrid | QR code emails, calendar invites |

---

## Search (`lib/search.js`)

Wraps Algolia for profile search:

```javascript
import { searchClient } from "./algoliaClient.js";
const index = searchClient.initIndex("blueprint-prod");
const results = await index.search(query);
```

---

## SNS Notifications (`lib/snsHelper.js`)

Sends messages to SNS topics, primarily used to notify Slack when new registrations come in.
