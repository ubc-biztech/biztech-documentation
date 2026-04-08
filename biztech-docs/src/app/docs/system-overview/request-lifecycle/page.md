---
title: Request Lifecycle
nextjs:
  metadata:
    title: Request Lifecycle
    description: How a request flows from the browser through the frontend, API Gateway, Lambda handler, and DynamoDB.
---

Step-by-step walkthrough of how a request flows through the BizTech system, from user action in the browser to DynamoDB and back. {% .lead %}

---

## Overview

Every API call follows the same path:

```
1. User action in browser
2. Frontend calls fetchBackend() or fetchBackendFromServer()
3. Request hits API Gateway with JWT in Authorization header
4. Cognito Authorizer validates the token (or skips for public endpoints)
5. Lambda handler runs (services/{name}/handler.js)
6. Handler accesses DynamoDB via lib/db.js
7. Handler returns response via helpers.createResponse()
8. Response flows back through API Gateway to the frontend
```

---

## Step 1: Frontend Makes the Request

All API calls go through one of two functions in `src/lib/db.ts`:

### Client-Side (fetchBackend)

Used in React components, hooks, and React Query queries:

```typescript
const events = await fetchBackend({
  endpoint: '/events',
  method: 'GET',
})
```

This function:

1. Calls `fetchAuthSession()` from Amplify to get the current JWT
2. Adds `Authorization: Bearer <idToken>` to the request headers
3. Calls `fetch(API_URL + endpoint, { method, headers, body })`
4. Parses the JSON response
5. Throws on non-200 responses with `{ status, message }`

### Server-Side (fetchBackendFromServer)

Used in `getServerSideProps` and the Next.js middleware:

```typescript
const user = await fetchBackendFromServer({
  endpoint: '/users/self',
  method: 'GET',
  nextServerContext: { request: req, response: res },
})
```

This function:

1. Calls `runWithAmplifyServerContext()` to extract the JWT from request cookies
2. Adds the same `Authorization: Bearer <idToken>` header
3. Otherwise behaves identically to `fetchBackend`

### URL Resolution

The `API_URL` is determined by `NEXT_PUBLIC_REACT_APP_STAGE` in `src/lib/dbconfig.ts`:

- `local` → `http://localhost:4000`
- `production` → `https://api.ubcbiztech.com`
- anything else → `https://api-dev.ubcbiztech.com`

---

## Step 2: API Gateway Receives the Request

In production, all services share a single **REST API Gateway** (not HTTP API). The gateway was created by the `hello` service and exported via CloudFormation. Every other service imports it.

The gateway:

1. Matches the URL path to the correct Lambda function
2. If the route has a Cognito Authorizer: validates the JWT, rejects with 401 if invalid
3. If the route has no authorizer: passes the request through (public endpoint)
4. Invokes the Lambda function with the full `event` object

### Local Development Equivalent

When running locally, the Express proxy on port 4000 does the routing instead of API Gateway. It looks at the URL path prefix and forwards to the correct `sls offline` instance:

```
/events/*  → localhost:4001
/hello/*   → localhost:4002
/members/* → localhost:4003
...etc (sequential from base port 4001)
```

Cognito validation is skipped locally — `sls offline` passes all requests through.

---

## Step 3: Lambda Handler Executes

Every handler is an exported async function in `services/{name}/handler.js`:

```javascript
export const get = async (event) => {
  try {
    // 1. Extract input
    const { eventId, year } = event.pathParameters || {}
    const body = JSON.parse(event.body || '{}')
    const email = event.requestContext?.authorizer?.claims?.email

    // 2. Validate
    if (!eventId) return helpers.missingIdQueryResponse()

    // 3. Business logic
    const result = await db.getOne(eventId, EVENTS_TABLE, {
      year: parseInt(year),
    })
    if (!result) return helpers.notFoundResponse('Event not found')

    // 4. Return response
    return helpers.createResponse(200, result)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(err.statusCode || 502, err.message)
  }
}
```

### The event Object

The Lambda `event` object contains:

| Field                                    | What It Contains                                                |
| ---------------------------------------- | --------------------------------------------------------------- |
| `event.body`                             | Request body (JSON string, needs parsing)                       |
| `event.pathParameters`                   | URL path params (e.g. `{ eventId: 'blueprint', year: '2026' }`) |
| `event.queryStringParameters`            | Query string params                                             |
| `event.requestContext.authorizer.claims` | Decoded Cognito JWT claims (email, sub, etc.)                   |
| `event.headers`                          | Request headers                                                 |

### Admin Check Pattern

Handlers that need admin access check the email domain:

```javascript
const email = event.requestContext.authorizer.claims.email.toLowerCase()
if (!email.endsWith('@ubcbiztech.com')) {
  return helpers.createResponse(403, 'Admin access required')
}
```

---

## Step 4: DynamoDB Access

Handlers use `lib/db.js` for all database operations. The module automatically appends the `ENVIRONMENT` variable to table names:

```javascript
import db from '../../lib/db.js'
import { EVENTS_TABLE } from '../../constants/tables.js'

// In dev: accesses "biztechEvents"
// In prod: accesses "biztechEventsPROD"
const event = await db.getOne('blueprint', EVENTS_TABLE, { year: 2026 })
```

Key operations:

| Method                                     | What It Does                                           |
| ------------------------------------------ | ------------------------------------------------------ |
| `db.create(item, table)`                   | PutItem with existence check (fails if already exists) |
| `db.getOne(id, table, sortKey?)`           | GetItem by primary key                                 |
| `db.scan(table, filter?)`                  | Full table scan                                        |
| `db.updateDB(id, params, table, sortKey?)` | UpdateItem (handles reserved words automatically)      |
| `db.deleteOne(key, table)`                 | DeleteItem                                             |
| `db.query(params)`                         | Query with key conditions                              |
| `db.batchGet(keys, table)`                 | BatchGetItem                                           |
| `db.batchWrite(items, table)`              | BatchWriteItem                                         |

---

## Step 5: Response Returns

Handlers return responses using `lib/handlerHelpers.js`:

```javascript
return helpers.createResponse(200, { id: 'blueprint', year: 2026, ... })
```

`createResponse` builds a Lambda proxy integration response:

```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  },
  "body": "{\"id\":\"blueprint\",\"year\":2026,...}"
}
```

The response flows back through API Gateway (which adds CORS headers in production) to the frontend, where `fetchBackend` parses the JSON body and returns it to the caller.

---

## Concrete Example: Loading the Events Page

1. User navigates to `/events`
2. The `EventsPage` component mounts and calls `useEvents()` (React Query hook)
3. `useEvents()` calls `fetchBackend({ endpoint: '/events', method: 'GET' })`
4. `fetchBackend` gets the JWT from Amplify, adds `Authorization: Bearer <token>`
5. Request goes to `https://api.ubcbiztech.com/events` (or localhost:4000/events locally)
6. API Gateway validates the JWT, invokes the `eventsGetAll` Lambda
7. The handler calls `db.scan(EVENTS_TABLE)` to get all events from DynamoDB
8. Handler returns `helpers.createResponse(200, events)`
9. React Query caches the result and the component renders the event list

---

## Related Pages

- [System Overview](/docs/system-overview) — high-level architecture
- [Frontend Architecture](/docs/frontend-architecture) — how the frontend makes API calls
- [Backend Architecture](/docs/backend-architecture) — handler patterns and shared libraries
- [Authentication](/docs/authentication) — how JWT tokens are managed and validated
