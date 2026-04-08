---
title: Routing & Data Fetching
nextjs:
  metadata:
    title: Routing & Data Fetching
    description: Frontend routing map, data fetching patterns, API client, middleware, state management, and type system.
---

How pages are routed, how data flows between the frontend and backend, and how state is managed across the app. {% .lead %}

---

## Routing Map

### Public Pages (no auth required)

| Route                  | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `/login`               | Email/password login + Google OAuth                    |
| `/signup`              | Account registration                                   |
| `/verify`              | Email verification code entry                          |
| `/forgot-password`     | Password reset flow                                    |
| `/membership`          | Membership signup → Stripe payment                     |
| `/landing`             | Marketing landing page                                 |
| `/profile/[profileID]` | Public profile view (e.g., `/profile/SillyPandasDeny`) |

### Member Pages (require membership)

| Route                                | Description                                                      |
| ------------------------------------ | ---------------------------------------------------------------- |
| `/`                                  | Home dashboard with greeting, highlighted event, recent activity |
| `/events`                            | Event browsing with search and category filters                  |
| `/events/[eventId]/[year]`           | Event registration form                                          |
| `/profile`                           | Your own profile page                                            |
| `/profile/edit`                      | Profile editor                                                   |
| `/connections`                       | Your connection history                                          |
| `/companion`                         | Companion app entry (redirects to your event)                    |
| `/companion/[eventId]/[year]`        | Event companion home page                                        |
| `/companion/[eventId]/[year]/[page]` | Companion sub-pages (quests, connections, etc.)                  |
| `/btx`                               | BizTech Exchange stock trading simulation                        |

### Admin Pages (require @ubcbiztech.com email)

| Route                                      | Description                                       |
| ------------------------------------------ | ------------------------------------------------- |
| `/admin`                                   | Event management portal                           |
| `/admin/event/new`                         | Create a new event                                |
| `/admin/event/[eventId]/[year]`            | Event dashboard (registrations, teams, analytics) |
| `/admin/event/[eventId]/[year]/edit`       | Edit event details                                |
| `/admin/event/[eventId]/[year]/statistics` | Per-event statistics                              |
| `/admin/members`                           | Member management table                           |
| `/admin/statistics`                        | Global statistics dashboard                       |
| `/admin/emails`                            | Email template management                         |
| `/admin/companion`                         | Companion configuration                           |
| `/admin/livewall`                          | 2D connection wall (force graph)                  |
| `/admin/livewall/3d`                       | 3D connection wall (Three.js)                     |
| `/admin/btx`                               | BTX admin panel                                   |

---

## Data Fetching Patterns

We use three data fetching approaches depending on the situation:

### 1. Server-Side Rendering (SSR) with getServerSideProps

Used for pages that need fresh data on every request and benefit from SEO or fast initial load.

```typescript
// Example: src/pages/index.tsx
export const getServerSideProps: GetServerSideProps = async (context) => {
  const userData = await fetchBackendFromServer({
    endpoint: '/users',
    method: 'GET',
    nextServerContext: { request: context.req, response: context.res },
  })
  return { props: { userData } }
}
```

The `fetchBackendFromServer` function extracts the auth token from cookies (server-side) and calls our REST API.

### 2. Client-Side with React Query

Used for interactive data that updates frequently or depends on user actions.

```typescript
// Example: src/queries/useEvents.ts
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => fetchBackend({ endpoint: '/events', method: 'GET' }),
  })
}
```

React Query handles caching, background refetching, and loading/error states automatically.

### 3. Static Generation (SSG) with getStaticProps

Used rarely, only for pages where the content doesn't change per-user (like the event browsing page).

---

## API Client (src/lib/db.ts)

All API calls go through two functions:

| Function                   | When to Use                                    | How It Gets the Auth Token        |
| -------------------------- | ---------------------------------------------- | --------------------------------- |
| `fetchBackend()`           | Client-side (React components, hooks)          | `fetchAuthSession()` from Amplify |
| `fetchBackendFromServer()` | Server-side (`getServerSideProps`, middleware) | Extracts from request cookies     |

Both functions call the same REST backend. The URL is determined by the `NEXT_PUBLIC_REACT_APP_STAGE` environment variable:

```
local       → http://localhost:4000
production  → https://api.ubcbiztech.com
(anything else, including unset)  → https://api-dev.ubcbiztech.com
```

---

## Middleware (src/middleware.ts)

The middleware runs on **every request** and enforces auth rules:

1. **Allow-listed paths** skip auth entirely (login, signup, public assets, API routes, etc.)
2. For all other paths, it fetches the current user from the backend
3. If the user **is not a member** → redirect to `/membership`
4. If the path starts with `/admin` and the user **is not an admin** → redirect to `/`
5. On errors → redirect to `/login`

{% callout type="warning" title="Admin Detection" %}
A user is considered an admin if their email ends with `@ubcbiztech.com`. This check happens both in the middleware (frontend) and in backend service handlers.
{% /callout %}

---

## State Management

### React Query (Server State)

All backend data is managed through React Query hooks in `src/queries/`:

| Hook                             | What It Fetches                           |
| -------------------------------- | ----------------------------------------- |
| `useUser()`                      | Current authenticated user + admin status |
| `useEvents()` / `useAllEvents()` | Published events / all events (admin)     |
| `useRegistrations()`             | User's event registrations                |
| `useProfile()`                   | A profile by ID                           |
| `useUserProfile()`               | Authenticated user's own profile          |
| `useMembers()`                   | All members (admin)                       |
| `useConnections()`               | User's connections                        |
| `useQuestProgress()`             | Quest completion status                   |
| `useQuizReport()`                | Personality quiz results                  |

### React Context (Client State)

We have one context, `RegistrationContext`, used in companion pages to share the current user's event registration data without prop drilling.

### Local Component State

Everything else (form state, UI toggles, filters, sorting) lives in local `useState`/`useReducer` within components.

---

## Type System (src/types.ts)

Core types that appear everywhere:

| Type                   | What It Represents                                                    |
| ---------------------- | --------------------------------------------------------------------- |
| `BiztechEvent`         | An event with id, year, capacity, dates, registration questions, etc. |
| `Member`               | A club member with profile data (faculty, major, year, etc.)          |
| `UserProfile`          | A public-facing profile with visibility controls                      |
| `User`                 | Auth user with membership status, admin flag                          |
| `Registration`         | An event registration with status, responses, QR scans                |
| `RegistrationQuestion` | A custom question on an event registration form                       |
