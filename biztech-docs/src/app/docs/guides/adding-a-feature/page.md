---
title: Adding a Feature
nextjs:
  metadata:
    title: Adding a Feature
    description: Step-by-step guide to adding a new feature to the BizTech app, covering frontend pages, backend endpoints, database tables, and wiring everything together.
---

How to add a new feature to the BizTech app, from creating frontend pages to backend endpoints to database tables. {% .lead %}

---

## Adding a Frontend Page

Every file in `src/pages/` becomes a route automatically.

### 1. Create the page file

```
src/pages/my-feature.tsx        → /my-feature
src/pages/my-feature/index.tsx  → /my-feature
src/pages/my-feature/[id].tsx   → /my-feature/:id (dynamic route)
```

### 2. Basic page structure

```tsx
import { GetServerSideProps } from 'next'
import { fetchBackendFromServer } from '@/lib/db'

export default function MyFeaturePage({ data }: { data: any }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">My Feature</h1>
      {/* Your UI here */}
    </div>
  )
}

// Optional: fetch data server-side
export const getServerSideProps: GetServerSideProps = async (context) => {
  const data = await fetchBackendFromServer({
    endpoint: '/my-feature',
    method: 'GET',
    nextServerContext: { request: context.req, response: context.res },
  })
  return { props: { data } }
}
```

### 3. Choose the layout mode

In `src/pages/_app.tsx`, there's a `noLayoutPaths` array that lists routes with no sidebar/nav. If your page should be full-screen (no sidebar), add it there:

```typescript
const noLayoutPaths = [
  '/login',
  '/signup',
  '/membership',
  '/btx', // ...existing paths
  '/my-feature', // add your path here
]
```

If it's not in `noLayoutPaths`, it automatically gets the standard sidebar layout.

### 4. Add to navigation (if needed)

The sidebar tabs are defined in `src/constants/navigation.ts`. Add your page there if it should appear in the sidebar.

### 5. Protect the route

- **Member-only pages**: No action needed. The middleware already redirects non-members.
- **Admin-only pages**: Put the file under `src/pages/admin/`. The middleware checks admin status for any path starting with `/admin`.
- **Public pages**: Add the path to the `allowedPrefixes` array in `src/middleware.ts`.

---

## Adding a React Query Hook

If your feature fetches data from the backend, create a query hook in `src/queries/`:

```typescript
// src/queries/useMyFeature.ts
import { useQuery } from '@tanstack/react-query'
import { fetchBackend } from '@/lib/db'

export function useMyFeature(id: string) {
  return useQuery({
    queryKey: ['my-feature', id],
    queryFn: () =>
      fetchBackend({ endpoint: `/my-feature/${id}`, method: 'GET' }),
    enabled: !!id,
  })
}
```

Use it in your component:

```tsx
const { data, isLoading, error } = useMyFeature(id)
```

---

## Adding a Backend Service

If your feature needs new API endpoints, create a new service in `serverless-biztechapp-1`.

### 1. Create the service directory

```bash
mkdir services/my-feature
```

### 2. Create serverless.yml

```yaml
service: biztechapp-my-feature
frameworkVersion: '3'

custom: ${file(../../serverless.common.yml):custom}
provider: ${file(../../serverless.common.yml):provider}
plugins: ${file(../../serverless.common.yml):plugins}

functions:
  myFeatureGet:
    handler: handler.get
    events:
      - http:
          path: my-feature/{id}
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: ${cf:biztechApi-${file(../../serverless.common.yml):provider.stage}.CognitoAuthorizer}

  myFeatureCreate:
    handler: handler.create
    events:
      - http:
          path: my-feature/
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: ${cf:biztechApi-${file(../../serverless.common.yml):provider.stage}.CognitoAuthorizer}
```

For public endpoints (no auth required), omit the `authorizer` block.

### 3. Create handler.js

