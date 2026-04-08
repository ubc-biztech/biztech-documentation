---
title: Data Fetching
nextjs:
  metadata:
    title: Data Fetching
    description: Deep dive into the React Query layer, query hooks, stale times, mutations, cache invalidation, and error handling patterns.
---

The full React Query layer: how every query hook works, what stale times are configured, how mutations trigger refetches, and the error handling conventions. {% .lead %}

---

## Query File Organization

All query hooks live in `src/queries/`:

| File               | Hooks                       | Backend Endpoints                             |
| ------------------ | --------------------------- | --------------------------------------------- |
| `events.ts`        | `useEvents`, `useAllEvents` | `GET /events/`                                |
| `user.ts`          | `useUser`                   | `fetchAuthSession` (Cognito, no backend call) |
| `registrations.ts` | `useRegistrations`          | `GET /registrations/?email={email}`           |
| `members.ts`       | `useMembers`                | `GET /members/`                               |
| `profile.ts`       | `useProfile`                | `GET /profiles/profile/{profileID}`           |
| `userProfile.ts`   | `useUserProfile`            | `GET /profiles/user/`                         |
| `quests.ts`        | `useQuestProgress`          | `GET /quests/{eventId}/{year}`                |
| `connections.ts`   | `useConnections`            | `GET /interactions/journal/`                  |
| `quiz.ts`          | `useQuizReport`             | `GET /quizzes/report/{profileId}`             |

---

## Query Key Patterns

React Query uses query keys for caching and invalidation. Our conventions:

```typescript
// Simple resource
queryKey: ['events']
queryKey: ['members']

// Resource scoped to user
queryKey: ['registrations', email]
queryKey: ['user']

// Resource scoped to event
queryKey: ['quests', eventId, year]
queryKey: ['quiz', eventId]

// Parameterized
queryKey: ['profile', profileId]
```

**Rule**: If the data depends on a parameter, that parameter appears in the query key. This ensures different parameters get different cache entries.

---

## Stale Time Configuration

| Hook               | Stale Time | Rationale                                   |
| ------------------ | ---------- | ------------------------------------------- |
| `useUser`          | 20 minutes | User identity rarely changes mid-session    |
| `useUserProfile`   | 5 minutes  | Profile edits are infrequent                |
| `useEvents`        | 60 seconds | Events change during admin edits            |
| `useRegistrations` | 60 seconds | Registrations can change (check-in, status) |
| `useMembers`       | 60 seconds | Standard polling for admin views            |
| `useProfile`       | 60 seconds | Viewing another user's profile              |
| `useQuestProgress` | 5 seconds  | Quest state changes rapidly during events   |
| `useConnections`   | 60 seconds | Standard refresh rate                       |

**Stale time** controls how long React Query considers cached data fresh. While data is fresh, React Query returns it immediately without making a network request.

---

## Conditional Queries

Some hooks only fire when their parameters are available:

```typescript
export function useRegistrations(email?: string) {
  return useQuery({
    queryKey: ['registrations', email],
    queryFn: () =>
      fetchBackend({
        endpoint: `/registrations/?email=${email}`,
        method: 'GET',
      }),
    enabled: !!email, // Only fetch when email is available
  })
}
```

The `enabled` flag prevents the hook from fetching before the dependency (like user email from another query) has resolved.

---

## Server-Side Data Fetching

Pages that need data before rendering use `getServerSideProps` with `fetchBackendFromServer`:

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const [events, user] = await Promise.allSettled([
      fetchBackendFromServer({
        endpoint: '/events/',
        method: 'GET',
        authenticatedCall: false,
        nextServerContext: { request: context.req, response: context.res },
      }),
      fetchBackendFromServer({
        endpoint: '/users/me',
        method: 'GET',
        nextServerContext: { request: context.req, response: context.res },
      }),
    ])
    return {
      props: {
        events: events.status === 'fulfilled' ? events.value : [],
        user: user.status === 'fulfilled' ? user.value : null,
      },
    }
  } catch {
    return { props: { events: [], user: null } }
  }
}
```

**Key patterns:**

- `Promise.allSettled` for parallel fetches — one failure doesn't block the others
- Graceful degradation — provide fallback props on failure
- `fetchBackendFromServer` requires the `nextServerContext` to read cookies server-side

---

## Mutations

Most mutations use `fetchBackend` directly, without `useMutation` wrappers:

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    await fetchBackend({
      endpoint: '/registrations/',
      method: 'POST',
      data: formData,
    })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    router.push('/success')
  } catch (err) {
    setError(err.message)
  }
}
```

**Why direct calls instead of `useMutation`?** The codebase evolved from simple fetch calls and the pattern stuck. For consistency, follow the same pattern unless there's a strong reason to use `useMutation`.

### Cache Invalidation After Mutations

After a mutation, invalidate the relevant query keys so React Query refetches:

```typescript
// After creating a registration
queryClient.invalidateQueries({ queryKey: ['registrations'] })

// After editing an event
queryClient.invalidateQueries({ queryKey: ['events'] })

// After updating a profile
queryClient.invalidateQueries({ queryKey: ['profile'] })
queryClient.invalidateQueries({ queryKey: ['userProfile'] })
```

`invalidateQueries` marks matching cached data as stale, causing any mounted component using that hook to refetch.

---

## Error Handling

`fetchBackend` throws on non-200 responses:

```typescript
catch (err) {
  // err has shape { status: number, message: string }
  if (err.status === 404) {
    // Resource not found — show empty state
  } else if (err.status === 409) {
    // Duplicate — show conflict message
  } else {
    // Generic error
    console.error(err)
    setError(err.message || 'Something went wrong')
  }
}
```

For unauthenticated calls, `fetchBackend` throws `UnauthenticatedUserError` when the session has no valid token. The middleware normally prevents this, but it can happen if the session expires mid-use.

---

## React Query Provider

The query client is configured in the app layout and shared globally:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry failed queries once
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
    },
  },
})
```

Individual hooks override these defaults when needed (e.g. `useQuestProgress` sets `refetchOnWindowFocus: true` for real-time quest data).

---

## Related Pages

- [Routing & Data Fetching](/docs/frontend-architecture/routing) — routing map and middleware overview
- [Frontend–Backend Integration](/docs/systems/frontend-backend-integration) — `fetchBackend` and `fetchBackendFromServer` internals
- [Request Execution Path](/docs/systems/request-execution-path) — what happens after the query fires
