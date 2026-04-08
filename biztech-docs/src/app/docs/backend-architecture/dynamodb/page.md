---
title: DynamoDB Access Layer
nextjs:
  metadata:
    title: DynamoDB Access Layer
    description: Complete reference for lib/db.js — all 16 database functions, table name resolution, update expressions, reserved word handling, and error patterns.
---

All database access goes through `lib/db.js`. No handler calls the AWS SDK directly. This module handles table name resolution, pagination, update expression generation, and error formatting. {% .lead %}

---

## Table Name Resolution

Every function appends `process.env.ENVIRONMENT` to the table name:

```javascript
const resolvedTable = tableName + process.env.ENVIRONMENT
// "biztechEvents" + ""     → "biztechEvents"     (dev/staging)
// "biztechEvents" + "PROD" → "biztechEventsPROD"  (production)
```

Table name constants are in `constants/tables.js`:

```javascript
export const EVENTS_TABLE = 'biztechEvents'
export const USERS_TABLE = 'biztechUsers'
export const REGISTRATIONS_TABLE = 'biztechRegistrations'
export const MEMBERS_TABLE = 'biztechMembers2026'
// ... more tables
```

---

## Function Reference

### Read Operations

#### getOne(id, table, extraKeys?)

Fetches a single item by primary key. Returns the item or `null`.

```javascript
// Simple primary key
const user = await db.getOne('alice@example.com', USERS_TABLE)

// Composite primary key (partition + sort key)
const event = await db.getOne('blueprint', EVENTS_TABLE, { year: 2026 })
```

DynamoDB operation: `GetItem`

#### getOneCustom(params)

Pass a raw DynamoDB `GetItem` params object. For non-standard key shapes.

#### scan(table, filterObj?, indexName?)

Fetches all items from a table. Automatically paginates (loops until `LastEvaluatedKey` is null).

```javascript
// All events
const events = await db.scan(EVENTS_TABLE)

// Events from a specific year using GSI
const events2026 = await db.scan(EVENTS_TABLE, { year: 2026 }, 'year-index')
```

DynamoDB operation: `Scan` (paginated)

{% callout type="warning" title="Scan Performance" %}
Scan reads every item in the table. For large tables, prefer `query` with an index.
{% /callout %}

#### query(table, indexName, keyConditionExpression, expressionAttributeValues)

Queries a table or index with a key condition. Much faster than scan for targeted lookups.

```javascript
const regs = await db.query(
  REGISTRATIONS_TABLE,
  'event-query',
  'eventIDYear = :eiy',
  { ':eiy': 'blueprint;2026' },
)
```

DynamoDB operation: `Query`

#### batchGet(table, keys)

Fetches multiple items by their primary keys in a single request (max 100 per call).

```javascript
const items = await db.batchGet(USERS_TABLE, [
  { id: 'alice@example.com' },
  { id: 'bob@example.com' },
])
```

DynamoDB operation: `BatchGetItem`

---

### Write Operations

#### create(item, table)

Creates a new item. **Fails if an item with the same key already exists** (uses a conditional expression).

```javascript
await db.create(
  {
    id: 'blueprint',
    year: 2026,
    capac: 100,
    createdAt: Date.now(),
  },
  EVENTS_TABLE,
)
```

DynamoDB operation: `PutItem` with `ConditionExpression: 'attribute_not_exists(id)'`

Throws `ConditionalCheckFailedException` if the item exists → handler typically returns 409.

#### put(item, table, createNew?)

Creates or overwrites an item. If `createNew` is true, adds the `attribute_not_exists` condition (same as `create`).

```javascript
// Overwrite (upsert behavior)
await db.put(item, EVENTS_TABLE)

// Create only (fails if exists)
await db.put(item, EVENTS_TABLE, true)
```

DynamoDB operation: `PutItem`

#### updateDB(id, updateObj, table, extraKeys?)

Partial update — only modifies the specified fields, leaving others untouched. Automatically generates the `UpdateExpression`.

```javascript
await db.updateDB(
  'blueprint',
  {
    capac: 200,
    description: 'Updated description',
  },
  EVENTS_TABLE,
  { year: 2026 },
)
```

Under the hood, `updateDB` calls `createUpdateExpression()` which:

1. Builds `SET #v0 = :v0, #v1 = :v1, ...` from the object keys
2. Maps keys through `ExpressionAttributeNames` to handle DynamoDB reserved words (e.g. `name` → `#v0`)
3. Automatically adds `updatedAt` with the current timestamp

DynamoDB operation: `UpdateItem`

#### updateDBCustom(params)

Pass a raw DynamoDB `UpdateItem` params object. For advanced update expressions.

#### putMultiple(items, table)

Writes multiple items in a batch. Uses `BatchWriteItem` under the hood.

#### writeMultiple(writeRequests)

Executes a raw `BatchWriteItem` with custom write requests (can mix puts and deletes across tables).

---

### Delete Operations

#### deleteOne(id, table, extraKeys?)

Deletes a single item by primary key.

```javascript
await db.deleteOne('blueprint', EVENTS_TABLE, { year: 2026 })
```

DynamoDB operation: `DeleteItem`

#### batchDelete(table, keys)

Deletes multiple items by their primary keys in a single batch.

---

### Utility Functions

#### createUpdateExpression(updateObj)

Generates the `UpdateExpression`, `ExpressionAttributeNames`, and `ExpressionAttributeValues` from a plain JavaScript object. Handles DynamoDB reserved words automatically.

```javascript
const expr = db.createUpdateExpression({ name: 'New Name', capac: 100 })
// Returns:
// {
//   UpdateExpression: 'SET #v0 = :v0, #v1 = :v1, #v2 = :v2',
//   ExpressionAttributeNames: { '#v0': 'name', '#v1': 'capac', '#v2': 'updatedAt' },
//   ExpressionAttributeValues: { ':v0': 'New Name', ':v1': 100, ':v2': 1700000000000 },
// }
```

#### dynamoErrorResponse(err)

Formats a DynamoDB error into a structured error object for logging.

---

## Reserved Words

DynamoDB reserves many common words (`name`, `status`, `year`, `type`, `data`, etc.). You cannot use them directly in expressions. `db.js` handles this transparently — `createUpdateExpression` always aliases every key through `ExpressionAttributeNames` using the `#v{n}` pattern.

If you write raw DynamoDB expressions (via `updateDBCustom` or `query`), you must handle reserved words yourself.

---

## Error Patterns

| DynamoDB Error                           | When It Happens                          | Handler Action             |
| ---------------------------------------- | ---------------------------------------- | -------------------------- |
| `ConditionalCheckFailedException`        | `create()` on existing item              | Return 409 (duplicate)     |
| `ResourceNotFoundException`              | Table doesn't exist (wrong environment?) | Return 502 with table name |
| `ValidationException`                    | Bad key structure or expression          | Return 502                 |
| `ProvisionedThroughputExceededException` | Throttled (unlikely with on-demand)      | Return 502, retry later    |

---

## DynamoDB Client Setup

The DocumentClient is configured in `lib/docClient.js`:

| Environment               | Endpoint                                         |
| ------------------------- | ------------------------------------------------ |
| Local (`IS_OFFLINE=true`) | `http://localhost:8000` (DynamoDB Local)         |
| AWS                       | Default (auto-resolves to the region's endpoint) |

Region is always `us-west-2`.

---

## Related Pages

- [Handler Pattern](/docs/backend-architecture/handler-pattern) — how handlers call `db.js` functions
- [Database Overview](/docs/database) — table schemas and access patterns
- [Request Execution Path](/docs/systems/request-execution-path) — where `db.js` fits in the full request flow
