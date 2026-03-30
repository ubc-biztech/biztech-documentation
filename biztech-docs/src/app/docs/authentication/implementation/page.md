---
title: Auth Implementation
nextjs:
  metadata:
    title: Auth Implementation
    description: How authentication is implemented, including frontend Amplify setup, middleware logic, backend authorization, admin detection, and troubleshooting.
---

The nuts and bolts of how auth works in both the frontend and backend: token management, middleware, admin detection, and common issues. {% .lead %}

---

## Frontend Auth

### Amplify Configuration (`ConfigureAmplify.tsx`)

The `ConfigureAmplify` component initializes the Amplify library client-side:

```typescript
import { Amplify } from "aws-amplify";
import outputs from "@/amplifyconfiguration.json";

Amplify.configure(outputs);
```

This is rendered in the layout so it runs on every page.

### Auth Token Retrieval

**Client-side** (in React components and hooks):

```typescript
import { fetchAuthSession } from "aws-amplify/auth";

const session = await fetchAuthSession();
const token = session.tokens?.idToken?.toString();
```

This token is automatically included in API calls via `fetchBackend()` in `src/lib/db.ts`.

**Server-side** (in `getServerSideProps` and middleware):

```typescript
import { createServerRunner } from "@aws-amplify/adapter-nextjs";

const { runWithAmplifyServerContext } = createServerRunner({ config: outputs });

// Inside getServerSideProps:
const session = await runWithAmplifyServerContext({
  nextServerContext: { request, response },
  operation: (context) => fetchAuthSession(context),
});
```

### Cookie Configuration (`src/util/amplifyServerUtils.ts`)

Auth tokens are stored in cookies with these settings:

| Setting | Production | Dev/Local |
| --- | --- | --- |
| Domain | `.ubcbiztech.com` | `localhost` |
| Max Age | 7 days | 7 days |
| Secure | Yes | No |
| SameSite | Lax | Lax |

---

## Middleware (`src/middleware.ts`)

The middleware runs on **every request** (matched by the broad `/((?!api).*)` pattern) and enforces auth rules in this order:

### 1. Allow-listed paths skip auth entirely

These paths don't require any authentication:

```
/login, /signup, /verify, /forgot-password
/membership, /landing, /btx
/companion/*/redirect, /companion/*/qr
/profile/* (public profiles)
/assets, /favicon, /_next, /static, /fonts, /videos
```

### 2. Fetch the current user

For all other paths, the middleware calls `GET /users/{email}` using the auth token from cookies.

### 3. Membership check

If the user **is not a member** (`isMember !== true`), redirect to `/membership`.

### 4. Admin check

If the path starts with `/admin` and the user **is not an admin**, redirect to `/`.

### 5. Error handling

- 404 from the user API → redirect to `/membership` (user doesn't exist yet)
- Any other error → redirect to `/login` (likely expired session)

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
  // The email comes from the verified Cognito JWT
  const email = event.requestContext?.authorizer?.jwt?.claims?.email;
  // Or from the Authorization header directly
  const email = event.headers?.authorization;
};
```

### Public Endpoints (No Auth)

Some endpoints skip the Cognito authorizer. These are defined in each service's `serverless.yml` without the `authorizer` property:

```yaml
functions:
  publicEndpoint:
    handler: handler.public
    events:
      - httpApi:
          path: /my-public-route
          method: get
          # No authorizer specified = public
```

---

## Admin Detection

Admin status is determined by one simple rule:

{% callout type="warning" title="Admin Rule" %}
**A user is an admin if their email contains `@ubcbiztech.com`.**

This check happens in three places:
1. Frontend middleware (`src/middleware.ts`)
2. Frontend query hook (`src/queries/useUser.ts`)
3. Backend handlers (services that need admin-only access)
{% /callout %}

### Frontend Admin Check

```typescript
// src/queries/useUser.ts
const isAdmin = user.email?.includes("@ubcbiztech.com") || false;
```

### Backend Admin Check

```javascript
// In service handlers
const email = event.requestContext?.authorizer?.jwt?.claims?.email;
if (!email?.includes("@ubcbiztech.com")) {
  return helpers.createResponse(403, "Admin access required");
}
```

Admin-only services: `emails`, `prizes` (CRUD), `members` (list all, grant), `users` (list all), `btx` (admin endpoints).

---

## Logout

Logout is handled client-side:

```typescript
import { signOut } from "aws-amplify/auth";
import { clearAuthCookies } from "@/lib/registrations";

await signOut();
clearAuthCookies();  // Removes auth cookies from browser
window.location.href = "/login";
```

The `clearAuthCookies()` function iterates over all cookies with the Cognito prefix and removes them.

---

## Common Auth Issues

### "401 Unauthorized" on API calls

**Cause:** JWT token expired (tokens last ~1 hour).
**Fix:** Log out and log back in. Amplify should auto-refresh tokens, but sometimes the refresh token expires too (after 7 days).

### Stuck on `/membership` even though you've paid

**Cause:** The `isMember` flag on the user record might not be set.
**Fix:** Check the user record in DynamoDB. The Stripe webhook should set this, but it may have failed.

### Can't access `/admin` even with BizTech email

**Cause:** Your user record might have `admin: false`.
**Fix:** The auto-admin detection only runs on user creation. If your user was created before this feature, update the user record manually.

### Google OAuth redirects to wrong URL

**Cause:** OAuth callback URLs are hardcoded in the Amplify config.
**Fix:** Make sure your local dev server is running on `http://localhost:3000/` (the exact URL in the callback list).
