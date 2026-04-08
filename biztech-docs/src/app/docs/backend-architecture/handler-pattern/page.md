---
title: Handler Pattern
nextjs:
  metadata:
    title: Handler Pattern
    description: The standard Lambda handler pattern used across all backend services — extraction, validation, authorization, database operation, and response.
---

Every Lambda handler in the BizTech backend follows the same structure. This page documents the pattern so you can read any handler and write new ones consistently. {% .lead %}

---

## The Standard Pattern

```javascript
export const myHandler = async (event, ctx, callback) => {
  try {
    // 1. Extract inputs
    // 2. Validate
    // 3. Authorize (if needed)
    // 4. Database operation
    // 5. Return response
  } catch (err) {
    // 6. Error handling
  }
}
```

Here's each step in detail.

---

## Step 1: Extract Inputs

Handlers pull data from different parts of the Lambda event object depending on the HTTP method:

```javascript
// Path parameters: GET /events/{id}/{year}
const { id, year } = event.pathParameters

// Query strings: GET /registrations/?email=alice@example.com
const { email, eventID, year } = event.queryStringParameters || {}

// Request body: POST /events/
const data = JSON.parse(event.body)

// Auth claims (protected endpoints only):
const callerEmail = event.requestContext.authorizer.claims.email
```

---

## Step 2: Validate

Use `helpers.checkPayloadProps()` to validate request bodies:

```javascript
const error = helpers.checkPayloadProps(data, {
  eid: { type: 'string', required: true },
  year: { type: 'number', required: true },
  email: { type: 'string', required: true },
  registrationStatus: { type: 'string', required: true },
})
if (error) return helpers.inputError(error, data)
```

`checkPayloadProps` takes a payload and a schema object. Each property in the schema has:

- `required: true|false` — whether the field must be present
- `type: 'string'|'number'|'object'|'boolean'` — JavaScript type check

It returns an error message string if validation fails, or `null` if all checks pass.

For simple cases, handlers sometimes validate manually:

```javascript
if (!id) return helpers.missingPathParamResponse('event', 'id')
if (!year) return helpers.missingPathParamResponse('event', 'year')
```

---

## Step 3: Authorize (If Needed)

For admin-only endpoints, verify the caller's email domain:

```javascript
const callerEmail = event.requestContext.authorizer.claims.email
if (!callerEmail.endsWith('@ubcbiztech.com')) {
  return helpers.createResponse(403, { message: 'Not authorized' })
}
```

For user-scoped endpoints, verify the caller is accessing their own data:

```javascript
const callerEmail = event.requestContext.authorizer.claims.email
const requestedEmail = event.pathParameters.email
if (
  callerEmail !== requestedEmail &&
  !callerEmail.endsWith('@ubcbiztech.com')
) {
  return helpers.createResponse(403, { message: 'Not authorized' })
}
```

---

## Step 4: Database Operation

Use functions from `lib/db.js`:

```javascript
// Fetch one item
const event = await db.getOne(id, EVENTS_TABLE, { year: parseInt(year) })
if (!event) return helpers.notFoundResponse('event', id)

// Create a new item (fails if exists)
await db.create({ id, year, ...data, createdAt: Date.now() }, EVENTS_TABLE)

// Update an existing item
await db.updateDB(id, { name: data.name, updatedAt: Date.now() }, EVENTS_TABLE)

// Scan all items
const items = await db.scan(EVENTS_TABLE)

// Delete an item
await db.deleteOne(id, EVENTS_TABLE, { year: parseInt(year) })
```

See [DynamoDB Access Layer](/docs/backend-architecture/dynamodb) for the complete function reference.

---

## Step 5: Return Response

Always use `helpers.createResponse()`:

```javascript
return helpers.createResponse(200, result) // Success with data
return helpers.createResponse(201, { message: 'Created' }) // Created
return helpers.createResponse(200, 'Success') // Simple success
```

`createResponse` wraps the body in the Lambda proxy response format with CORS headers:

```javascript
{
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(result),
}
```

---

