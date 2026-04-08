---
title: Request Execution Path
nextjs:
  metadata:
    title: Request Execution Path
    description: The full execution path of a request through the BizTech app, from a user action in the browser through API Gateway, Lambda, DynamoDB, and back.
---

What happens between a user clicking a button and the data appearing on screen. This traces a request through every layer of the stack. {% .lead %}

---

## The Full Path

```
Browser → fetchBackend() → API Gateway → Cognito Authorizer → Lambda → DynamoDB → Lambda → API Gateway → fetchBackend() → React state
```

Here is each step in detail, using a concrete example: **loading the events page**.

---

## Step 1: Component Renders, Hook Fires

The events page (`src/pages/index.tsx` or equivalent) uses a React Query hook:

```tsx
const { data: events, isLoading } = useEvents()
```

This hook (in `src/queries/events.ts`) fires automatically on mount:

```typescript
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () =>
      fetchBackend({
        endpoint: '/events',
        method: 'GET',
        authenticatedCall: false,
      }),
    staleTime: 60 * 1000,
  })
}
```

React Query checks its cache first. If the data is still fresh (within `staleTime`), it returns cached data immediately and doesn't make a network request.

---

## Step 2: fetchBackend() Sends the Request

If the cache is stale or empty, `fetchBackend()` in `src/lib/db.ts` runs:

1. **Resolve the URL**: `API_URL` from `dbconfig.ts` → `https://api.ubcbiztech.com` (production)
2. **Auth check**: `authenticatedCall` is `false`, so no JWT is attached
3. **Send**: `fetch('https://api.ubcbiztech.com/events', { method: 'GET', headers: { 'Content-Type': 'application/json' } })`
4. **Parse response**: `response.json()`

For authenticated calls, step 2 would call `currentSession()` to get the Cognito ID token and attach it as `Authorization: Bearer {token}`.

---

## Step 3: API Gateway Receives the Request

The request hits AWS API Gateway (REST API, type `edge`). API Gateway:

1. **Routes the request**: Matches `GET /events` to the `getAll` Lambda function in the events service
2. **Runs the authorizer** (if configured): For this endpoint, there's no authorizer — it's public. For protected endpoints, the Cognito authorizer validates the JWT and injects claims into the event object.
3. **Invokes the Lambda function**: Passes the full HTTP event including headers, path parameters, query strings, and (if authed) the authorizer claims.

### The Lambda Event Object (Protected Endpoint)

For a protected endpoint like `GET /users/{email}`, the Lambda function receives:

```javascript
{
  httpMethod: 'GET',
  path: '/users/student@example.com',
  pathParameters: { email: 'student@example.com' },
  queryStringParameters: null,
  headers: { Authorization: 'Bearer eyJ...' },
  body: null,
  requestContext: {
    authorizer: {
      claims: {
        email: 'student@example.com',
        sub: 'abc123-def456',
        'cognito:username': 'student@example.com',
      }
    }
  }
}
```

---

## Step 4: Lambda Handler Executes

Every handler follows the same pattern (in `services/events/handler.js`):

```javascript
export const getAll = async (event, ctx, callback) => {
  try {
    // 1. Extract inputs
    const { id } = event.queryStringParameters || {}

    // 2. Database operation
    const result = await db.scan(
      EVENTS_TABLE,
      id ? { id } : undefined,
      'year-index',
    )

    // 3. Process data (sort by date)
    result.sort((a, b) => a.startDate - b.startDate)

    // 4. Return response
    return helpers.createResponse(200, result)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(502, 'Could not get events')
  }
}
```

The handler uses two shared libraries:

- **`lib/db.js`**: DynamoDB operations. Auto-appends the `ENVIRONMENT` suffix to table names. Every function handles pagination, reserved words, and error conversion.
- **`lib/handlerHelpers.js`**: Response builders. `createResponse(statusCode, body)` returns the correct shape with CORS headers.

---

## Step 5: DynamoDB Access

`db.scan(EVENTS_TABLE)` does:

1. Resolves the table name: `biztechEvents` + `process.env.ENVIRONMENT` → `biztechEvents` (dev) or `biztechEventsPROD` (production)
2. Runs a DynamoDB Scan with automatic pagination (loops until `LastEvaluatedKey` is null)
3. Returns all items as a JavaScript array

