---
title: Membership Flow
nextjs:
  metadata:
    title: Membership Flow
    description: The three paths to becoming a BizTech member — payment webhook, OAuth flow, and admin grant.
---

How users become BizTech members, including pricing, payment processing, and what records get created. {% .lead %}

---

## What "Membership" Means in the Database

A member has three records across three tables:

| Table                | Key                                | What's stored                                        |
| -------------------- | ---------------------------------- | ---------------------------------------------------- |
| `biztechUsers`       | `id` (email)                       | `isMember: true`                                     |
| `biztechMembers2026` | `id` (email)                       | Membership metadata: `cardNumber`, `cardCount`, etc. |
| `biztechProfiles`    | `compositeID` (PROFILE#id), `type` | Public profile for networking                        |

All three must exist for a user to be fully "a member." The membership flows below always create or update all three.

---

## Membership Pricing

Defined in `services/payments/constants.js`:

| User type       | Price                                        |
| --------------- | -------------------------------------------- |
| Non-UBC student | $15.00 CAD (`MEMBERSHIP_PRICE = 1500` cents) |
| UBC student     | $12.00 CAD ($3 discount)                     |

The discount is applied in `services/payments/handler.js` → `payment()` when the user's metadata indicates they are a UBC student.

---

## Path 1: New User + Membership Payment (UserMember)

This is the most common path — a brand new user who signs up and pays for membership in one flow.

```
Frontend (membership page)
    │
    ├─ POST /payments { paymentType: "UserMember", email, fname, ... }
    │
    ▼
Backend creates Stripe Checkout Session
    │  - line_items: membership price
    │  - metadata: all user fields + paymentType
    │  - success_url, cancel_url
    │
    ▼
User completes payment on Stripe
    │
    ▼
Stripe fires checkout.session.completed webhook
    │
    ▼
webhook() → userMemberSignup()
    │
    ├─ 1. Cognito.signUp(email, password)         ← creates auth account
    ├─ 2. OAuthMemberSignup(metadata)
    │      ├─ db.create(USERS_TABLE, { ...userData, isMember: true })
    │      ├─ db.create(MEMBERS2026_TABLE, { id: email, cardCount: 0, ... })
    │      └─ createProfile(email, memberData)    ← TransactWrite to PROFILES + MEMBERS2026
    └─ 3. Return 200
```

**Handler:** `services/payments/handler.js` → `webhook()` → `userMemberSignup()`

The Cognito password comes from the user — it is passed through Stripe session metadata as `data.password`. The user provides their password on the membership form before checkout.

### Path 2: OAuth User + Membership Payment (OAuthMember)

Same as above but the user already has a Cognito account (via Google/Apple OAuth). Skips the `Cognito.signUp()` step.

```
webhook() → OAuthMemberSignup(metadata)
    ├─ db.create(USERS_TABLE, { ...userData, isMember: true })
    ├─ db.create(MEMBERS2026_TABLE, { id: email, cardCount: 0, ... })
    └─ createProfile(email, memberData)
```

**Trigger:** `paymentType: "OAuthMember"` in the Stripe session metadata.

### Path 3: Existing User + Membership Payment (Member)

The user already has a `biztechUsers` record (e.g., they registered for a past event) but isn't a member yet.

```
webhook() → memberSignup(metadata)
    ├─ db.updateDB(USERS_TABLE, email, { isMember: true })   ← update, not create
    ├─ db.create(MEMBERS2026_TABLE, { id: email, cardCount: 0, ... })
    └─ createProfile(email, memberData)
```

**Trigger:** `paymentType: "Member"` in the Stripe session metadata.

---

## Path 4: Admin Grant (No Payment)

Admins can grant membership without payment via `POST /members/grant`.

**Handler:** `services/members/handler.js` → `grantMembership`
**Auth:** Cognito (admin-only)

```
POST /members/grant
{
  "id": "jane@student.ubc.ca",
  "fname": "Jane",
  "lname": "Doe",
  "year": 3,
  "faculty": "Commerce"
}
```

Steps:

1. Upserts `biztechUsers` — sets `isMember: true` (creates user if they don't exist)
2. Upserts `biztechMembers2026` — sets `cardCount: 0` and all provided metadata
3. Creates `biztechProfiles` record if one doesn't already exist (calls `createProfile()`)

This is the only membership path that doesn't go through Stripe.

---

## The createProfile() Helper

All membership paths end with `createProfile()` (in `services/profiles/helpers.js`). This function:

1. Generates a human-readable `profileID` using the `human-id` library (e.g., `SillyPandasDeny`)
2. Copies `firstName`, `lastName`, `pronouns`, `year`, `major`, and `profileType` from the member record
3. Sets the default `viewableMap` (privacy toggles for each field)
4. Uses a DynamoDB `TransactWrite` to atomically:
   - **Put** a new profile in `biztechProfiles` with `compositeID: PROFILE#<profileID>` and `type: PROFILE`
   - **Update** the member record in `biztechMembers2026` to set `profileID`

The transaction ensures the member always has a valid `profileID` pointing to an existing profile.

---

## Members Table Fields

A record in `biztechMembers2026`:

| Field             | Type   | Notes                                             |
| ----------------- | ------ | ------------------------------------------------- |
| `id`              | String | Email (primary key)                               |
| `fname`, `lname`  | String | Name                                              |
| `cardNumber`      | String | Physical NFC card number (assigned later)         |
| `cardCount`       | Number | Starts at 0, incremented when NFC card is written |
| `profileID`       | String | Human-readable ID linking to `biztechProfiles`    |
| `year`, `faculty` | Mixed  | Academic info                                     |
| `createdAt`       | Number | Timestamp                                         |

**GSI:** `profile-query` — indexes `profileID` so you can look up a member's email from their profile UUID. Used by `GET /members/email/{profileID}`.

---

## Frontend Integration

The membership purchase flow lives in:

- `src/pages/membership.tsx` — the membership purchase page
- `src/lib/registrationStrategy/registrationStateOld.ts` — handles the Stripe redirect

The page collects user data, determines the correct `paymentType` ("UserMember", "OAuthMember", or "Member" based on whether the user exists and how they authenticated), POSTs to `/payments`, and redirects to Stripe.

---

## Members Service Endpoints

All endpoints in `services/members/handler.js` are admin-only (require `@ubcbiztech.com` email):

| Method   | Path                         | Handler               | Description                            |
| -------- | ---------------------------- | --------------------- | -------------------------------------- |
| `POST`   | `/members`                   | `create`              | Create member record                   |
| `GET`    | `/members/{id}`              | `get`                 | Get member by email                    |
| `GET`    | `/members/email/{profileID}` | `getEmailFromProfile` | Reverse lookup: profileID → email      |
| `GET`    | `/members`                   | `getAll`              | List all members                       |
| `PATCH`  | `/members/{id}`              | `update`              | Update member fields                   |
| `DELETE` | `/members/{id}`              | `del`                 | Delete member                          |
| `POST`   | `/members/grant`             | `grantMembership`     | Grant membership (upsert all 3 tables) |

---

## Checking Membership Status

The public endpoint `GET /users/checkMembership/{email}` returns a boolean indicating whether `isMember` is true on the user's `biztechUsers` record. The frontend uses this during sign-up to determine whether to show the membership purchase option.

---

## Related Pages

- [User, Member & Profile Relationships](/docs/identity/relationships) — how the three records relate
- [Account Creation](/docs/flows/account-creation) — how user records are created
- [Profile Sync](/docs/flows/profile-sync) — how profiles are created and linked
- [Payment Flow](/docs/systems/payment-flow) — Stripe session creation and webhook handling
- [Members Service](/docs/members) — full member service endpoint reference
- [Admin Detection](/docs/authentication/admin-detection) — admin payment bypass and admin-only endpoints
