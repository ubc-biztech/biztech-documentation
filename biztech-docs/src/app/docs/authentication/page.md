---
title: Authentication & Authorization
nextjs:
  metadata:
    title: Authentication & Authorization
    description: How authentication works in BizTech, covering Cognito, login flows, and the overall auth architecture.
---

How users authenticate, how sessions work, and the overall authentication architecture. {% .lead %}

---

## Architecture Overview

```
User (Browser)
  │
  ├── Login (email/password or Google OAuth)
  │     └── AWS Cognito User Pool
  │           └── Returns JWT tokens (id, access, refresh)
  │
  ├── Frontend Requests
  │     └── middleware.ts checks auth on every page load
  │           ├── Not authenticated → redirect to /login
  │           ├── Not a member → redirect to /membership
  │           └── Not admin + /admin path → redirect to /
  │
  └── API Requests
        └── JWT token in Authorization header
              └── API Gateway validates via Cognito Authorizer
                    └── Lambda handler receives verified email
```

---

## AWS Cognito

BizTech uses **AWS Amplify Gen 2** with **Amazon Cognito** for authentication. Cognito handles:

- User registration (email/password)
- Email verification
- Google OAuth sign-in
- JWT token issuance and refresh
- Password reset flows

### Cognito Configuration

| Setting             | Value                        |
| ------------------- | ---------------------------- |
| **Region**          | `us-west-2`                  |
| **User Pool ID**    | `us-west-2_w0R176hhp`        |
| **Login methods**   | Email/password, Google OAuth |
| **Password policy** | Amplify Gen 2 defaults       |
| **MFA**             | Disabled                     |

### OAuth Callback URLs

Defined in `amplify/auth/resource.ts`:

| Environment | Callback URL                           |
| ----------- | -------------------------------------- |
| Local       | `http://localhost:3000/login`          |
| Dev         | `https://dev.app.ubcbiztech.com/login` |
| Dev v2      | `https://dev.v2.ubcbiztech.com/login`  |
| Production  | `https://app.ubcbiztech.com/login`     |
| Prod v2     | `https://v2.ubcbiztech.com/login`      |

Logout URLs include the same domains with both `/login` and `/` paths.

The Amplify configuration lives in `amplify/auth/resource.ts` and the generated output in `amplify_outputs.json`.

---

## Login Flows

### Email/Password Login

1. User enters email + password on `/login`
2. Frontend calls `signIn()` from AWS Amplify
3. Cognito validates credentials, returns JWT tokens
4. Tokens are stored in browser cookies (managed by Amplify)
5. Middleware reads cookies on subsequent requests to verify auth

### Google OAuth Login

1. User clicks "Sign in with Google"
2. Redirected to Google's OAuth consent screen (scopes: `email`)
3. Google redirects back with an auth code to the callback URL
4. Cognito exchanges the code for tokens
5. If this is a new user → they need to complete membership

### Signup Flow

1. User registers at `/signup` with email/password
2. Cognito sends a verification code to their email
3. User enters the code at `/verify`
4. Account is created in Cognito but they are **not yet a member**
5. User is redirected to `/membership` to pay ($15 CAD, or $12 for UBC students)
6. After Stripe payment → backend webhook creates User, Member, and Profile records

---

## Token Lifecycle

Cognito returns three tokens on login:

| Token             | Lifetime | Purpose                                                                         |
| ----------------- | -------- | ------------------------------------------------------------------------------- |
| **ID token**      | 1 hour   | Contains user claims (email, sub). Sent as `Authorization` header on API calls. |
| **Access token**  | 1 hour   | Used internally by Amplify for Cognito user pool operations.                    |
| **Refresh token** | 7 days   | Silently renews expired ID/access tokens without user interaction.              |

Amplify stores all three in browser cookies (configured in `src/util/amplify-utils.ts`). When the ID or access token expires, Amplify uses the refresh token to get new ones automatically. If the refresh token expires (7 days of inactivity), the user must log in again.

