---
title: Services & Patterns
nextjs:
  metadata:
    title: Services & Patterns
    description: Environment configuration, API Gateway, local development, testing, code patterns, and how to add a new service.
---

How the backend environment works, how services share an API Gateway, how local development runs, and the patterns you should follow when writing code. {% .lead %}

---

## Environment Configuration

### Three Environments

| Environment    | API Domain                   | Config File           | ENVIRONMENT var |
| -------------- | ---------------------------- | --------------------- | --------------- |
| **Dev**        | `api-dev.ubcbiztech.com`     | `config.dev.json`     | `""` (empty)    |
| **Staging**    | `api-staging.ubcbiztech.com` | `config.staging.json` | `""` (empty)    |
| **Production** | `api.ubcbiztech.com`         | `config.prod.json`    | `"PROD"`        |

### Key Difference

The `ENVIRONMENT` suffix on table names is the **only** difference between dev/staging and production data. Both dev and staging use the same base table names (which means they share data).

{% callout type="warning" title="Dev and Staging Share Data" %}
Because both dev and staging have `ENVIRONMENT=""`, they read from and write to the same DynamoDB tables. Be careful when testing destructive operations in staging.
{% /callout %}

---

## API Gateway Architecture

### Shared API Gateway

The `hello` service creates and exports the API Gateway. All other services import it:

```
hello service (port 4001)
  ├── Creates REST API Gateway
  ├── Creates Cognito Authorizer
  └── Exports both via CloudFormation

All other services
  └── Import the shared Gateway + Authorizer via CloudFormation references
```

This means all services share a single API Gateway and Cognito authorizer, appearing as one unified API.

### Authorization

Most endpoints require a Cognito JWT token. Some endpoints are public (no auth):

| Public Endpoints                     | Service       | Why                       |
| ------------------------------------ | ------------- | ------------------------- |
| `GET /hello`                         | hello         | Health check              |
| `GET /users/check/{email}`           | users         | Pre-login existence check |
| `GET /users/checkMembership/{email}` | users         | Membership flag check     |
| `GET /profiles/profile/{profileID}`  | profiles      | Public profile view       |
| `POST /payments/webhook`             | payments      | Stripe webhook (signed)   |
| `GET /events`                        | events        | Event listing             |
| `GET /events/{id}/{year}`            | events        | Single event              |
| `GET /events/getActiveEvent`         | events        | Next upcoming event       |
| `POST /registrations`                | registrations | Register for event        |

Admin-only endpoints additionally check the email domain in handler code:

---

## Local Development

### How index.js Works

When you run `npm start`, the entry point (`index.js`) does the following:

1. Reads `sls-multi-gateways.yml` to get the service list and base port (4001)
2. Spawns each service with `sls offline` starting at port 4001, incrementing by one per service
3. Runs a lightweight Express proxy on port 4000 that matches URL path prefixes to the correct service port

Each service's path prefix comes from the `srvPath` field in `sls-multi-gateways.yml`. For example, the events service has `srvPath: events`, so `/events/*` requests are routed to it.

{% callout title="DynamoDB Local" %}
DynamoDB Local starts automatically when `sls offline` starts for any service that has the `serverless-dynamodb` plugin configured. It runs on port 8000. Most services configure it via their `serverless.yml` with `noStart: true` (they reuse the same instance).
{% /callout %}

This simulates the production API Gateway routing behavior locally.

### Testing

```bash
# Run all unit tests
npm test

# Run tests for a specific service
cd services/events && npx mocha test/

# Run integration tests
bash scripts/run_itests.sh
```

Tests use **Mocha** + **Chai** + **Sinon** for assertions, mocking, and stubbing.

---

## Code Patterns & Conventions

### Handler Pattern

Every handler follows this structure:

```javascript
export const myHandler = async (event) => {
  try {
    // 1. Parse input
    const body = JSON.parse(event.body || '{}')
    const { id } = event.pathParameters || {}

    // 2. Validate
    const error = helpers.checkPayloadProps(body, {
      name: 'string',
      year: 'number',
    })
    if (error) return helpers.inputError(error)

    // 3. Business logic
    const result = await db.create({ id, ...body }, TABLE_NAME)

    // 4. Return success
    return helpers.createResponse(201, result)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(err.statusCode || 502, err.message)
  }
}
```

### Error Handling

Use the helper response functions for consistent error responses. Don't throw raw errors. Catch them and return structured responses:

```javascript
// ✅ Good
if (!user) return helpers.notFoundResponse('User')

// ❌ Bad
if (!user) throw new Error('User not found')
```

### Module System

The backend uses **ES Modules** (not CommonJS). Files use `import`/`export` syntax:

```javascript
// ✅ ES Modules
import db from "../../lib/db.js";
export const handler = async (event) => { ... };

// ❌ CommonJS (don't use)
const db = require("../../lib/db.js");
module.exports.handler = async (event) => { ... };
```

{% callout title="File Extensions Required" %}
With ES Modules, you must include `.js` in import paths: `import db from "../../lib/db.js"`, not `import db from "../../lib/db"`.
{% /callout %}

### Admin Checks

Services that need admin access check the email from the Cognito JWT. With REST API Gateway (which is what this backend uses), claims are accessed via `authorizer.claims`:

```javascript
const email = event.requestContext?.authorizer?.claims?.email
if (!email || !email.includes('@ubcbiztech.com')) {
  return helpers.createResponse(403, 'Admin access required')
}
```

---

## Adding a New Service

1. **Create the service directory:**

```bash
mkdir services/my-service
```

2. **Create `serverless.yml`:**

```yaml
service: biztechapp-my-service
frameworkVersion: '3'

custom: ${file(../../serverless.common.yml):custom}
provider: ${file(../../serverless.common.yml):provider}
plugins: ${file(../../serverless.common.yml):plugins}

functions:
  myServiceGet:
    handler: handler.get
    events:
      - http:
          path: /my-service
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
```

3. **Create `handler.js`:**

```javascript
import helpers from '../../lib/handlerHelpers.js'
import db from '../../lib/db.js'

export const get = async (event) => {
  try {
    // Your logic here
    return helpers.createResponse(200, { message: 'Success' })
  } catch (err) {
    console.error(err)
    return helpers.createResponse(502, err.message)
  }
}
```

4. **Add to `sls-multi-gateways.yml`** so it runs locally and deploys with everything else:

```yaml
- srvName: my-service
  srvPath: my-service
  srvSource: services/my-service
```

The proxy automatically assigns the next available port starting from the base port in the config. No manual port assignment is needed.
