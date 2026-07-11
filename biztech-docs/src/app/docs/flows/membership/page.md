---
title: Membership Flow
nextjs:
  metadata:
    title: Membership Flow
    description: Paid membership flow and table ownership rules for biztechUsers, biztechMembers2027, and biztechProfiles.
---

How users become BizTech members, including pricing, payment processing, and what records get created. {% .lead %}

---

## What "Membership" Means in the Database

A paid member has records across three tables:

| Table | Key | What's stored |
| ----- | --- | ------------- |
| `biztechUsers` | `id` (email), `profileID-index` on `profileID` | Stable account identity, current `isMember` flag, and canonical `profileID`. |
| `biztechMembers2027` | `id` (email) | Yearly membership form data for the 2027 cycle. |
| `biztechProfiles` | `compositeID` (`PROFILE#<profileID>`), `type` | Public/private networking profile and connection rows. |

Important rule for implementation:

- User owns profile identity.
- Membership owns yearly membership data.
- Profile owns networking and public profile data.

---

## Membership Pricing

Defined in `services/payments/constants.js`:

| User type | Price |
| --------- | ----- |
| Non-UBC student | $15.00 CAD (`MEMBERSHIP_PRICE = 1500` cents) |
| UBC student | $12.00 CAD ($3 discount) |

The discount is applied in `services/payments/handler.js` -> `payment()` when the user's metadata indicates they are a UBC student.

---

## New Paid Membership Flow

### Brand-New User Buying Membership

For a brand-new user buying membership:

1. Stripe checkout completes.
2. The payments webhook receives `checkout.session.completed`.
3. Create a `biztechUsers` record with `isMember: true`.
4. Create a `biztechMembers2027` record with `profileType: "MEMBER"`.
5. Call `createProfile(email, "MEMBER")`.
6. `createProfile` reads membership form data.
7. Create the `biztechProfiles` profile row.
8. Write the generated `profileID` to `biztechUsers.profileID`.

```
Stripe checkout.session.completed
    |
    v
payments webhook
    |
    +-- create biztechUsers { id: email, isMember: true, ... }
    +-- create biztechMembers2027 { id: email, profileType: "MEMBER", ... }
    +-- createProfile(email, "MEMBER")
          +-- read membership form data
          +-- create biztechProfiles row
          +-- update biztechUsers.profileID
```

### Existing User Buying 2027 Membership

For an existing user buying 2027 membership:

1. Stripe checkout completes.
2. The payments webhook receives `checkout.session.completed`.
3. Update the existing `biztechUsers` row with latest basic fields and `isMember: true`.
4. Create a `biztechMembers2027` record with `profileType: "MEMBER"`.
5. Read `biztechUsers.profileID`.
6. If `profileID` exists, update the existing `biztechProfiles` row with `pronouns`, `major`, and `year`.
7. If `profileID` does not exist, call `createProfile(email, "MEMBER")`.

```
Stripe checkout.session.completed
    |
    v
payments webhook
    |
    +-- update biztechUsers { isMember: true, latest basic fields, ... }
    +-- create biztechMembers2027 { id: email, profileType: "MEMBER", ... }
    +-- read biztechUsers.profileID
          +-- exists: update biztechProfiles pronouns/major/year
          +-- missing: createProfile(email, "MEMBER")
```

---

## Path 3: Admin Grant (No Payment)

Admins can grant membership without payment via `POST /members/grant`.

**Handler:** `services/members/handler.js` -> `grantMembership`
**Auth:** Cognito (admin-only)

Steps:

1. Creates or updates `biztechUsers` and sets `isMember: true`.
2. Creates a yearly row in `biztechMembers2027` and sets `profileType: "MEMBER"` unless another profile type is intentionally provided.
3. Reads `biztechUsers.profileID`.
4. Updates the existing `biztechProfiles` row if `profileID` exists.
5. Calls `createProfile(email, "MEMBER")` if `profileID` is missing.

This is the only membership path that does not go through Stripe.

---

## The `createProfile()` Helper

All membership paths that need a new profile end with `createProfile(email, profileType)`. This function:

