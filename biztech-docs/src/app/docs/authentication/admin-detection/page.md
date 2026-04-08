---
title: Admin Detection
nextjs:
  metadata:
    title: Admin Detection
    description: How admin status is determined and enforced across the frontend middleware, query hooks, backend handlers, and user creation.
---

How admin status is determined and enforced across every layer of the BizTech stack. {% .lead %}

---

## The Rule

A user is an admin if their email domain is `ubcbiztech.com`. There are no database role columns, no Cognito groups, and no RBAC tables. The admin check is purely email-based and runs independently in four places.

---

## 1. User Creation (services/users/handler.js)

When a user record is created via `POST /users/`, the handler auto-sets the `admin` field:

```javascript
const email = data.email.toLowerCase()
const isBiztechAdmin =
  email.substring(email.indexOf('@') + 1, email.length) === 'ubcbiztech.com'
```

This sets `admin: true` on the `biztechUsers` record at creation time. The `admin` field is listed in `IMMUTABLE_USER_PROPS` (defined in `constants/tables.js`), which means it cannot be changed via `PATCH /users/{email}` — any attempt to include `admin` in a PATCH body causes the handler to throw an error.

The same logic runs during the Stripe membership webhook in `services/payments/handler.js` when creating a user via `OAuthMemberSignup()` or `userMemberSignup()`.

---

## 2. Frontend Middleware (src/middleware.ts)

The middleware fetches the user record via `GET /users/self` (which returns the `admin` field from DynamoDB). If the user is not an admin and the path starts with `/admin`:

```typescript
if (pathname.startsWith('/admin') && !userProfile.admin) {
  return NextResponse.redirect(new URL('/', req.url))
}
```

This is a server-side check that runs on every non-allowlisted request.

---

## 3. Frontend Query Hook (src/queries/user.ts)

The `getUserAttributes()` function checks the email domain directly from Cognito attributes:

```typescript
const isAdmin = email.split('@')[1] === 'ubcbiztech.com'
```

This is used by React components to conditionally render admin UI elements (event dashboard controls, member management, email tools). The `useUserAttributes()` React Query hook wraps this with a 20-minute stale time.

{% callout type="note" title="Two Admin Checks on the Frontend" %}
The middleware reads `admin` from the `biztechUsers` database record. The query hook checks the email domain from Cognito. These should always agree, but they are independent checks.
{% /callout %}

---

## 4. Backend Service Handlers

Each admin-only service checks the email from the decoded JWT claims:

```javascript
const email = event.requestContext?.authorizer?.claims?.email
if (!email?.endsWith('@ubcbiztech.com')) {
  throw helpers.createResponse(403, { message: 'Unauthorized' })
}
```

### Admin-Only Services

| Service   | What's Protected                                              |
| --------- | ------------------------------------------------------------- |
| `members` | All endpoints (create, get, getAll, update, delete, grant)    |
| `users`   | `GET /users/` (list all users)                                |
| `emails`  | All endpoints                                                 |
| `prizes`  | All CRUD endpoints                                            |
| `btx`     | Admin-specific endpoints (project management, account resets) |

### Non-Admin Cognito Endpoints

Some endpoints require Cognito authentication but are not admin-only. These endpoints use the JWT email to scope access to the caller's own data:

| Service    | Endpoint                | Behavior                                           |
| ---------- | ----------------------- | -------------------------------------------------- |
| `users`    | `GET /users/{email}`    | Non-admin gets own record regardless of path param |
| `users`    | `PATCH /users/{email}`  | Updates own record                                 |
| `profiles` | `GET /profiles/user/`   | Gets own profile                                   |
| `profiles` | `PATCH /profiles/user/` | Updates own profile                                |

---

## Why Admin Cannot Be Changed via API

The `IMMUTABLE_USER_PROPS` constant in `constants/tables.js` contains `["admin"]`. The users update handler (`services/users/handler.js`) checks for any field in this array in the PATCH body and **throws an error** if any are present. This means:

- Admin status is set once at user creation
- It cannot be modified through the API
- To change it, you must update the `biztechUsers` DynamoDB record directly

---

## The admin Field vs. Admin Paths

The membership page (`src/pages/membership.tsx`) has a separate admin detection for the payment bypass:

```typescript
if (email.toLowerCase().endsWith('@ubcbiztech.com')) {
  // Skip Stripe payment — directly create member records via API
}
```

Admins (BizTech exec team members) do not pay for membership. The membership page detects the admin email and directly calls the member/user/profile creation endpoints instead of redirecting to Stripe.

---

## Related Pages

- [Authentication Overview](/docs/authentication) — Full auth architecture and token lifecycle
- [Auth Implementation](/docs/authentication/implementation) — Middleware details and troubleshooting
- [Users Service](/docs/users) — User creation and the `GET /users/self` pattern
- [Membership Flow](/docs/flows/membership) — Admin grant path (no payment)
