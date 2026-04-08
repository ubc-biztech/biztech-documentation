---
title: API Gateway & Authorizer
nextjs:
  metadata:
    title: API Gateway & Authorizer
    description: How the shared API Gateway REST API works, how services join it, how the Cognito authorizer validates tokens, and how local routing replaces it in development.
---

All 21 backend services share a single API Gateway REST API. The `hello` service creates it and exports it; every other service imports and attaches its routes. {% .lead %}

---

## Architecture

```
                  Internet
                     │
               ┌─────┴─────┐
               │ API Gateway│  (REST API, type: edge)
               │  shared    │
               └─────┬─────┘
          ┌──────────┼──────────────────┐
          │          │                  │
     GET /events  POST /users    GET /members
          │          │                  │
    ┌─────┴──┐  ┌───┴────┐    ┌───────┴──┐
    │ events │  │ users  │    │ members  │
    │ Lambda │  │ Lambda │    │ Lambda   │
    └────────┘  └────────┘    └──────────┘
```

---

## How the Shared Gateway Works

### Step 1: `hello` Creates It

The `hello` service (`services/hello/serverless.yml`) is the only service that creates the REST API resource. It exports two CloudFormation values:

```yaml
resources:
  Resources:
    ApiGatewayRestApi:
      Type: AWS::ApiGateway::RestApi
      Properties:
        Name: ${self:provider.stage}-biztech-api

    CognitoAuthorizer:
      Type: AWS::ApiGateway::Authorizer
      Properties:
        Name: CognitoAuthorizer
        Type: COGNITO_USER_POOLS
        IdentitySource: method.request.header.Authorization
        RestApiId: !Ref ApiGatewayRestApi
        ProviderARNs:
          - arn:aws:cognito-idp:us-west-2:432714361962:userpool/us-west-2_w0R176hhp
        AuthorizerResultTtlInSeconds: 60

  Outputs:
    ApiGatewayRestApiId:
      Value: !Ref ApiGatewayRestApi
      Export:
        Name: ${self:provider.stage}-ExtApiGatewayRestApiId

    ApiGatewayRestApiRootResourceId:
      Value: !GetAtt ApiGatewayRestApi.RootResourceId
      Export:
        Name: ${self:provider.stage}-ExtApiGatewayRestApiRootResourceId

    CognitoAuthorizer:
      Value: !Ref CognitoAuthorizer
      Export:
        Name: ${self:provider.stage}-CognitoAuthorizer
```

### Step 2: Other Services Import It

Every other service references these exports in its `serverless.yml` via the shared config in `serverless.common.yml`:

```yaml
provider:
  apiGateway:
    restApiId:
      Fn::ImportValue: ${self:provider.stage}-ExtApiGatewayRestApiId
    restApiRootResourceId:
      Fn::ImportValue: ${self:provider.stage}-ExtApiGatewayRestApiRootResourceId
```

This means all services attach their routes to the same API Gateway, producing a unified URL:

```
https://api.ubcbiztech.com/events/      → events service
https://api.ubcbiztech.com/users/       → users service
https://api.ubcbiztech.com/members/     → members service
https://api.ubcbiztech.com/registrations/ → registrations service
```

---

## Cognito Authorizer

### What It Does

When an endpoint has the Cognito authorizer configured, API Gateway:

1. Extracts the JWT from the `Authorization: Bearer {token}` header
2. Validates the token signature against the Cognito User Pool's keys
3. Checks the token hasn't expired
4. **Caches the result for 60 seconds** (per `AuthorizerResultTtlInSeconds`)
5. If valid: injects the JWT claims into `event.requestContext.authorizer.claims` and invokes the Lambda
6. If invalid: returns `401 Unauthorized` immediately — the Lambda is never invoked

### How to Use It in a Service

```yaml
functions:
  myFunction:
    handler: handler.myFunction
    events:
      - http:
          path: my-path/
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: ${cf:biztechApi-${self:provider.stage}.CognitoAuthorizer}
```

### Public Endpoints

Omit the `authorizer` block:

```yaml
functions:
  publicFunction:
    handler: handler.publicFunction
    events:
      - http:
          path: public-path/
          method: get
          cors: true
          # No authorizer = public
```

---

## CORS Configuration

Every endpoint has `cors: true` in its `serverless.yml` definition. API Gateway auto-generates OPTIONS preflight responses.

The Lambda response also includes CORS headers via `helpers.createResponse()`:

```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}
```

---

## Custom Domains

Defined in `serverless.common.yml`:

| Stage   | Domain                       |
| ------- | ---------------------------- |
| dev     | `api-dev.ubcbiztech.com`     |
| staging | `api-staging.ubcbiztech.com` |
| prod    | `api.ubcbiztech.com`         |

The domains are managed via the `serverless-domain-manager` plugin (referenced in the common config).

---

## Local Development: Express Proxy

Locally, API Gateway is replaced by an Express proxy. The proxy runs on **port 4000** and routes requests to individual `serverless-offline` instances running on ports 4001+.

The routing is configured in `sls-multi-gateways.yml`:

```yaml
# Port is 4001; each service gets the next port
- srvName: events
  srvPath: events
  srvSource: services/events

- srvName: members
  srvPath: members
  srvSource: services/members
```

The proxy reads this config and forwards requests like:

```
http://localhost:4000/events/  →  http://localhost:4001/events/
http://localhost:4000/users/   →  http://localhost:400X/users/
```

**Key difference from production**: The proxy does not run the Cognito Authorizer. The `serverless-offline` plugin skips authorizer validation, so any request works locally without a valid JWT. This means authorization bugs might not surface until staging/production.

---

## Deployment Order

Because of the CloudFormation export/import dependency:

1. **Deploy `hello` first** — it creates the API Gateway and Authorizer
2. **Deploy other services in any order** — they import the gateway

If you deploy another service before `hello`, CloudFormation will fail because the imported values don't exist yet.

---

## Rate Limits and Throttling

API Gateway has default throttling limits:

- **10,000 requests/second** (account-level)
- **5,000 concurrent executions** (Lambda default)

These limits are far above BizTech's traffic. The only time throttling matters is during registration spikes for popular events with hundreds of simultaneous sign-ups.

---

## Related Pages

- [Handler Pattern](/docs/backend-architecture/handler-pattern) — what happens after the request reaches the Lambda
- [Authentication System](/docs/systems/authentication) — how Cognito tokens are issued and validated
- [Services & Patterns](/docs/backend-architecture/services) — environment config and deployment setup
- [Endpoint Registry](/docs/systems/endpoint-registry) — the complete list of all routes