1. Reads the yearly membership form data from `biztechMembers2027`.
2. Generates a human-readable `profileID` using the `human-id` library (for example, `SillyPandasDeny`).
3. Copies `firstName`, `lastName`, `pronouns`, `year`, `major`, and `profileType` into a profile row.
4. Sets the default `viewableMap` privacy toggles.
5. Puts a new profile in `biztechProfiles` with `compositeID: PROFILE#<profileID>` and `type: PROFILE`.
6. Updates `biztechUsers.profileID` with the generated profile ID.

{% callout type="warning" title="Profile Identity Ownership" %}
`createProfile()` must write the generated profile ID to `biztechUsers.profileID`. Do not write or read `profileID` on the yearly membership table as the source of truth.
{% /callout %}

---

## Table Writes

| Step | Table | Write |
| ---- | ----- | ----- |
| Create or update user | `biztechUsers` | Lowercase email in `id`, latest basic fields, `isMember: true`, and generated `profileID` when a new profile is created. |
| Create yearly membership | `biztechMembers2027` | Lowercase email in `id`, membership form answers, and `profileType: "MEMBER"`. |
| Create profile | `biztechProfiles` | Profile row with `compositeID: "PROFILE#{profileID}"`, `type: "PROFILE"`, explicit `profileID`, and profile fields from the membership form. |
| Refresh profile | `biztechProfiles` | Existing profile row refreshed with membership fields such as `pronouns`, `major`, and `year`. |

---

## Lookup Rules

| Need | Read from | Notes |
| ---- | --------- | ----- |
| Find user by email | `biztechUsers.id` | Email should be lowercase. |
| Find a user's profile ID | `biztechUsers.profileID` | This is the source of truth for profile identity. |
| Find user/email from profile ID | `biztechUsers.profileID-index` | Use the `profileID-index` GSI. |
| Find yearly membership | `biztechMembers2027.id` | Membership is keyed by lowercase email. |
| Find profile row | `biztechProfiles` | Read `compositeID: "PROFILE#{profileID}"` and `type: "PROFILE"`. |

---

## Members Table Fields

A record in `biztechMembers2027`:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | String | Lowercase email. Primary key. |
| `profileType` | String | Normal paid membership should set `"MEMBER"`. |
| `education` | String | Membership form value. |
| `firstName` | String | Membership form first name. |
| `lastName` | String | Membership form last name. |
| `pronouns` | String | Used to refresh profile. |
| `studentNumber` | String | Membership form student number. |
| `faculty` | String | Membership form faculty. |
| `year` | String/Number | Used to refresh profile. |
| `major` | String | Used to refresh profile. |
| `prevMember` | Boolean/String | Previous member answer. |
| `international` | Boolean/String | International student answer. |
| `topics` | Array | Interest topics. |
| `heardFrom` | String | Referral source. |
| `heardFromSpecify` | String | Referral detail. |
| `diet` | String | Dietary restrictions. |
| `university` | String | School/university. |
| `highSchool` | String | High school, if applicable. |
| `admin` | Boolean | Existing admin snapshot. |
| `cardCount` | Number | NFC/card tracking. |
| `discordId` | String | Existing location for now, though eventually user-level is cleaner. |
| `createdAt` | Number | Epoch ms. |
| `updatedAt` | Number | Epoch ms. |

**Primary key:** `id`

{% callout type="warning" title="Deprecated Field" %}
`profileID` is deprecated on `biztechMembers2027`. Do not read it from the membership table.
{% /callout %}

---

## Frontend Integration

The membership purchase flow lives in:

- `src/pages/membership.tsx` - the membership purchase page
- `src/lib/registrationStrategy/registrationStateOld.ts` - handles the Stripe redirect

The page collects user data, determines the correct payment path, POSTs to `/payments`, and redirects to Stripe. After payment, the webhook is responsible for creating or updating `biztechUsers`, `biztechMembers2027`, and `biztechProfiles`.

---

## Related Pages

- [User, Member & Profile Relationships](/docs/identity/relationships) - how the three records relate
- [Account Creation](/docs/flows/account-creation) - how user records are created
- [Profile Sync](/docs/flows/profile-sync) - how profiles are created and linked
- [Payment Flow](/docs/systems/payment-flow) - Stripe session creation and webhook handling
- [Members Service](/docs/members) - full member service endpoint reference
- [Admin Detection](/docs/authentication/admin-detection) - admin payment bypass and admin-only endpoints
