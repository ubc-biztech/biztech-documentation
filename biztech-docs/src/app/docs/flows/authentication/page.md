---
title: Authentication Flow
nextjs:
  metadata:
    title: Authentication Flow
    description: End-to-end authentication flow in the BizTech app, covering Cognito, Amplify, middleware, and backend authorization.
---

How authentication works from login through backend authorization, covering Cognito, Amplify, Next.js middleware, and the backend authorizer chain. {% .lead %}

---

## The Auth Stack

| Layer                 | Technology                                    | Role                                           |
| --------------------- | --------------------------------------------- | ---------------------------------------------- |
| Identity provider     | AWS Cognito User Pool (`us-west-2_w0R176hhp`) | Stores user accounts, issues JWTs              |
| Frontend auth library | AWS Amplify Gen 2                             | Manages login UI, token refresh, session state |
| Route protection      | Next.js middleware (`src/middleware.ts`)      | Redirects unauthenticated/non-member users     |
| Backend auth          | API Gateway Cognito Authorizer                | Validates JWT on every protected request       |

---

## Login Flow

### 1. User visits the app

The first request hits the Next.js middleware. Middleware calls `fetchBackendFromServer()` to check if the user has a valid Cognito session.

### 2. No session → redirect to `/login`

If no valid session exists, the middleware redirects to `/login`. The only paths that skip this check are in the `allowedPrefixes` array in `src/middleware.ts`:

```
/login, /signup, /event, /companion, /membership, /btx, /feedback, ...
```

### 3. Amplify login

On `/login`, the user signs in through the Amplify `Authenticator` component, which handles the Cognito flow (email + password, or social OAuth if configured).

After successful login, Amplify stores:

- **ID token**: Contains user claims (email, sub, groups)
- **Access token**: Used for API calls
- **Refresh token**: For renewing expired tokens

### 4. Post-login redirect

After login, the app redirects to the home page. The middleware now detects a valid session and lets the request through.

---

## Middleware Behavior

The middleware (`src/middleware.ts`) runs on every request except static assets. Here's what it does:

```
Request comes in
  ↓
Is this an allowed prefix? (login, signup, event, companion, etc.)
  → YES: Allow through
  → NO: Check for valid Cognito session
        ↓
     No session → redirect to /login
     Has session → Check if user exists in biztechUsers table
        ↓
     User not found → redirect to /signup
     User found → Allow through
```

The middleware uses `fetchBackendFromServer()` from `src/lib/db.ts`, which passes the request cookies to the backend so the API Gateway authorizer can validate the session server-side.

---

## User Roles

There are two roles, determined entirely by email domain:

| Role       | Condition                         | Access                                                      |
| ---------- | --------------------------------- | ----------------------------------------------------------- |
| **Admin**  | Email ends with `@ubcbiztech.com` | Full access: admin pages, member management, event creation |
| **Member** | Any other email                   | Standard access: view events, register, companion, profile  |

There are no database role fields or Cognito groups used for authorization. The admin check is purely email-based:

```javascript
// Backend (in handler code)
const email = event.requestContext.authorizer.claims.email
const isAdmin = email.endsWith('@ubcbiztech.com')
```

```typescript
// Frontend (in components)
const isAdmin = session?.email?.endsWith('@ubcbiztech.com')
```

---

## Backend Authorization

### How the JWT gets to the backend

When the frontend calls `fetchBackend()` (from `src/lib/db.ts`), Amplify automatically attaches the Cognito ID token as the `Authorization` header.

### API Gateway validation

Protected Lambda functions have an `authorizer` block in their `serverless.yml`:

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

API Gateway validates the JWT before the Lambda function even executes. If the token is invalid or expired, the request gets a 401 before it reaches your handler code.

### Accessing user identity in handlers

Once the JWT is validated, the user's claims are available at:

```javascript
const claims = event.requestContext.authorizer.claims
const email = claims.email // "student@example.com"
const sub = claims.sub // Cognito user ID
```

### Admin-only endpoints

Some handlers explicitly check for admin access:

```javascript
const email = event.requestContext.authorizer.claims.email
if (!email.endsWith('@ubcbiztech.com')) {
  return helpers.createResponse(403, 'Not authorized')
}
```

### Public endpoints

Endpoints without the `authorizer` block in `serverless.yml` are publicly accessible. No JWT needed. Examples: event listing, feedback submission, bot webhooks.

---

## Token Refresh

Amplify handles token refresh automatically. Cognito tokens expire after 1 hour, but the refresh token (valid for 30 days by default) lets Amplify silently get new tokens without requiring the user to log in again.

If the refresh token expires, the user is redirected to `/login` on their next request.

---

## Key Files

| File                                            | What It Does                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `bt-web-v2/src/middleware.ts`                   | Route protection, session checking                                |
| `bt-web-v2/src/lib/db.ts`                       | `fetchBackend` / `fetchBackendFromServer` — attaches auth headers |
| `bt-web-v2/src/lib/dbconfig.ts`                 | API URLs per environment                                          |
| `bt-web-v2/amplify/auth/resource.ts`            | Amplify Gen 2 auth configuration                                  |
| `serverless-biztechapp-1/serverless.common.yml` | Shared Cognito authorizer reference                               |

---

## Related Pages

- [Authentication Overview](/docs/authentication) — high-level auth architecture
- [Auth Implementation](/docs/authentication/implementation) — frontend auth code patterns
- [System Overview](/docs/system-overview) — where auth fits in the overall architecture
