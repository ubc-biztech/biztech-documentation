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

| Environment | API Domain | Config File | ENVIRONMENT var |
| --- | --- | --- | --- |
| **Dev** | `api-dev.ubcbiztech.com` | `config.dev.json` | `""` (empty) |
| **Staging** | `api-staging.ubcbiztech.com` | `config.staging.json` | `""` (empty) |
| **Production** | `api.ubcbiztech.com` | `config.prod.json` | `"PROD"` |

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

This means all 19 services share a single API Gateway and Cognito authorizer, appearing as one unified API.

### Authorization

Most endpoints require a Cognito JWT token. Some endpoints are public (no auth):

| Public Endpoints | Service | Why |
| --- | --- | --- |
| `GET /hello` | hello | Health check |
| `GET /users/check/{email}` | users | Pre-login check |
| `GET /users/isMember/{email}` | users | Membership check |
| `GET /profiles/profile/{profileID}` | profiles | Public profile view |
| `POST /payments/webhook` | payments | Stripe webhook |
| `POST /discord/*` | bots | Discord webhook |
| `GET /events/nearest` | events | Upcoming event |
| `GET /quests/kiosk/*` | quests | Kiosk display |

Admin-only endpoints additionally check the email domain:

```javascript
const email = event.headers.authorization; // Decoded from Cognito JWT
if (!email.includes("@ubcbiztech.com")) {
  return helpers.createResponse(403, "Unauthorized - admin access required");
}
```

---

## Local Development

### How `index.js` Works

When you run `npm start`, the entry point (`index.js`) does the following:

1. Starts DynamoDB Local on port 8000
2. Spawns each service with `serverless offline` on ports 4001–4019
3. Runs a lightweight HTTP proxy on port 4000 that:
   - Receives all requests
   - Matches the URL path to the correct service
   - Forwards the request to the service's port
   - Returns the response

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
    const body = JSON.parse(event.body || "{}");
    const { id } = event.pathParameters || {};

    // 2. Validate
    const error = helpers.checkPayloadProps(body, {
      name: "string",
      year: "number",
    });
    if (error) return helpers.inputError(error);

    // 3. Business logic
    const result = await db.create({ id, ...body }, TABLE_NAME);

    // 4. Return success
    return helpers.createResponse(201, result);
  } catch (err) {
    console.error(err);
    return helpers.createResponse(err.statusCode || 502, err.message);
  }
};
```

### Error Handling

Use the helper response functions for consistent error responses. Don't throw raw errors. Catch them and return structured responses:

```javascript
// ✅ Good
if (!user) return helpers.notFoundResponse("User");

// ❌ Bad
if (!user) throw new Error("User not found");
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

Services that need admin access check the email from the Cognito JWT:

```javascript
const email = event.requestContext?.authorizer?.jwt?.claims?.email;
if (!email || !email.includes("@ubcbiztech.com")) {
  return helpers.createResponse(403, "Admin access required");
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
frameworkVersion: "3"

custom: ${file(../../serverless.common.yml):custom}
provider: ${file(../../serverless.common.yml):provider}
plugins: ${file(../../serverless.common.yml):plugins}

functions:
  myServiceGet:
    handler: handler.get
    events:
      - httpApi:
          path: /my-service
          method: get
          authorizer:
            name: cognitoAuthorizer
```

3. **Create `handler.js`:**

```javascript
import helpers from "../../lib/handlerHelpers.js";
import db from "../../lib/db.js";

export const get = async (event) => {
  try {
    // Your logic here
    return helpers.createResponse(200, { message: "Success" });
  } catch (err) {
    console.error(err);
    return helpers.createResponse(502, err.message);
  }
};
```

4. **Add to `sls-multi-gateways.yml`** so it deploys with everything else.

5. **Add to `index.js`** for local development (assign a port).
