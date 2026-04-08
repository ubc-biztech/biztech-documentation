---
title: Environment & Configuration
nextjs:
  metadata:
    title: Environment & Configuration
    description: How environments, stages, API URLs, and configuration work across the BizTech frontend and backend.
---

How the BizTech app handles environments, configuration, and stage-switching across frontend and backend. {% .lead %}

---

## Environments

| Environment    | Frontend URL             | Backend URL              | Database Suffix | Purpose         |
| -------------- | ------------------------ | ------------------------ | --------------- | --------------- |
| **Local**      | `localhost:3000`         | `localhost:4000`         | `""` (empty)    | Development     |
| **Dev**        | `dev.app.ubcbiztech.com` | `api-dev.ubcbiztech.com` | `""` (empty)    | Feature testing |
| **Production** | `app.ubcbiztech.com`     | `api.ubcbiztech.com`     | `"PROD"`        | Live for users  |

{% callout type="warning" title="Dev and Production Share Nothing" %}
The `PROD` suffix means production tables are completely separate from dev. But dev and staging share the same tables (both have empty suffix), so be careful with test data.
{% /callout %}

---

## Frontend Configuration

### The Stage Variable

The single most important config value is `NEXT_PUBLIC_REACT_APP_STAGE`, defined in `src/lib/dbconfig.ts`:

```typescript
const defined_stage = process.env.NEXT_PUBLIC_REACT_APP_STAGE

// Determines which API URL to use:
// "local"      → http://localhost:4000
// "production" → https://api.ubcbiztech.com
// anything else → https://api-dev.ubcbiztech.com
```

This variable controls:

- Which backend API the frontend talks to
- Which WebSocket URLs are used
- Which Interactions API is used

### All Frontend Config Values

Exported from `src/lib/dbconfig.ts`:

| Export             | Description                             |
| ------------------ | --------------------------------------- |
| `API_URL`          | Backend API base URL (varies by stage)  |
| `CLIENT_URL`       | Frontend URL (varies by stage)          |
| `WS_URL`           | WebSocket URL for live wall             |
| `INTERACTIONS_URL` | WebSocket URL for interactions/stickers |
| `EVENT_ID`         | Current active event ID constant        |

### Setting the Stage Locally

Create a `.env.local` file in the `bt-web-v2` root:

```
NEXT_PUBLIC_REACT_APP_STAGE=local
```

This points the frontend at `localhost:4000`. To point at the dev API instead, omit this variable or set it to anything other than `"local"` or `"production"`.

---

## Backend Configuration

### Config Files

The backend reads config from JSON files based on the `STAGE` environment variable:

| File                  | When Used                 |
| --------------------- | ------------------------- |
| `config.dev.json`     | `STAGE=dev` or `STAGE=""` |
| `config.staging.json` | `STAGE=staging`           |
| `config.prod.json`    | `STAGE=prod`              |

The `readConfigFile()` function in `handler.js` loads the correct config at startup.

### Key Config Values

Each config file contains:

```json
{
  "AWS_REGION": "us-west-2",
  "ENVIRONMENT": "",
  "COGNITO_USER_POOL_ID": "us-west-2_w0R176hhp",
  "SENDGRID_KEY": "...",
  "STRIPE_KEY": "...",
  "ALGOLIA_APP_ID": "...",
  "ALGOLIA_API_KEY": "...",
  "SNS_TOPIC_ARN": "..."
}
```

The `ENVIRONMENT` value (empty string for dev, `"PROD"` for production) is appended to all DynamoDB table names by `lib/db.js`. See [Database Guide](/docs/database) for details.

### Serverless Common Config

`serverless.common.yml` contains shared configuration that all services inherit:

- AWS region (`us-west-2`)
- Runtime (`nodejs20.x`)
- IAM permissions
- Environment variable injection (from the stage-specific config file)
- Cognito authorizer reference

Individual service `serverless.yml` files reference it with `${file(../../serverless.common.yml):custom}`.

---

## Local Development Setup

### Frontend

```bash
cd bt-web-v2
npm install
echo "NEXT_PUBLIC_REACT_APP_STAGE=local" > .env.local
npm run dev    # Starts on port 3000
```

### Backend

```bash
cd serverless-biztechapp-1
npm install
npm run start  # Starts all services via handler.js
```

This starts:

- An Express proxy on port 4000 that routes requests to individual services
- Each service on its own port starting from 4001 (defined in `sls-multi-gateways.yml`)
- DynamoDB Local (if configured)

### Connecting Frontend to Backend

With `NEXT_PUBLIC_REACT_APP_STAGE=local`, the frontend makes API calls to `http://localhost:4000`, which is the Express proxy that routes to the correct service.

---

## Related Pages

- [Getting Started](/docs/getting-started) — initial setup instructions
- [Deployment Guide](/docs/deployment) — deploying to dev and production
- [System Overview](/docs/system-overview) — overall architecture context
