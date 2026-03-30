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

We use **AWS Amplify Gen 2** with **Amazon Cognito** for authentication. Cognito handles:

- User registration (email/password)
- Email verification
- Google OAuth sign-in
- JWT token issuance and refresh
- Password reset flows

### Cognito Configuration

| Setting | Value |
| --- | --- |
| **Region** | `us-west-2` |
| **User Pool ID** | `us-west-2_w0R176hhp` |
| **Login methods** | Email/password, Google OAuth |
| **Password policy** | Min 8 chars, requires: number, lowercase, uppercase, symbol |
| **MFA** | None (disabled) |
| **Email verification** | Required |

### OAuth Callback URLs

| Environment | URL |
| --- | --- |
| Local | `http://localhost:3000/` |
| Dev | `https://dev.app.ubcbiztech.com/` |
| Production | `https://app.ubcbiztech.com/` |

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
2. Redirected to Google's OAuth consent screen
3. Google redirects back with an auth code
4. Cognito exchanges the code for tokens
5. If this is a new user → they need to complete membership

### Signup Flow

1. User registers at `/signup` with email/password
2. Cognito sends a verification code to their email
3. User enters the code at `/verify`
4. Account is created in Cognito but they're **not yet a member**
5. User is redirected to `/membership` to pay ($15 CAD)
6. After Stripe payment → backend creates User, Member, and Profile records

---

## Role Summary

| Role | How It's Determined | What They Can Do |
| --- | --- | --- |
| **Unauthenticated** | No Cognito session | View public profiles, landing page |
| **Authenticated (non-member)** | Has Cognito session, `isMember = false` | Access `/membership` page only |
| **Member** | `isMember = true` | All non-admin pages, register for events, companion |
| **Admin** | Email contains `@ubcbiztech.com` | All pages including `/admin/*`, manage events/members/emails |

---

## Next Steps

- [Auth Implementation](/docs/authentication/implementation): How auth is implemented in the frontend and backend, middleware details, admin detection, and common issues
