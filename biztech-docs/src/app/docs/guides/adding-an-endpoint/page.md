---
title: Adding an API Endpoint
nextjs:
  metadata:
    title: Adding an API Endpoint
    description: Step-by-step guide to adding a new backend API endpoint to the BizTech serverless app.
---

# Adding an API Endpoint

How to add a new Lambda-backed API endpoint to `serverless-biztechapp-1`. This covers the file structure, handler pattern, auth, DynamoDB access, local testing, and deployment.

---

## File Structure

Each service lives under `services/<serviceName>/`:

```
services/<serviceName>/
├── serverless.yml    # Function definitions, HTTP events, IAM permissions
├── handler.js        # Exported Lambda handlers (ESM)
└── helpers.js        # (optional) service-specific helpers
```

---

## Step 1: Create serverless.yml

Every non-hello service imports the shared API Gateway created by the `hello` service:

```yaml
service: biztechApi-myService
app: biztechapp
frameworkVersion: 3.40.0

plugins:
  - serverless-dynamodb
  - serverless-offline
  - serverless-esbuild
  - serverless-prune-plugin

provider:
  name: aws
  stage: ${file(../../serverless.common.yml):provider.stage}
  runtime: ${file(../../serverless.common.yml):provider.runtime}
  region: ${file(../../serverless.common.yml):provider.region}
  cfLogs: true
  environment:
    ENVIRONMENT: ${file(../../config.${self:provider.stage}.json):ENVIRONMENT}
  apiGateway:
    restApiId: !ImportValue ${self:provider.stage}-ExtApiGatewayRestApiId
    restApiRootResourceId: !ImportValue ${self:provider.stage}-ExtApiGatewayRestApiRootResourceId
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:Query
        - dynamodb:Scan
      Resource:
        - 'arn:aws:dynamodb:us-west-2:432714361962:table/biztechMyTable*'

custom: ${file(../../serverless.common.yml):custom}

functions:
  myGet:
    handler: handler.get
    events:
      - http:
          path: myresource/
          method: get
          cors: true
  myPost:
    handler: handler.post
    events:
      - http:
          path: myresource/
          method: post
          cors: true
```

The `apiGateway` block is required — it attaches your endpoints to the shared REST API instead of creating a separate one.

---

## Step 2: Create handler.js

The `handler` field in serverless.yml maps to **named exports** in handler.js:

```javascript
import helpers from '../../lib/handlerHelpers'
import db from '../../lib/db'
import { MY_TABLE } from '../../constants/tables'

export const get = async (event, ctx, callback) => {
  try {
    // Query string params
    const { id } = event.queryStringParameters || {}
    if (!id) return helpers.missingIdQueryResponse('item')

    const result = await db.getOne(id, MY_TABLE)
    if (!result) return helpers.notFoundResponse('item', id)

    return helpers.createResponse(200, result)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(500, { message: err.message || err })
  }
}

export const post = async (event, ctx, callback) => {
  try {
    const data = JSON.parse(event.body)

    helpers.checkPayloadProps(data, {
      name: { required: true, type: 'string' },
      eventID: { required: true, type: 'string' },
      year: { required: true, type: 'number' },
    })

    await db.create({ id: data.name, ...data }, MY_TABLE)

    return helpers.createResponse(201, data)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(500, { message: err.message || err })
  }
}
```

Every handler follows the same pattern: **parse → validate → db operation → response**.

---

## Step 3: Add Auth (Optional)

### Public endpoint (no auth)

Just `cors: true` — no `authorizer` block:

```yaml
events:
  - http:
      path: myresource/
      method: get
      cors: true
```

### Authenticated endpoint

Add the Cognito authorizer reference:

```yaml
events:
  - http:
      path: myresource/
      method: post
      cors: true
      authorizer:
        type: COGNITO_USER_POOLS
        authorizerId: ${cf:biztechApi-${file(../../serverless.common.yml):provider.stage}.CognitoAuthorizer}
```

The `CognitoAuthorizer` is created in `services/hello/serverless.yml` and shared via CloudFormation exports.

### Reading the authenticated user's email

```javascript
const email = event.requestContext?.authorizer?.claims?.email
```

### Admin-only check

```javascript
const email = event.requestContext?.authorizer?.claims?.email
if (!email?.includes('@ubcbiztech.com')) {
  return helpers.createResponse(403, 'Admin access required')
}
```

---

## Available Helpers

### handlerHelpers.js

| Function                          | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `createResponse(status, body)`    | Wraps body in Lambda proxy response with CORS headers |
| `checkPayloadProps(data, schema)` | Validates request body. Throws on failure.            |
| `missingIdQueryResponse(type)`    | 400 — "A(n) {type} id was not provided"               |
| `notFoundResponse(type, id)`      | 404                                                   |
| `duplicateResponse(prop, data)`   | 409                                                   |
| `inputError(message, data)`       | 406 — validation failure                              |

### db.js

All functions auto-append `process.env.ENVIRONMENT` to table names.

| Function                                         | Purpose                                  |
| ------------------------------------------------ | ---------------------------------------- |
| `create(item, table)`                            | PutItem with `attribute_not_exists(id)`  |
| `getOne(id, table, extraKeys)`                   | Single GetItem                           |
| `scan(table, filters, indexName)`                | Full table scan with pagination          |
| `query(table, indexName, keyCondition, filters)` | Query with key condition                 |
| `updateDB(id, obj, table)`                       | Update by id, auto-builds expressions    |
| `deleteOne(id, table, extraKeys)`                | Single DeleteItem                        |
| `put(obj, table, createNew)`                     | PutItem; `createNew=true` uses condition |
| `putMultiple(items, tables)`                     | TransactWrite up to 25 items             |
| `batchGet(batch, table)`                         | BatchGetItem                             |
| `batchDelete(items, table)`                      | BatchWrite deletes                       |

---

## Step 4: Add Table Constant

If your service uses a new DynamoDB table, add its name to `constants/tables.js`:

```javascript
export const MY_TABLE = 'biztechMyTable'
```

---

## Step 5: Test Locally

```bash
cd services/<serviceName>
sls offline start --stage dev
# API available at http://localhost:4000/dev/myresource/
```

Use a tool like `curl` or Postman to hit the local endpoint. The `--stage dev` flag uses `config.dev.json` for environment variables.

---

## Step 6: Deploy

```bash
cd services/<serviceName>
sls deploy --stage dev    # dev | staging | prod
```

If this is a brand-new service, the `hello` service must already be deployed for the stage (it creates the shared API Gateway). You do not need to redeploy `hello` when adding endpoints to existing services.

---

## Checklist

1. `services/<name>/serverless.yml` — import shared API Gateway, define IAM for tables, add function + http event
2. `services/<name>/handler.js` — export named async functions matching the `handler` field
3. Add table constant to `constants/tables.js` if new table
4. Use `helpers.checkPayloadProps()` for validation, `db.*` for data access, `helpers.createResponse()` for all returns
5. Add `authorizer` block to any endpoint that requires login
6. Test locally with `sls offline start`, deploy with `sls deploy --stage dev`

---

## Related Pages

- [Backend Architecture](/docs/backend-architecture) — handler pattern, shared libraries, service structure
- [Handler Pattern](/docs/backend-architecture/handler-pattern) — detailed handler anatomy
- [API Gateway & Authorizer](/docs/backend-architecture/api-gateway) — how the shared gateway works
- [DynamoDB Access Layer](/docs/backend-architecture/dynamodb) — `db.js` function reference
- [Endpoint Registry](/docs/systems/endpoint-registry) — all existing endpoints
