---
title: System Overview
nextjs:
  metadata:
    title: System Overview
    description: How the BizTech frontend, backend, auth, and database fit together. The essential mental model for new developers.
---

How the BizTech app works end-to-end: the two codebases, how they connect, how auth works, how data flows, and the key concepts every developer needs to know. {% .lead %}

---

## The Two Codebases

BizTech's application is split across two repositories:

| Repository                  | Role     | Stack                                                      | Hosted On |
| --------------------------- | -------- | ---------------------------------------------------------- | --------- |
| **bt-web-v2**               | Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui, Amplify Gen 2 | Vercel    |
| **serverless-biztechapp-1** | Backend  | Serverless Framework v3, Node.js 20, Lambda, DynamoDB      | AWS       |

Both repos should be cloned side-by-side in the same parent directory (e.g. `~/BizTech/`).

---

## Request Lifecycle

Every interaction between a user and the backend follows this path:

```
Browser (Next.js on Vercel)
  |
  |  fetchBackend() or fetchBackendFromServer()
  |  adds Authorization: Bearer <Cognito JWT>
  v
API Gateway (REST API, us-west-2)
  |
  |  Cognito Authorizer validates JWT
  |  (or skips auth for public endpoints)
  v
Lambda Handler (services/{name}/handler.js)
  |
  |  db.getOne(), db.create(), db.scan(), etc.
  |  (lib/db.js auto-appends ENVIRONMENT suffix to table names)
  v
DynamoDB (30+ tables)
```

### Frontend to Backend

The frontend makes API calls through two functions in `src/lib/db.ts`:

- **`fetchBackend()`** — used client-side in React components and hooks. Gets the auth token from `fetchAuthSession()` (Amplify).
- **`fetchBackendFromServer()`** — used server-side in `getServerSideProps` and middleware. Gets the auth token from request cookies via `runWithAmplifyServerContext`.

Both call the same REST backend. The URL comes from `src/lib/dbconfig.ts`:

| `NEXT_PUBLIC_REACT_APP_STAGE`   | API URL                          | Client URL                       |
| ------------------------------- | -------------------------------- | -------------------------------- |
| `local`                         | `http://localhost:4000`          | `http://localhost:3000`          |
| `production`                    | `https://api.ubcbiztech.com`     | `https://app.ubcbiztech.com`     |
| anything else (including unset) | `https://api-dev.ubcbiztech.com` | `https://dev.app.ubcbiztech.com` |

### Backend Request Handling

Every Lambda handler follows the same pattern:

1. Parse input from `event.body`, `event.pathParameters`, or `event.queryStringParameters`
2. Validate input using `helpers.checkPayloadProps()` or manual checks
3. Execute business logic using `lib/db.js` for DynamoDB access
4. Return a response using `helpers.createResponse(statusCode, body)`

The handler file for each service is `services/{name}/handler.js`. The response helpers are in `lib/handlerHelpers.js`.

---

## Authentication Model

Authentication uses **AWS Cognito** via **Amplify Gen 2**.

### How Login Works

1. User signs in on `/login` (email/password or Google OAuth)
2. Cognito returns JWT tokens (id, access, refresh)
3. Amplify stores tokens in browser cookies (7-day max age)
4. Every subsequent request includes the JWT in the `Authorization` header
5. API Gateway validates the JWT via a Cognito Authorizer before the Lambda runs
6. The handler reads the user's email from `event.requestContext.authorizer.claims.email`

### Role Model

| Role            | How Determined                          | Access                                                 |
| --------------- | --------------------------------------- | ------------------------------------------------------ |
| Unauthenticated | No valid session                        | Public endpoints only (event listing, public profiles) |
| Non-member      | Has Cognito session, `isMember = false` | Redirected to `/membership`                            |
| Member          | `isMember = true`                       | All non-admin pages and endpoints                      |
| Admin           | Email ends with `@ubcbiztech.com`       | All pages including `/admin/*`, admin-only endpoints   |

### Middleware

The Next.js middleware (`src/middleware.ts`) runs on every page request:

1. **Allow-listed paths** skip auth entirely (login, signup, companion, events, btx, investments, static assets)
2. For everything else, fetches the user via `GET /users/self`
3. Non-members get redirected to `/membership`
4. Non-admins accessing `/admin/*` get redirected to `/`
5. On auth errors, redirects to `/login`

See [Authentication](/docs/authentication) for the full auth flow, Cognito config, and implementation details.

---

## Backend Architecture

The backend is a Serverless Framework monorepo with ~20 microservices. Each service owns a set of API routes and DynamoDB tables.

### Service Structure

Every service lives in `services/{name}/` and contains:

- `serverless.yml` — function definitions, HTTP routes, IAM permissions
- `handler.js` — exported Lambda handler functions
- `helpers.js` — service-specific business logic (optional)

All services share a single REST API Gateway and Cognito Authorizer, both created by the `hello` service and imported by all others.

### Shared Code

