---
title: Tracing a Feature
nextjs:
  metadata:
    title: Tracing a Feature
    description: How to find and trace any feature through the BizTech codebase, from frontend page to backend handler to database table.
---

How to trace any feature through both codebases. If you need to understand or modify a feature, this page tells you exactly where to look. {% .lead %}

---

## The Tracing Method

Every feature in the BizTech app follows the same architecture. To find all the code for any feature, trace through these four layers:

```
1. Frontend page/component  →  src/pages/ or src/components/
2. Query/fetch call          →  src/queries/ or inline fetchBackend()
3. Backend handler           →  services/{service}/handler.js
4. Database table            →  constants/tables.js → DynamoDB
```

---

## Worked Example: Events

Let's trace what happens when a user views the event list.

### Layer 1: Frontend Page

The entry point is a page file. Event-related pages:

```
src/pages/index.tsx                           → Home/events list
src/pages/event/[eventId]/[year]/index.tsx    → Single event detail
src/pages/admin/event/create.tsx              → Event creation (admin)
src/pages/admin/event/[eventId]/[year]/       → Event dashboard (admin)
```

**How to find it:** Search for the URL path in `src/pages/`. Next.js file-based routing means the page path = the URL path.

### Layer 2: Query Hook

The page imports a query hook that fetches data:

```typescript
// In the page component
import { useEvents } from '@/queries/events'
const { data: events } = useEvents()
```

**How to find it:** Look for `useQuery` or `fetchBackend` calls in the page file. The query hook is usually in `src/queries/` with a name matching the feature.

The query file tells you exactly which API endpoint is called:

```typescript
// src/queries/events.ts
queryFn: () =>
  fetchBackend({ endpoint: '/events', method: 'GET', authenticatedCall: false })
```

### Layer 3: Backend Handler

The endpoint `/events` maps to a service. The routing is defined in `sls-multi-gateways.yml`:

```yaml
- srvName: events
  srvPath: events
  srvSource: services/events
```

So `GET /events` is handled by `services/events/handler.js`. Open `serverless.yml` in that service to see which handler function maps to which path:

```yaml
functions:
  getAll:
    handler: handler.getAll
    events:
      - http:
          path: events/
          method: get
```

**How to find it:** The endpoint path → service directory → `serverless.yml` → handler function name.

### Layer 4: Database Table

The handler calls `db.scan(EVENTS_TABLE)`. The table constant is defined in `constants/tables.js`:

```javascript
export const EVENTS_TABLE = 'biztechEvents'
```

At runtime, `db.js` appends the environment suffix: `biztechEvents` (dev) or `biztechEventsPROD` (production).

---

## Quick-Find Cheat Sheet

If you know any one piece, you can find the rest:

| You Know                                    | How to Find the Rest                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **URL path** (e.g. `/admin/event/create`)   | → `src/pages/admin/event/create.tsx` → look for `fetchBackend` or `useQuery` → find endpoint → find service handler                    |
| **API endpoint** (e.g. `GET /events`)       | → `sls-multi-gateways.yml` to find service → `services/events/serverless.yml` for handler function → `handler.js` for logic            |
| **Table name** (e.g. `biztechEvents`)       | → `grep` for the constant in `constants/tables.js` → `grep` for that constant in `services/*/handler.js` to find which services use it |
| **Component name** (e.g. `EventsDashboard`) | → Search `src/components/` → find which page imports it → trace from there                                                             |
| **Query hook** (e.g. `useEvents`)           | → `src/queries/events.ts` → read the endpoint → trace to handler                                                                       |

---

## Feature Map: Common Features

| Feature            | Frontend Pages                           | Query File                 | Backend Service                             | Key Tables                               |
| ------------------ | ---------------------------------------- | -------------------------- | ------------------------------------------- | ---------------------------------------- |
| Event browsing     | `pages/index.tsx`                        | `queries/events.ts`        | `services/events`                           | `biztechEvents`                          |
| Event registration | `pages/event/[eventId]/[year]/register/` | (inline fetch)             | `services/registrations`                    | `biztechRegistrations`                   |
| User profile       | `pages/profile/[id]/`                    | `queries/userProfile.ts`   | `services/profiles`                         | `biztechProfiles`                        |
| Companion app      | `pages/companion/[eventId]/[year]/`      | `queries/quests.ts`        | `services/quests`, `services/interactions`  | `biztechQuests`, `bizConnections`        |
| Admin dashboard    | `pages/admin/event/[eventId]/[year]/`    | `queries/registrations.ts` | `services/registrations`, `services/events` | `biztechRegistrations`, `biztechEvents`  |
| Member management  | `pages/admin/members/`                   | `queries/members.ts`       | `services/members`                          | `biztechMembers2026`                     |
| Live Wall          | `pages/live-wall/`                       | (WebSocket)                | `services/interactions`                     | `bizWallSockets`, `bizLiveConnections`   |
| BTX Exchange       | `pages/btx/`                             | (inline fetch)             | `services/btx`                              | `bizBtxProjects`, `bizBtxAccounts`, etc. |
| Partnerships CRM   | `pages/admin/partnerships/`              | (inline fetch)             | `services/partnerships`                     | (custom partnership tables)              |
| QR check-in        | `components/QrScanner/`                  | (inline fetch)             | `services/qr`, `services/registrations`     | `biztechQRs`, `biztechRegistrations`     |

---

## Finding Things by Search

### "Which service handles this endpoint?"

```bash
# In serverless-biztechapp-1/
grep -r "path: events/" services/*/serverless.yml
```

### "Which page calls this API?"

```bash
# In bt-web-v2/
grep -r "'/events'" src/queries/ src/pages/ src/lib/
```

### "Which services use this table?"

```bash
# In serverless-biztechapp-1/
grep -r "EVENTS_TABLE" services/
```

### "What fields does this table store?"

Look at what the handler's `create` or `put` function writes. The DynamoDB tables have no fixed schema — the shape is determined by what the code writes.

---

## Adding to an Existing Feature

When you need to modify a feature:

1. **Trace it** using the method above — find all four layers
2. **Change the backend first** if you're adding a new field or endpoint
3. **Update the frontend** to use the new data/endpoint
4. **Test locally**: run both the frontend (`npm run dev`) and backend (`npm run start`) and verify the full flow
5. **Check related features**: some features share tables (e.g. registrations are read by both the registration page and the admin dashboard)

See [Adding a Feature](/docs/guides/adding-a-feature) for the step-by-step guide when building something entirely new.

---

## Related Pages

- [Request Execution Path](/docs/systems/request-execution-path) — full request trace through every layer
- [Frontend–Backend Integration](/docs/systems/frontend-backend-integration) — the `fetchBackend` layer
- [Endpoint Registry](/docs/systems/endpoint-registry) — all 165+ endpoints across every service
- [Adding a Feature](/docs/guides/adding-a-feature) — how to add a new feature end-to-end
