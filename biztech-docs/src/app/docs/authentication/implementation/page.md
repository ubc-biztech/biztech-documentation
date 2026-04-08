---
title: Auth Implementation
nextjs:
  metadata:
    title: Auth Implementation
    description: How authentication is implemented — Amplify setup, middleware logic, backend authorization, and troubleshooting.
---

The nuts and bolts of how auth works in both the frontend and backend: token management, middleware, and common issues. {% .lead %}

---

## Frontend Auth

### Amplify Configuration (ConfigureAmplify.tsx)

The `ConfigureAmplify` component initializes the Amplify library client-side:

```typescript
import { Amplify } from 'aws-amplify'
import outputs from '../../amplify_outputs.json'

Amplify.configure(outputs, { ssr: true })
```

This is rendered in the layout so it runs on every page.

### Auth Token Retrieval

**Client-side** (in React components and hooks):

```typescript
import { fetchAuthSession } from 'aws-amplify/auth'

const session = await fetchAuthSession()
const token = session.tokens?.idToken?.toString()
```

This token is automatically included in API calls via `fetchBackend()` in `src/lib/db.ts`.

**Server-side** (in middleware and server components):

```typescript
import { runWithAmplifyServerContext } from '@/util/amplify-utils'

const session = await runWithAmplifyServerContext({
  nextServerContext: { request, response },
  operation: (context) => fetchAuthSession(context),
})
```

### fetchBackend and fetchBackendFromServer

Both functions in `src/lib/db.ts` inject the `Authorization: Bearer <idToken>` header on requests:

- **`fetchBackend()`** (client-side) — calls `fetchAuthSession()` directly. Throws `UnauthenticatedUserError` if no token and `authenticatedCall` is `true` (the default).
- **`fetchBackendFromServer()`** (server-side) — uses `runWithAmplifyServerContext` with the Next.js request/response context. Same auth header injection pattern.

The API base URL comes from `src/lib/dbconfig.ts`:

| Stage      | URL                              |
| ---------- | -------------------------------- |
| production | `https://api.ubcbiztech.com`     |
| local      | `http://localhost:4000`          |
| staging    | `https://api-dev.ubcbiztech.com` |

---

## Middleware (src/middleware.ts)

The middleware runs on **every request** (matched by `/:path*`) and enforces auth rules in this order:

### 1. Allow-listed paths skip auth entirely

These paths do not require any authentication:

```
/companion, /companions
/btx
/events, /event
/become-a-member, /membership
/login
/profile
/register
/forgot-password, /verify
/investments
/assets, /favicon, /_next, /static, /fonts, /videos
*.woff, *.woff2, *.ttf, *.otf (web fonts)
```

### 2. Fetch the current user

For all other paths, the middleware calls `GET /users/self` via `fetchBackendFromServer`. The `self` value in the path is a placeholder — the users handler ignores the path param for non-admins and resolves identity from the Cognito JWT claims instead.

### 3. Membership check

If `isMember` is not true → redirect to `/membership`.

### 4. Admin check

If the path starts with `/admin` and `admin` is not true → redirect to `/`.

### 5. Error handling

- 404 from the user API → redirect to `/membership` (user record does not exist yet)
- Any other error → redirect to `/login` (session expired or invalid)

---

## Backend Auth

### API Gateway Cognito Authorizer

The `hello` service creates a Cognito Authorizer on the API Gateway. When a Lambda function specifies `authorizer: cognitoAuthorizer`, API Gateway automatically:

1. Extracts the JWT from the `Authorization` header
2. Validates it against the Cognito User Pool
3. Passes the decoded claims to the Lambda handler

### Accessing the User in Lambda Handlers

```javascript
export const handler = async (event) => {
  const email = event.requestContext?.authorizer?.claims?.email
}
```

### Public Endpoints (No Auth)

Endpoints that omit the `authorizer` property in their `serverless.yml` are public:

```yaml
functions:
  publicEndpoint:
    handler: handler.public
    events:
      - http:
          path: /my-public-route
          method: get
          cors: true
          # No authorizer specified = public
```

---

## User Attributes Hook

The `getUserAttributes()` function in `src/queries/user.ts` provides the frontend admin detection:

```typescript
const isAdmin = email.split('@')[1] === 'ubcbiztech.com'
```

The `useUserAttributes()` React Query hook wraps this with a 20-minute stale time and 1 retry. It returns `UserAttributes` including `isAdmin`, `email`, and standard Cognito attributes.

---

## Logout

Logout is handled client-side:

```typescript
import { signOut } from 'aws-amplify/auth'

await signOut()
window.location.href = '/login'
```

---

## Common Auth Issues

### Auth works locally but not in production

**Cause:** Cookie domain mismatch. In production, cookies must have `domain: ".ubcbiztech.com"` and `sameSite: "strict"`. In development, no domain is set and `sameSite` is `"lax"`.

**Fix:** Check `src/util/amplify-utils.ts`.

### Auth works in production but not locally

**Cause:** OAuth callback URL not registered for `http://localhost:3000/login`.

**Fix:** Check `amplify/auth/resource.ts` — the callback URLs must include the localhost URL. Google OAuth silently fails if the redirect URI does not match.

### "401 Unauthorized" on API calls

**Cause:** JWT token expired (tokens last 1 hour).

**Fix:** Log out and log back in. Amplify should auto-refresh tokens via the refresh token, but if the refresh token has also expired (after 7 days of inactivity), a fresh login is required.

### Stuck on /membership even though you've paid

**Cause:** The `isMember` flag on the `biztechUsers` record is not `true`.

**Fix:** Check the user record in DynamoDB. The Stripe webhook should set `isMember: true`, but the webhook may have failed silently.

### Can't access /admin even with BizTech email

**Cause:** The `admin` field on the user record is `false`. The auto-admin detection (`email.endsWith("@ubcbiztech.com")`) only runs during user creation in `services/users/handler.js`. The `admin` field is in `IMMUTABLE_USER_PROPS` and cannot be changed via `PATCH /users/{email}`.

**Fix:** Manually update the `admin` field in the `biztechUsers` DynamoDB table.

### Google OAuth redirects to wrong URL

**Cause:** OAuth callback URLs are hardcoded in `amplify/auth/resource.ts`.

**Fix:** Ensure your local dev server runs on `http://localhost:3000/` (the exact URL registered).

---

## Related Pages

- [Authentication Overview](/docs/authentication) — Architecture, tokens, and role summary
- [Admin Detection](/docs/authentication/admin-detection) — Detailed admin detection across all layers
- [Users Service](/docs/users) — The `/users` endpoints including the `GET /users/self` pattern