## Step 6: Error Handling

The catch block maps known DynamoDB errors to HTTP status codes:

```javascript
catch (err) {
  if (err.code === 'ConditionalCheckFailedException') {
    // Item already exists (from db.create conditional put)
    return helpers.duplicateResponse('item', data)  // 409
  }
  console.error(err)
  return helpers.createResponse(502, err.message || 'Internal error')
}
```

Common error mappings:

| DynamoDB Error                    | HTTP Status | Helper                                                            |
| --------------------------------- | ----------- | ----------------------------------------------------------------- |
| `ConditionalCheckFailedException` | 409         | `helpers.duplicateResponse()`                                     |
| Validation failure                | 406         | `helpers.inputError()`                                            |
| Item not found                    | 404         | `helpers.notFoundResponse()`                                      |
| Missing parameter                 | 400         | `helpers.missingPathParamResponse()` / `missingIdQueryResponse()` |
| Anything else                     | 502         | `helpers.createResponse(502, message)`                            |

---

## Helper Functions Reference

All from `lib/handlerHelpers.js`:

| Function                                   | Returns                              | When to Use                            |
| ------------------------------------------ | ------------------------------------ | -------------------------------------- |
| `createResponse(statusCode, body)`         | Full Lambda proxy response with CORS | Every response                         |
| `checkPayloadProps(payload, schema)`       | Error string or `null`               | Body validation                        |
| `inputError(message, data)`                | 406 response                         | Invalid input from `checkPayloadProps` |
| `missingPathParamResponse(type, param)`    | 400 response                         | Path parameter missing                 |
| `missingIdQueryResponse(type)`             | 400 response                         | Query string ID missing                |
| `notFoundResponse(type, id, secondaryKey)` | 404 response                         | Item not in database                   |
| `duplicateResponse(prop, data)`            | 409 response                         | Item already exists                    |

---

## Complete Example: Events create Handler

```javascript
import helpers from '../../lib/handlerHelpers'
import db from '../../lib/db'
import { EVENTS_TABLE } from '../../constants/tables'

export const create = async (event) => {
  try {
    // 1. Extract inputs
    const data = JSON.parse(event.body)

    // 2. Validate
    const error = helpers.checkPayloadProps(data, {
      id: { type: 'string', required: true },
      year: { type: 'number', required: true },
      capac: { type: 'number', required: true },
    })
    if (error) return helpers.inputError(error, data)

    // 3. Authorize (Cognito authorizer handles JWT validation;
    //    handler checks admin domain if needed)
    const email = event.requestContext.authorizer.claims.email
    if (!email.endsWith('@ubcbiztech.com')) {
      return helpers.createResponse(403, { message: 'Not authorized' })
    }

    // 4. Database operation
    await db.create(
      {
        id: data.id,
        year: data.year,
        capac: data.capac,
        createdAt: Date.now(),
        ...data,
      },
      EVENTS_TABLE,
    )

    // 5. Return response
    return helpers.createResponse(201, { message: 'Event created' })
  } catch (err) {
    // 6. Error handling
    if (err.code === 'ConditionalCheckFailedException') {
      return helpers.duplicateResponse('event', data)
    }
    console.error(err)
    return helpers.createResponse(502, err.message)
  }
}
```

---

## Serverless.yml Function Definition

Each handler function is wired to an HTTP endpoint in the service's `serverless.yml`:

```yaml
functions:
  create:
    handler: handler.create
    events:
      - http:
          path: events/
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: ${cf:biztechApi-${self:provider.stage}.CognitoAuthorizer}
```

The `handler` field maps to the exported function: `handler.create` means the `create` export from `handler.js`.

---

## Related Pages

- [DynamoDB Access Layer](/docs/backend-architecture/dynamodb) — `db.js` function reference
- [API Gateway & Authorizer](/docs/backend-architecture/api-gateway) — how requests reach the handler
- [Request Execution Path](/docs/systems/request-execution-path) — full request trace from browser to database
- [Services & Patterns](/docs/backend-architecture/services) — environment config and service structure