```javascript
import helpers from '../../lib/handlerHelpers.js'
import db from '../../lib/db.js'
import { MY_FEATURE_TABLE } from '../../constants/tables.js'

export const get = async (event) => {
  try {
    const { id } = event.pathParameters || {}
    if (!id) return helpers.missingIdQueryResponse()

    const result = await db.getOne(id, MY_FEATURE_TABLE)
    if (!result) return helpers.notFoundResponse('Item not found')

    return helpers.createResponse(200, result)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(err.statusCode || 502, err.message)
  }
}

export const create = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')

    const error = helpers.checkPayloadProps(body, {
      name: { type: 'string', required: true },
    })
    if (error) return helpers.inputError(error)

    const item = {
      id: body.name,
      ...body,
      createdAt: Date.now(),
    }

    await db.create(item, MY_FEATURE_TABLE)
    return helpers.createResponse(201, item)
  } catch (err) {
    console.error(err)
    return helpers.createResponse(err.statusCode || 502, err.message)
  }
}
```

### 4. Register the service

Add it to `sls-multi-gateways.yml` so it runs locally and deploys:

```yaml
- srvName: my-feature
  srvPath: my-feature
  srvSource: services/my-feature
```

The proxy will automatically route `/my-feature/*` requests to the correct port.

### 5. Add the table constant

If your service uses a new DynamoDB table, add the table name to `constants/tables.js`:

```javascript
export const MY_FEATURE_TABLE = 'biztechMyFeature'
```

And add IAM permissions in your `serverless.yml`:

```yaml
iamRoleStatements:
  - Effect: Allow
    Action:
      - dynamodb:GetItem
      - dynamodb:PutItem
      - dynamodb:Scan
    Resource:
      - 'arn:aws:dynamodb:us-west-2:432714361962:table/biztechMyFeature${self:provider.environment.ENVIRONMENT}'
```

---

## Adding Endpoints to an Existing Service

If your feature fits within an existing service (e.g. adding a new endpoint to `events`):

1. Add the function definition to the service's `serverless.yml`
2. Add the handler export to `handler.js`
3. Add any new IAM permissions for tables you need to access
4. No changes needed to `sls-multi-gateways.yml` — the service is already registered

---

## Adding a DynamoDB Table

If your feature needs a new table:

1. Add the table name constant to `constants/tables.js`
2. Add IAM permissions in the service's `serverless.yml`
3. The table must exist in AWS (create it via the AWS console or CloudFormation)
4. For local development, add the table definition to the service's `serverless.yml` under `resources` so DynamoDB Local creates it automatically

---

## End-to-End Wiring Checklist

| Step                         | Where                     | Files                          |
| ---------------------------- | ------------------------- | ------------------------------ |
| Create the page              | `bt-web-v2`               | `src/pages/my-feature.tsx`     |
| Add query hook               | `bt-web-v2`               | `src/queries/useMyFeature.ts`  |
| Add types                    | `bt-web-v2`               | `src/types.ts` or `src/types/` |
| Create backend service       | `serverless-biztechapp-1` | `services/my-feature/`         |
| Register service             | `serverless-biztechapp-1` | `sls-multi-gateways.yml`       |
| Add table constant           | `serverless-biztechapp-1` | `constants/tables.js`          |
| Add to sidebar (optional)    | `bt-web-v2`               | `src/constants/navigation.ts`  |
| Set layout mode (optional)   | `bt-web-v2`               | `src/pages/_app.tsx`           |
| Make route public (optional) | `bt-web-v2`               | `src/middleware.ts`            |

---

## Related Pages

- [Frontend Architecture](/docs/frontend-architecture) — how the Next.js app is structured
- [Backend Architecture](/docs/backend-architecture) — service structure and patterns
- [Services & Patterns](/docs/backend-architecture/services) — detailed guide to adding services
- [Routing & Data Fetching](/docs/frontend-architecture/routing) — routing map and data fetching patterns