### Cookie Configuration

Defined in `src/util/amplify-utils.ts`:

| Setting    | Production          | Development |
| ---------- | ------------------- | ----------- |
| `domain`   | `".ubcbiztech.com"` | _(not set)_ |
| `sameSite` | `"strict"`          | `"lax"`     |
| `maxAge`   | 7 days (604800s)    | 7 days      |

---

## Role Summary

| Role                           | How It's Determined                          | What They Can Do                                             |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------ |
| **Unauthenticated**            | No Cognito session                           | View public profiles, landing page                           |
| **Authenticated (non-member)** | Has Cognito session, `isMember` is not true  | Access `/membership` page only                               |
| **Member**                     | `isMember === true` on `biztechUsers` record | All non-admin pages, register for events, companion          |
| **Admin**                      | Email domain is `ubcbiztech.com`             | All pages including `/admin/*`, manage events/members/emails |

There are no database role columns, no Cognito groups, and no RBAC tables. The admin check is purely email-based and runs independently in the frontend middleware, frontend query hook, and backend handlers. See [Admin Detection](/docs/authentication/admin-detection) for details.

---

## Why Auth Can Break Between Local and Production

### Cookie domain mismatch

Amplify stores tokens in cookies. In production, cookies are scoped to `.ubcbiztech.com` with `sameSite: "strict"`. In development, no domain is set and `sameSite` is `"lax"`. If you deploy with the wrong cookie config, tokens are set but never sent back — every request looks unauthenticated.

### OAuth callback URL not matching

Cognito OAuth callback URLs are hardcoded in `amplify/auth/resource.ts`. If your local dev server runs on a different port or URL than what is registered, the OAuth redirect silently fails.

### API Gateway authorizer TTL

The Cognito Authorizer on API Gateway caches token validation for 60 seconds (`resultTtlInSeconds: 60` in `hello/serverless.yml`). If you revoke a user or change their email in Cognito, the change takes up to 60 seconds to take effect on API calls.

### Refresh token expiration

Refresh tokens last 7 days. If a user is inactive for more than 7 days, Amplify silently fails to renew the ID/access tokens. The middleware then gets a 401 from `GET /users/self` and redirects to `/login`.

### amplify_outputs.json mismatch

The file `amplify_outputs.json` in the bt-web-v2 root contains the Cognito User Pool ID, App Client ID, and OAuth config. If this file points to the wrong User Pool (e.g., a dev pool in production), all auth operations silently use the wrong identity provider.

---

## Key Files

| File                                                    | Role                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `bt-web-v2/src/middleware.ts`                           | Route protection and session validation                              |
| `bt-web-v2/src/lib/db.ts`                               | `fetchBackend` / `fetchBackendFromServer` with auth header injection |
| `bt-web-v2/src/util/amplify-utils.ts`                   | Cookie configuration for Amplify server runner                       |
| `bt-web-v2/amplify/auth/resource.ts`                    | Amplify Gen 2 auth config (Cognito, OAuth callbacks)                 |
| `bt-web-v2/src/queries/user.ts`                         | User attributes query hook with admin detection                      |
| `serverless-biztechapp-1/services/hello/serverless.yml` | API Gateway + Cognito Authorizer CloudFormation                      |
| `serverless-biztechapp-1/serverless.common.yml`         | Shared authorizer reference for all services                         |

---

## Related Pages

- [Auth Implementation](/docs/authentication/implementation) — Frontend auth code, middleware details, and troubleshooting
- [Admin Detection](/docs/authentication/admin-detection) — How admin status is determined and enforced
- [Account Creation](/docs/flows/account-creation) — How user records are created after signup
- [Membership Flow](/docs/flows/membership) — Payment and membership record creation
- [User, Member & Profile Relationships](/docs/identity/relationships) — How the three identity records connect
