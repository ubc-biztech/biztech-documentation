---
title: Frontend–Backend Integration
nextjs:
  metadata:
    title: Frontend–Backend Integration
    description: How the BizTech frontend communicates with the backend API, including fetchBackend, authentication headers, error handling, and environment routing.
---

How the frontend talks to the backend: the fetch layer, auth headers, environment routing, and error handling. {% .lead %}

---

## The Fetch Layer

All API calls from the frontend go through two functions in `src/lib/db.ts`:

| Function                   | Used Where                                    | Auth Source                                             |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `fetchBackend()`           | React components, query hooks, event handlers | `fetchAuthSession()` from browser (Amplify client-side) |
| `fetchBackendFromServer()` | `getServerSideProps`, middleware              | `runWithAmplifyServerContext()` with request cookies    |

Both do the same thing: build a request to the backend API, attach an auth token if needed, send it, and return the parsed response. The difference is where the auth token comes from.

---

## fetchBackend() — Client-Side

```typescript
import { fetchBackend } from '@/lib/db'

const events = await fetchBackend({
  endpoint: '/events',
  method: 'GET',
  authenticatedCall: false, // public endpoint, no token needed
})

const user = await fetchBackend({
  endpoint: `/users/${email}`,
  method: 'GET',
  // authenticatedCall defaults to true
})
```

**Parameters:**

| Parameter           | Type                                              | Default   | Description                                  |
| ------------------- | ------------------------------------------------- | --------- | -------------------------------------------- |
| `endpoint`          | string                                            | —         | API path (e.g. `/events`, `/users/${email}`) |
| `method`            | `'GET' \| 'POST' \| 'PUT' \| 'DELETE' \| 'PATCH'` | —         | HTTP method                                  |
| `data`              | object                                            | undefined | Request body (for POST/PUT/PATCH)            |
| `authenticatedCall` | boolean                                           | `true`    | Whether to attach the Cognito JWT            |

**What it does:**

1. Calls `currentSession()` to get the Cognito ID token from the browser
2. Sets `Authorization: Bearer {idToken}` header (if `authenticatedCall` is true)
3. Sends the request to `API_URL + endpoint`
4. If the response is not OK, throws `{ status, message }` (the parsed error body)
5. If `authenticatedCall` is true but no token exists, throws `UnauthenticatedUserError`

---

## fetchBackendFromServer() — Server-Side

Used in `getServerSideProps` to fetch data before the page renders:

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const data = await fetchBackendFromServer({
    endpoint: '/events',
    method: 'GET',
    authenticatedCall: false,
    nextServerContext: { request: context.req, response: context.res },
  })
  return { props: { data } }
}
```

Same parameters as `fetchBackend`, plus `nextServerContext` which passes the Next.js request/response objects so Amplify can extract the auth session from cookies.

---

## API URL Routing

The target URL is determined by `NEXT_PUBLIC_REACT_APP_STAGE` in `src/lib/dbconfig.ts`:

```
"local"       → http://localhost:4000
"production"  → https://api.ubcbiztech.com
anything else → https://api-dev.ubcbiztech.com
```

This means `fetchBackend({ endpoint: '/events', ... })` sends a request to:

- `http://localhost:4000/events` in local dev
- `https://api.ubcbiztech.com/events` in production

---

## Error Handling

### Thrown Error Shape

When the backend returns a non-200 response, `fetchBackend` throws:

```typescript
throw {
  status: response.status, // HTTP status code (401, 403, 404, 502, etc.)
  message: responseData, // Parsed JSON response body from the API
}
```

### UnauthenticatedUserError

If `authenticatedCall` is true but no valid session exists:

```typescript
throw new UnauthenticatedUserError('User is not authenticated')
```

Components handle this by checking `error.name === 'UnauthenticatedUserError'` or by checking `error.status` for specific HTTP codes.

### Typical Error Handling in Queries

```typescript
// In a query function
export async function getQuizReport(
  profileId: string,
): Promise<QuizReport | null> {
  try {
    const response = await fetchBackend({
      endpoint: `/quizzes/report/${profileId}`,
      method: 'GET',
      authenticatedCall: false,
    })
    return response?.data ?? response ?? null
  } catch (error: any) {
    if (
      error?.status === 400 ||
      error?.message?.message === 'Quiz report not found'
    ) {
      return null // Treat 404/400 as "no data", not a crash
    }
    console.error('Quiz report fetch error:', error)
    return null
  }
}
```

---

## Query Layer (React Query)

Most data fetching is wrapped in React Query hooks in `src/queries/`. These hooks call `fetchBackend` and manage caching, refetching, and loading states.

```typescript
// src/queries/events.ts
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () =>
      fetchBackend({
        endpoint: '/events',
        method: 'GET',
        authenticatedCall: false,
      }),
    staleTime: 60 * 1000,
  })
}
```

Usage in components:

```tsx
const { data: events, isLoading, error } = useEvents()
```

See [Data Fetching](/docs/frontend/data-fetching) for the full query layer documentation.

---

## Authentication Flow Through the Fetch Layer

```
Component calls fetchBackend({ endpoint: '/users/me', method: 'GET' })
  ↓
fetchBackend() calls currentSession() → gets Cognito ID token from browser
  ↓
Sends: GET https://api.ubcbiztech.com/users/me
       Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6I...
  ↓
API Gateway receives the request
  ↓
Cognito Authorizer validates the JWT (caches for 60 seconds)
  ↓
Lambda handler gets user claims at event.requestContext.authorizer.claims
  ↓
Response flows back through API Gateway → fetchBackend → component
```

For public endpoints (`authenticatedCall: false`), the Authorization header is omitted and the API Gateway skips the Cognito authorizer.

---

## Common Patterns

### Parallel Server-Side Fetching

When a page needs multiple API calls, use `Promise.allSettled()` to avoid one failure killing the whole page:

```typescript
const [eventsResult, userResult] = await Promise.allSettled([
  fetchBackendFromServer({
    endpoint: '/events',
    method: 'GET',
    authenticatedCall: false,
    nextServerContext,
  }),
  fetchBackendFromServer({
    endpoint: `/users/${email}`,
    method: 'GET',
    nextServerContext,
  }),
])

const events = eventsResult.status === 'fulfilled' ? eventsResult.value : []
const user = userResult.status === 'fulfilled' ? userResult.value : null
```

### Mutations Without React Query

Most writes (POST/PATCH/DELETE) are called directly without `useMutation`:

```typescript
const handleSubmit = async (data: FormData) => {
  await fetchBackend({
    endpoint: '/events/',
    method: 'POST',
    data: { ...data },
  })
}
```

### Query Invalidation After Mutations

```typescript
const queryClient = useQueryClient()

const handleDelete = async () => {
  await fetchBackend({ endpoint: `/events/${id}/${year}`, method: 'DELETE' })
  queryClient.invalidateQueries({ queryKey: ['events'] })
}
```

---

## Related Pages

- [Request Execution Path](/docs/systems/request-execution-path) — full trace from click to database
- [Data Fetching](/docs/frontend/data-fetching) — React Query layer details
- [Backend Architecture](/docs/backend-architecture) — what happens on the other side
- [Environment & Configuration](/docs/guides/environment) — API URL configuration
