---
title: Account Creation
nextjs:
  metadata:
    title: Account Creation
    description: How user accounts are created in BizTech — sign-up, OAuth, admin grant, and what gets written to DynamoDB.
---

How user accounts are created, what gets stored, and the different paths a new user can take. {% .lead %}

---

## The biztechUsers Table

Every user in BizTech has a record in `biztechUsers`. The primary key is `id`, which is the user's email address.

A typical user record:

```json
{
  "id": "jane@student.ubc.ca",
  "fname": "Jane",
  "lname": "Doe",
  "admin": false,
  "isMember": false,
  "year": 3,
  "faculty": "Commerce",
  "diet": "None",
  "pronouns": "she/her",
  "createdAt": 1735689600000
}
```

Key fields:

| Field            | Type      | Notes                                                      |
| ---------------- | --------- | ---------------------------------------------------------- |
| `id`             | String    | Email address (primary key)                                |
| `fname`, `lname` | String    | First and last name                                        |
| `admin`          | Boolean   | `true` for `@ubcbiztech.com` emails (auto-set on creation) |
| `isMember`       | Boolean   | `true` after membership payment or admin grant             |
| `favedEventsID`  | StringSet | DynamoDB StringSet of favourited event IDs                 |

---

## Creation Paths

There are three ways a user record gets created:

### Path 1: Direct Sign-Up (POST /users/)

The most common path. When a user signs up or registers for their first event, the frontend calls `POST /users/` with their profile data.

**Handler:** `services/users/handler.js` → `create`
**Auth:** None (public endpoint)

Steps:

1. Validates the `email` field
2. Checks if user already exists — returns 409 if so
3. Auto-sets `admin: true` if the email domain is `ubcbiztech.com`
4. Writes the record to `biztechUsers` with a conditional expression to prevent overwrites

```
POST /users/
{
  "email": "jane@student.ubc.ca",
  "fname": "Jane",
  "lname": "Doe",
  "year": 3,
  "faculty": "Commerce"
}
```

The `admin` field is **immutable** — it cannot be changed via `PATCH /users/{email}`. The constant `IMMUTABLE_USER_PROPS` in `constants/tables.js` enforces this (the update handler throws an error if immutable fields are included).

### Path 2: Membership Payment Webhook

When a new user purchases a membership, the Stripe webhook creates the user record as part of the payment completion flow.

**Two sub-paths based on `paymentType`:**

| `paymentType`   | What happens                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `"UserMember"`  | Calls `Cognito.signUp()` to create an auth account, then calls `OAuthMemberSignup()` which creates user + member + profile records |
| `"OAuthMember"` | Skips Cognito, directly creates user + member + profile records                                                                    |

Both paths write to `biztechUsers` with `isMember: true` from the start. The user data comes from the Stripe session `metadata` (name, email, faculty, year, etc.), which was captured on the payment form.

**Handler:** `services/payments/handler.js` → `webhook()` → `userMemberSignup()` / `OAuthMemberSignup()`

### Path 3: Admin Grant Membership

Admins can grant membership directly via `POST /members/grant`. This upserts the user record in `biztechUsers`, setting `isMember: true`.

**Handler:** `services/members/handler.js` → `grantMembership`
**Auth:** Cognito (admin-only — requires `@ubcbiztech.com` email)

This path is used for executive team members or special cases where payment isn't required.

---

## Admin Detection

The `admin` field is automatically set based on the email domain at creation time:

```js
// services/users/handler.js
const isAdmin = body.id.endsWith('@ubcbiztech.com')
const params = { ...body, admin: isAdmin }
```

This means:

- `jane@ubcbiztech.com` → `admin: true`
- `jane@student.ubc.ca` → `admin: false`

The `admin` flag is used by:

- The frontend `useUserAttributes()` hook in `src/queries/user.ts` — determines `isAdmin` via `email.split("@")[1] === "ubcbiztech.com"`
- The middleware in `src/middleware.ts` — reads `admin` from the user record to gate `/admin/*` routes
- Backend service handlers — check `email.endsWith('@ubcbiztech.com')` from JWT claims for admin-only endpoints

{% callout type="warning" title="Admin Cannot Be Changed via API" %}
The `IMMUTABLE_USER_PROPS` array in `services/users/handler.js` includes `"admin"`. Any `PATCH /users/{email}` request that includes `admin` in the body will have that field silently stripped before the update is applied.
{% /callout %}

---

## User Lookup Endpoints

After creation, user records are accessed through:

| Method | Path                             | Auth    | What it returns                  |
| ------ | -------------------------------- | ------- | -------------------------------- |
| `GET`  | `/users/check/{email}`           | None    | Boolean — does this user exist?  |
| `GET`  | `/users/checkMembership/{email}` | None    | Boolean — is this user a member? |
| `GET`  | `/users/{email}`                 | Cognito | Full user record                 |
| `GET`  | `/users/`                        | Cognito | All users (admin use)            |

The check endpoints are public because the frontend needs them during the sign-up flow before the user has authenticated.

---

## User Updates

`PATCH /users/{email}` updates user fields. Any field in the body is applied except those in `IMMUTABLE_USER_PROPS` (currently just `"admin"`).

**Favourite events** have a dedicated endpoint: `PATCH /users/favEvent/{email}` with `{ eventID, isFavourite }`. This uses DynamoDB's `ADD` / `DELETE` operations on the `favedEventsID` StringSet — no read-modify-write needed.

---

## Related Pages

- [User, Member & Profile Relationships](/docs/identity/relationships) — how user records connect to member and profile records
- [Membership Flow](/docs/flows/membership) — what happens after the user record exists
- [Payment Flow](/docs/systems/payment-flow) — Stripe checkout and webhook handling
- [Authentication](/docs/authentication) — Cognito auth that wraps user creation
- [Admin Detection](/docs/authentication/admin-detection) — full admin detection details across all layers
- [Users Service](/docs/users) — full endpoint reference