| Module                  | Purpose                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `lib/db.js`             | DynamoDB helpers (create, getOne, scan, updateDB, deleteOne, batchGet, batchWrite, query) |
| `lib/handlerHelpers.js` | Response builders (createResponse, inputError, notFoundResponse, etc.)                    |
| `lib/sesHelper.js`      | AWS SES email sending                                                                     |
| `lib/snsHelper.js`      | SNS notifications (Slack)                                                                 |
| `lib/search.js`         | Algolia search wrapper                                                                    |
| `constants/tables.js`   | All DynamoDB table name constants                                                         |

### Local Development

Running `npm start` in the backend repo:

1. Reads `sls-multi-gateways.yml` for the list of services
2. Starts each service with `sls offline` on sequential ports starting at **4001**
3. Runs an Express proxy on **port 4000** that routes requests by URL path prefix to the correct service port

You can also run specific services: `npm start events users registrations`.

See [Backend Architecture](/docs/backend-architecture) for the full service list and patterns.

---

## Frontend Architecture

The frontend is a **Next.js 14** app using the **Pages Router** (not App Router). Key structural concepts:

### File-Based Routing

Every file in `src/pages/` becomes a route. For example:

- `pages/login.tsx` → `/login`
- `pages/events.tsx` → `/events`
- `pages/admin/event/[eventId]/[year]/index.tsx` → `/admin/event/blueprint/2026`

### Layout Modes

The app has three layout modes, controlled in `_app.tsx`:

1. **No layout** — full-screen pages (login, signup, membership, btx, investments, live wall)
2. **Companion layout** — dark-themed mobile-first event experience (`/companion/*`)
3. **Standard layout** — sidebar navigation + content area (everything else)

### Data Fetching

- **SSR with `getServerSideProps`** — for pages that need fresh data on load (home page, profile)
- **Client-side with React Query** — for interactive data (events, registrations, connections)
- **Query hooks** live in `src/queries/` (e.g. `useEvents()`, `useUser()`, `useRegistrations()`)

### Key Directories

| Directory         | What's In It                                                  |
| ----------------- | ------------------------------------------------------------- |
| `src/components/` | ~155 React components organized by feature area               |
| `src/pages/`      | Next.js routes (one file per page)                            |
| `src/lib/`        | API client, config, utils, query provider                     |
| `src/queries/`    | TanStack React Query hooks                                    |
| `src/features/`   | Event-specific companion modules (blueprint, kickstart, etc.) |
| `src/constants/`  | App-wide config (companion settings, navigation tabs, etc.)   |
| `src/types/`      | TypeScript type definitions                                   |
| `src/util/`       | Utility functions (Amplify server utils, auth helpers, etc.)  |

See [Frontend Architecture](/docs/frontend-architecture) for the full breakdown.

---

## Database

All data lives in **DynamoDB** across 30+ tables. The `lib/db.js` module handles all access and automatically appends the environment suffix to table names:

- Dev/local: `biztechEvents` (no suffix)
- Production: `biztechEventsPROD`

Key tables:

| Table                  | Primary Key                              | What It Stores                                                 |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `biztechUsers`         | `id` (email)                             | User accounts, membership status, admin flag                   |
| `biztechEvents`        | `id` + `year` (sort key)                 | Event definitions with capacity, dates, registration questions |
| `biztechRegistrations` | `id` (email) + `eventID;year` (sort key) | Event registrations with status, responses, check-in data      |
| `biztechMembers{year}` | `id` (email)                             | Annual membership records                                      |
| `biztechProfiles`      | `id` (email)                             | Public profiles with skills, social links, visibility settings |
| `biztechTeams`         | `id` (team name) + `eventID;year`        | Teams for events (judging, competitions)                       |

See [Database](/docs/database) for the full table reference.

---

## Environment and Stages

The app runs in three environments:

| Stage      | Frontend URL             | Backend URL              | DynamoDB Suffix          |
| ---------- | ------------------------ | ------------------------ | ------------------------ |
| Local      | `localhost:3000`         | `localhost:4000`         | (none — uses dev tables) |
| Dev        | `dev.app.ubcbiztech.com` | `api-dev.ubcbiztech.com` | (none)                   |
| Production | `app.ubcbiztech.com`     | `api.ubcbiztech.com`     | `PROD`                   |

{% callout type="warning" title="Dev and Local Share Data" %}
Both dev and local have `ENVIRONMENT=""`, so they read from the same DynamoDB tables. Be careful when testing destructive operations.
{% /callout %}

The stage is controlled by:

- **Frontend**: `NEXT_PUBLIC_REACT_APP_STAGE` in `.env.local`
- **Backend**: `config.{stage}.json` files, where the `ENVIRONMENT` key determines the table suffix

---

## Related Pages

- [Getting Started](/docs/getting-started) — set up both repos and run locally
- [Project Structure](/docs/project-structure) — directory layout and key files
- [Frontend Architecture](/docs/frontend-architecture) — full frontend breakdown
- [Backend Architecture](/docs/backend-architecture) — full backend breakdown
- [Authentication](/docs/authentication) — auth flow, Cognito config, middleware
- [Database](/docs/database) — all tables and schemas
