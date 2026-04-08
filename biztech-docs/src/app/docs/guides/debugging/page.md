---
title: Local Development & Debugging
nextjs:
  metadata:
    title: Local Development & Debugging
    description: How to run the BizTech frontend and backend locally, debug common issues, and inspect data.
---

# Local Development & Debugging

How to run the full stack locally, connect frontend to backend, and debug common issues.

---

## Starting the Backend

The backend uses Serverless Framework offline mode behind an Express proxy on port 4000.

```bash
cd serverless-biztechapp-1

# Start DynamoDB Local first (Docker or Java)
docker run -p 8000:8000 amazon/dynamodb-local

# Seed local DB with data
npm run init:db

# Start all services
npm run dev
```

This launches each service on sequential ports (events=4001, hello=4002, members=4003, …) via `concurrently`, with an Express proxy on **port 4000** that routes by path prefix.

To start only specific services:

```bash
npm run dev -- events members registrations
```

### Backend environment variables

Create a `.env` file in the repo root:

```
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
NODE_ENV=development
```

Setting `NODE_ENV=development` routes DynamoDB calls to `localhost:8000` instead of AWS.

---

## Starting the Frontend

```bash
cd bt-web-v2
npm run dev    # starts on http://localhost:3000
```

### Connecting frontend to local backend

Set `NEXT_PUBLIC_REACT_APP_STAGE` in `bt-web-v2/.env`:

| Value          | API target                                   |
| -------------- | -------------------------------------------- |
| `local`        | `http://localhost:4000` (your local backend) |
| `dev` or unset | `https://api-dev.ubcbiztech.com`             |
| `production`   | `https://api.ubcbiztech.com`                 |

The frontend calls `API_URL + endpoint` in `fetchBackend()` (`src/lib/db.ts`). There is no Next.js proxy — all calls go directly to the backend URL.

---

## Debugging the Frontend

### Network requests

API calls appear in the browser DevTools Network tab as requests to `localhost:4000` (local) or `api-dev.ubcbiztech.com` (dev). Look for:

- 401/403 — auth token missing or expired
- 404 — wrong path or missing path parameter
- 500 — backend error (check terminal logs)

### React Query DevTools

In development mode, React Query DevTools are available. Open the floating panel to inspect:

- Cached query keys and data
- Stale/fetching states
- Retry status for failed queries

### Console logging

Add `console.log` in page components, hooks, or `fetchBackend` to trace data flow. For server components, logs appear in the terminal running `npm run dev`, not the browser.

---

## Debugging the Backend

### Reading service logs

When you run `npm run dev`, `concurrently` interleaves logs from all services with color-coded prefixes. Look for:

- The service name prefix to filter relevant logs
- `statusCode: 500` or error stack traces
- `checkPayloadProps` validation errors (400)

### Adding logging

Add `console.log` statements in any handler. They appear immediately in the terminal:

```javascript
export const get = async (event, ctx, callback) => {
  console.log('Query params:', event.queryStringParameters)
  console.log('Auth claims:', event.requestContext?.authorizer?.claims)
  // ...
}
```

### Inspecting DynamoDB locally

Use the AWS CLI against the local endpoint:

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Scan a table
aws dynamodb scan --table-name biztechUsersdev --endpoint-url http://localhost:8000

# Get a specific item
aws dynamodb get-item --table-name biztechUsersdev \
  --key '{"id": {"S": "test@email.com"}}' \
  --endpoint-url http://localhost:8000
```

Table names have the environment suffix appended (e.g., `biztechUsersdev` for dev stage).

---

## Common Issues

### "Cannot connect to backend"

1. Check that `npm run dev` is running in `serverless-biztechapp-1` and port 4000 is listening
2. Check that `.env` has `NEXT_PUBLIC_REACT_APP_STAGE=local` in `bt-web-v2`
3. Check browser console for CORS errors — the backend sets CORS headers via `createResponse()`

### "Auth works locally but not in production"

See [Authentication — Why Auth Can Break](/docs/authentication#why-auth-can-break-between-local-and-production) for the five common causes: cookie domain, OAuth callback, authorizer cache, refresh token expiry, and `amplify_outputs.json` mismatch.

### "DynamoDB table not found"

`db.js` appends `process.env.ENVIRONMENT` to all table names. If ENVIRONMENT is `dev`, it looks for `biztechUsersdev`. Make sure:

- DynamoDB Local is running on port 8000
- You ran `npm run init:db` to create and seed tables
- `config.dev.json` has `"ENVIRONMENT": "dev"`

### "Handler returns 502"

Usually means an unhandled exception in the Lambda handler. Add a try/catch and log the error:

```javascript
try {
  // ... handler logic
} catch (err) {
  console.error('Handler error:', err)
  return helpers.createResponse(500, { message: err.message })
}
```

---

## Running Tests

```bash
cd serverless-biztechapp-1

# Unit tests
npm run utest

# Integration tests (requires DynamoDB Local)
npm run itest

# Both
npm run test
```

Tests use Jest and run via `scripts/run_utests.js` and `scripts/run_itests.js`, which discover and execute test files across all services.

---

## Related Pages

- [Setup & Installation](/docs/getting-started) — full initial setup instructions
- [Environment & Config](/docs/guides/environment) — stage switching and config files
- [Authentication](/docs/authentication) — auth debugging, admin checks, local-vs-prod issues
- [Adding an API Endpoint](/docs/guides/adding-an-endpoint) — creating new backend endpoints
