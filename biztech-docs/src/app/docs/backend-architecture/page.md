---
title: Backend Architecture
nextjs:
  metadata:
    title: Backend Architecture
    description: Overview of the serverless-biztechapp-1 backend, covering the tech stack, project structure, and how services work.
---

A high-level guide to the BizTech backend: a Serverless Framework monorepo running multiple microservices on AWS Lambda with DynamoDB. {% .lead %}

---

## Tech Stack

| Layer              | Technology                                                 |
| ------------------ | ---------------------------------------------------------- |
| **Framework**      | Serverless Framework v3                                    |
| **Runtime**        | Node.js 20.x                                               |
| **Cloud Provider** | AWS (Lambda, API Gateway, DynamoDB, S3, SES, Cognito, SNS) |
| **Region**         | `us-west-2`                                                |
| **Payments**       | Stripe                                                     |
| **Search**         | Algolia                                                    |
| **Email**          | AWS SES + SendGrid                                         |
| **AI**             | OpenAI (embeddings for recommendations)                    |
| **Bots**           | Discord API, Slack API, GitHub API                         |

---

## Project Structure

```
serverless-biztechapp-1/
├── index.js                  # Local dev proxy, spawns all active services
├── handler.js                # Shared entry point (re-exported per service)
├── serverless.common.yml     # Shared Serverless config (provider, plugins)
├── sls-multi-gateways.yml    # Orchestrates deployment of all services
├── config.dev.json           # Dev environment config
├── config.staging.json       # Staging environment config
├── config.prod.json          # Production environment config
├── constants/                # Shared constants (tables, indexes, emails)
├── lib/                      # Shared libraries (DB, helpers, email, search)
├── scripts/                  # One-off admin/migration scripts
├── docs/api.yml              # OpenAPI 3.0 specification
└── services/                 # Microservices (one directory per service)
    ├── hello/                # Health check + shared infra export
    ├── events/               # Event CRUD
    ├── registrations/        # Registration management
    ├── members/              # Membership management
    ├── users/                # User accounts
    ├── payments/             # Stripe checkout
    ├── teams/                # Team management + judging
    ├── profiles/             # Public profiles
    ├── emails/               # Email template CRUD
    ├── investments/          # Kickstart funding
    ├── qr/                   # QR code scanning
    ├── quests/               # Quest/achievement system
    ├── quizzes/              # Personality quizzes
    ├── interactions/         # Connections + WebSocket wall
    ├── bots/                 # Discord + Slack integrations
    ├── prizes/               # Prize catalog
    ├── transactions/         # Point transactions
    ├── stickers/             # Real-time voting system
    └── btx/                  # Stock exchange simulation
```

---

## How Services Work

Each service is a self-contained Serverless Framework project with its own `serverless.yml` that defines Lambda functions and their HTTP routes.

### Service File Structure

```
services/events/
├── serverless.yml          # Function definitions + routes
├── handler.js              # Lambda handlers (exported functions)
└── helpers.js              # Service-specific business logic (optional)
```

### Anatomy of a serverless.yml

```yaml
service: biztechapp-events
frameworkVersion: '3'

# Import shared config (provider, plugins, IAM roles)
custom: ${file(../../serverless.common.yml):custom}
provider: ${file(../../serverless.common.yml):provider}
plugins: ${file(../../serverless.common.yml):plugins}

functions:
  eventsGet:
    handler: handler.get # Points to the exported 'get' function
    events:
      - http:
          path: /events/{eventId}/{year}
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
```

### Anatomy of a Handler

Every handler follows the same pattern:

```javascript
import helpers from '../../lib/handlerHelpers.js'
import db from '../../lib/db.js'
import { EVENTS_TABLE } from '../../constants/tables.js'

export const get = async (event) => {
  try {
    // 1. Extract parameters
    const { eventId, year } = event.pathParameters || {}

    // 2. Validate input
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

---

## Service Overview

| #   | Service         | Purpose                                 | Key Tables                                |
| --- | --------------- | --------------------------------------- | ----------------------------------------- |
| 1   | `hello`         | Health check, exports shared infra      | -                                         |
| 2   | `events`        | Event CRUD, image upload, nearest event | `biztechEvents`                           |
| 3   | `registrations` | Register, check-in, waitlist, bulk ops  | `biztechRegistrations`                    |
| 4   | `members`       | Club membership CRUD                    | `biztechMembers2026`                      |
| 5   | `users`         | User account CRUD, favorites            | `biztechUsers`                            |
| 6   | `payments`      | Stripe checkout, webhooks               | (creates across multiple tables)          |
| 7   | `teams`         | Teams, points, judging                  | `biztechTeams`, `bizFeedback`, `bizJudge` |
| 8   | `profiles`      | Public profiles, connections, companies | `biztechProfiles`                         |
| 9   | `emails`        | SES email template management           | -                                         |
| 10  | `investments`   | Kickstart event funding                 | `biztechInvestments`                      |
| 11  | `qr`            | QR code CRUD and scanning               | `biztechQRs`                              |
| 12  | `quests`        | Achievement/quest tracking              | `biztechQuests`                           |
| 13  | `quizzes`       | MBTI personality quizzes                | `biztechQuizzes`                          |
| 14  | `interactions`  | NFC connections, search, WebSocket wall | `bizConnections`, `bizWallSockets`        |
| 15  | `bots`          | Discord + Slack integrations            | -                                         |
| 16  | `prizes`        | Prize catalog CRUD                      | `biztechPrizes`                           |
| 17  | `transactions`  | Point transaction ledger                | `biztechTransactions`                     |
| 18  | `stickers`      | Real-time WebSocket voting              | `bizStickers`, `bizScores`, `bizSockets`  |
| 19  | `btx`           | Stock exchange simulation               | `bizBtx*` (6 tables)                      |

For detailed endpoint documentation, see the [API Reference](/docs/api-reference).

---

## Next Steps

- [Shared Libraries](/docs/backend-architecture/shared-libraries): Database layer, handler helpers, email, search, and SNS modules
- [Services & Patterns](/docs/backend-architecture/services): Environment config, API Gateway, local dev, testing, code patterns, and how to add a new service