For key-based lookups, `db.getOne(id, table, extraKeys)` uses GetItem (much faster than Scan).

Common DynamoDB operations used by handlers:

| Function                               | DynamoDB Operation    | When Used                                 |
| -------------------------------------- | --------------------- | ----------------------------------------- |
| `db.getOne(id, table)`                 | GetItem               | Fetch single item by primary key          |
| `db.scan(table, filters, index)`       | Scan (paginated)      | Fetch all items, optionally filtered      |
| `db.query(table, index, keyCondition)` | Query                 | Fetch items by sort key pattern           |
| `db.create(item, table)`               | PutItem (conditional) | Create new item (fails if exists)         |
| `db.put(item, table, createNew)`       | PutItem               | Create or overwrite item                  |
| `db.updateDB(id, obj, table)`          | UpdateItem            | Partial update, auto-generates expression |
| `db.deleteOne(id, table)`              | DeleteItem            | Remove single item                        |

---

## Step 6: Response Returns

The handler returns a response object:

```javascript
helpers.createResponse(200, result)
// Returns:
{
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(result),
}
```

API Gateway passes this back to the browser. `fetchBackend()` parses the JSON body and returns it to the React Query hook. React Query caches the result and triggers a re-render.

---

## Step 7: UI Updates

```tsx
const { data: events, isLoading } = useEvents()

if (isLoading) return <Spinner />
return <EventGrid events={events} />
```

The component re-renders with the data. React Query manages refetching in the background when the data becomes stale.

---

## Write Path (Mutations)

The write path follows the same pattern in reverse:

```
User fills form → handleSubmit() → fetchBackend({ method: 'POST', data: {...} })
  → API Gateway → Lambda handler → validates input → db.create(item, table)
  → returns 201 → fetchBackend resolves → queryClient.invalidateQueries()
  → React Query refetches affected queries → UI updates
```

The handler always validates before writing:

```javascript
export const create = async (event) => {
  const data = JSON.parse(event.body)

  // Validate required fields
  const error = helpers.checkPayloadProps(data, {
    name: { type: 'string', required: true },
    year: { type: 'number', required: true },
  })
  if (error) return helpers.inputError(error)

  // Write to DB
  await db.create({ id: data.name, ...data, createdAt: Date.now() }, MY_TABLE)
  return helpers.createResponse(201, { message: 'Created!' })
}
```

---

## Error Path

When something fails, errors propagate back through the same chain:

```
db.create() throws ConditionalCheckFailedException
  → handler catches it → helpers.createResponse(409, 'Already exists')
  → API Gateway returns 409 → fetchBackend() parses response
  → throws { status: 409, message: 'Already exists' }
  → React Query marks query as error → component shows error state
```

---

## Local vs Production

| Layer            | Local                               | Production                            |
| ---------------- | ----------------------------------- | ------------------------------------- |
| Frontend         | `localhost:3000`                    | Vercel (`app.ubcbiztech.com`)         |
| API URL          | `localhost:4000` (Express proxy)    | API Gateway (`api.ubcbiztech.com`)    |
| Request routing  | Express proxy routes by path prefix | API Gateway routes by function config |
| Lambda execution | `serverless-offline` plugin         | AWS Lambda                            |
| Database         | DynamoDB (dev tables, empty suffix) | DynamoDB (prod tables, `PROD` suffix) |
| Auth             | Cognito (same user pool)            | Cognito (same user pool)              |

Locally, the Express proxy on port 4000 replaces API Gateway. It reads `sls-multi-gateways.yml` and routes requests to individual services running on ports 4001+.

---

## Related Pages

- [Frontend–Backend Integration](/docs/systems/frontend-backend-integration) — the `fetchBackend` layer in detail
- [Handler Pattern](/docs/backend/handler-pattern) — how every Lambda handler is structured
- [API Gateway & Authorizer](/docs/backend/api-gateway) — how requests are routed and authorized
- [DynamoDB Access Layer](/docs/backend/dynamodb) — the `db.js` module
