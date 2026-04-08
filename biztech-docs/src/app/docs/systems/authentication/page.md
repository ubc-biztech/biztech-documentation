---
title: Authentication System
nextjs:
  metadata:
    title: Authentication System
    description: Complete documentation of the authentication system across Cognito, Amplify, Next.js middleware, API Gateway authorizer, and admin detection.
---

How authentication works across all layers: Cognito as the identity provider, Amplify as the client library, the Next.js middleware as the route guard, and the API Gateway authorizer as the backend gate. {% .lead %}

---

## Stack

| Layer             | Component                                   | What It Does                                    |
| ----------------- | ------------------------------------------- | ----------------------------------------------- |
| Identity provider | AWS Cognito User Pool `us-west-2_w0R176hhp` | Stores user accounts, issues and validates JWTs |
| Frontend auth     | AWS Amplify Gen 2                           | Login UI, token management, session refresh     |
| Route protection  | `src/middleware.ts`                         | Redirects unauthenticated or non-member users   |
| Token storage     | Browser cookies                             | Stores Cognito tokens (domain-scoped)           |
| Backend auth      | API Gateway Cognito Authorizer              | Validates JWT before Lambda executes            |
| Admin detection   | Email domain check                          | `@ubcbiztech.com` email = admin                 |

---

## Token Lifecycle

### Login

1. User enters credentials on `/login` → Amplify `Authenticator` component handles the Cognito flow
2. Cognito returns three tokens:
   - **ID token** (1 hour): Contains user claims (email, sub). Used for API calls.
   - **Access token** (1 hour): Used internally by Amplify for user pool operations.
   - **Refresh token** (7 days default): Silently renews expired tokens.
3. Amplify stores all tokens in cookies (configured in `src/util/amplifyServerUtils.ts`)

### Cookie Settings

| Setting  | Production        | Local       |
| -------- | ----------------- | ----------- |
| Domain   | `.ubcbiztech.com` | `localhost` |
| MaxAge   | 7 days            | 7 days      |
| Secure   | Yes               | No          |
| SameSite | Lax               | Lax         |

### Token Refresh

Amplify handles this automatically. When the ID/access tokens expire (1 hour), Amplify uses the refresh token to get new ones without user interaction. If the refresh token expires (7 days of inactivity), the user must log in again.

### Logout

```typescript
import { signOut } from 'aws-amplify/auth'
await signOut()
clearAuthCookies() // Removes Cognito-prefixed cookies
window.location.href = '/login'
```

---

## Middleware Route Protection

The Next.js middleware (`src/middleware.ts`) runs on every request and enforces access control.

### Decision Flow

```
Request arrives
  │
  ├─ Path matches allowedPrefixes? → Allow through (no auth check)
  │   /login, /signup, /event, /companion, /btx, /membership,
  │   /feedback, /profile, /investments, /assets, /_next, /fonts, ...
  │
  ├─ No valid session? → Redirect to /login
  │
  ├─ User not found in biztechUsers? → Redirect to /signup
  │
  ├─ Path starts with /admin and user is not admin? → Redirect to /
  │
  └─ All checks pass → Allow through
```

### How It Checks the Session

The middleware calls `fetchBackendFromServer()` to `GET /users/{email}`. This uses the server-side Amplify context to extract the auth tokens from the request cookies. If the backend returns the user, they're authenticated and exist in the system.

---

## Backend Authorization

### API Gateway Cognito Authorizer

The `hello` service creates a shared Cognito Authorizer as a CloudFormation resource:

```yaml
CognitoAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    AuthorizerResultTtlInSeconds: 60
    IdentitySource: method.request.header.Authorization
    ProviderARNs:
      - arn:aws:cognito-idp:us-west-2:432714361962:userpool/us-west-2_w0R176hhp
    RestApiId: ...
    Type: COGNITO_USER_POOLS
```

Other services reference this authorizer in their `serverless.yml`:

```yaml
events:
  - http:
      path: my-endpoint
      method: get
      cors: true
      authorizer:
        type: COGNITO_USER_POOLS
        authorizerId: ${cf:biztechApi-${self:provider.stage}.CognitoAuthorizer}
```

**What it does**: Before the Lambda function executes, API Gateway extracts the JWT from the `Authorization` header, validates it against the Cognito User Pool, and caches the result for 60 seconds. Invalid or expired tokens get a 401 response before the Lambda is even invoked.

### Accessing User Identity in Handlers

```javascript
// The email from the validated JWT
const email = event.requestContext.authorizer.claims.email

// The Cognito user ID
const sub = event.requestContext.authorizer.claims.sub
```

### Admin Check in Handlers

```javascript
const email = event.requestContext.authorizer.claims.email
if (!email.endsWith('@ubcbiztech.com')) {
  return helpers.createResponse(403, { message: 'Unauthorized' })
}
```

### Public Endpoints

Endpoints without the `authorizer` block are publicly accessible:

```yaml
events:
  - http:
      path: events/
      method: get
      cors: true
      # No authorizer = public
```

---

## Roles and Permissions

There are exactly two roles, determined solely by email domain:

| Role       | Detection                           | Frontend Access                | Backend Access                                      |
| ---------- | ----------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Admin**  | `email.endsWith('@ubcbiztech.com')` | All pages including `/admin/*` | All endpoints including admin-only handlers         |
| **Member** | Any other authenticated email       | All pages except `/admin/*`    | Endpoints where Cognito auth is required (own data) |

There are no database role columns, no Cognito groups, and no RBAC tables. The admin check is purely email-based and runs independently in three places:

1. **Frontend middleware** — checks before rendering admin pages
2. **Frontend components** — conditionally renders admin UI (NavBar shows admin tabs)
3. **Backend handlers** — guards admin-only operations (e.g. batch deletes, member management)

---

## Frontend Auth Utilities

### Client-Side Session

```typescript
import { fetchAuthSession } from 'aws-amplify/auth'

const session = await fetchAuthSession()
const token = session.tokens?.idToken?.toString()
```

### Server-Side Session

```typescript
import { createServerRunner } from '@aws-amplify/adapter-nextjs'
const { runWithAmplifyServerContext } = createServerRunner({ config: outputs })

const session = await runWithAmplifyServerContext({
  nextServerContext: { request: context.req, response: context.res },
  operation: (ctx) => fetchAuthSession(ctx),
})
```

### User Query Hook

```typescript
// src/queries/user.ts
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const session = await fetchAuthSession()
      const email = session.tokens?.idToken?.payload?.email
      return { email, isAdmin: email?.endsWith('@ubcbiztech.com') }
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
  })
}
```

---

## Key Files

| File                                                    | Role                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `bt-web-v2/src/middleware.ts`                           | Route protection and session validation                              |
| `bt-web-v2/src/lib/db.ts`                               | `fetchBackend` / `fetchBackendFromServer` with auth header injection |
| `bt-web-v2/src/util/amplifyServerUtils.ts`              | Cookie configuration for Amplify                                     |
| `bt-web-v2/amplify/auth/resource.ts`                    | Amplify Gen 2 auth config                                            |
| `bt-web-v2/src/queries/user.ts`                         | User session query hook with admin detection                         |
| `serverless-biztechapp-1/services/hello/serverless.yml` | API Gateway + Cognito Authorizer CloudFormation                      |
| `serverless-biztechapp-1/serverless.common.yml`         | Shared authorizer reference for all services                         |

---

## Related Pages

- [Authentication Flow](/docs/flows/authentication) — step-by-step narrative walkthrough
- [Auth Implementation](/docs/authentication/implementation) — frontend auth code details
- [Frontend–Backend Integration](/docs/systems/frontend-backend-integration) — how auth tokens flow through the fetch layer
