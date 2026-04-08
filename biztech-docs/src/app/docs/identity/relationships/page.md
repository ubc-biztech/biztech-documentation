---
title: User, Member & Profile Relationships
nextjs:
  metadata:
    title: User, Member & Profile Relationships
    description: How biztechUsers, biztechMembers2026, and biztechProfiles relate to each other and when each record is created.
---

How the three identity tables — `biztechUsers`, `biztechMembers2026`, and `biztechProfiles` — relate to each other and when each record is created. {% .lead %}

---

## The Three Records

Every fully-registered BizTech member has a record in three tables:

```
biztechUsers          biztechMembers2026        biztechProfiles
┌──────────────┐      ┌──────────────────┐      ┌──────────────────────┐
│ id (email)   │◄────►│ id (email)       │      │ compositeID          │
│ fname        │      │ firstName        │      │   PROFILE#<profileID>│
│ lname        │      │ lastName         │      │ type: PROFILE        │
│ admin        │      │ cardNumber       │      │ firstName            │
│ isMember     │      │ cardCount        │      │ lastName             │
│ faculty      │      │ profileID ───────│─────►│ profileType          │
│ year         │      │ faculty          │      │ viewableMap          │
│ diet         │      │ year             │      │ hobby1, hobby2       │
│ ...          │      │ ...              │      │ linkedIn, ...        │
└──────────────┘      └──────────────────┘      └──────────────────────┘
     PK: id (email)        PK: id (email)        PK: compositeID
                           GSI: profile-query     SK: type
                             on profileID
```

### Key Relationships

- **User → Member**: Linked by `id` (email). A user may or may not have a member record. `isMember` on the user record tracks this.
- **Member → Profile**: The `profileID` field on the member record links to the profile's `compositeID` (as `PROFILE#<profileID>`). The `profile-query` GSI on `biztechMembers2026` allows reverse lookup from `profileID` to email.
- **User → Profile**: No direct link. To get a user's profile, you must look up their member record first to get the `profileID`.

---

## Table Purposes

### biztechUsers Account Record

The user record is the core identity record. It holds authentication-related data and basic demographics.

| Field       | Type    | Notes                                                         |
| ----------- | ------- | ------------------------------------------------------------- |
| `id`        | String  | Email address (primary key)                                   |
| `fname`     | String  | First name                                                    |
| `lname`     | String  | Last name                                                     |
| `admin`     | Boolean | Auto-set on creation for `@ubcbiztech.com` emails. Immutable. |
| `isMember`  | Boolean | Set to `true` after membership payment or admin grant         |
| `faculty`   | String  | Faculty name                                                  |
| `year`      | Number  | Year of study                                                 |
| `diet`      | String  | Dietary restrictions                                          |
| `studentId` | Number  | UBC student number                                            |

**Owner service:** `services/users/handler.js`

### biztechMembers2026 Membership Record

The member record is created when a user becomes a paid member (or is granted membership by an admin). It holds membership-specific data and the link to the profile.

| Field        | Type   | Notes                                              |
| ------------ | ------ | -------------------------------------------------- |
| `id`         | String | Email address (primary key)                        |
| `firstName`  | String | First name (duplicated from user)                  |
| `lastName`   | String | Last name (duplicated from user)                   |
| `cardNumber` | String | Physical NFC card number (assigned later)          |
| `cardCount`  | Number | Starts at 0, incremented when NFC card is written  |
| `profileID`  | String | Human-readable profile ID (set by `createProfile`) |
| `faculty`    | String | Faculty name                                       |
| `year`       | Mixed  | Year of study                                      |

**Owner service:** `services/members/handler.js`

{% callout type="note" title="Year-Suffixed Table" %}
The table name includes the membership year (e.g., `biztechMembers2026`). The constant `MEMBERS2026_TABLE` in `constants/tables.js` controls which year is active. When the membership year rolls over, this constant must be updated and a new table created.
{% /callout %}

### biztechProfiles Public Profile

The profile record holds the user's public-facing profile for the companion app and networking. It uses a composite key structure that stores both profiles and connections in the same table.

| Field         | Type   | Notes                                                                    |
| ------------- | ------ | ------------------------------------------------------------------------ |
| `compositeID` | String | `PROFILE#<profileID>` (partition key)                                    |
| `type`        | String | `PROFILE` for profile rows, `CONNECTION#<id>` for connections (sort key) |
| `profileID`   | String | Human-readable ID (e.g., `SillyPandasDeny`)                              |
| `profileType` | String | `ATTENDEE`, `PARTNER`, or `EXEC`                                         |
| `fname`       | String | Copied from member record at creation (stored as `fname`, not `firstName`) |
| `lname`       | String | Copied from member record at creation (stored as `lname`, not `lastName`)`)`)  |
| `viewableMap` | Object | Privacy toggles per field                                                |

**Owner service:** `services/profiles/handler.js`

---

## When Each Record Gets Created

### Scenario 1: New User Signs Up + Pays for Membership

```
1. Cognito account created (via signUp or OAuth)
2. User goes to /membership, fills form, redirected to Stripe
3. Stripe webhook fires checkout.session.completed
4. webhook() → userMemberSignup() or OAuthMemberSignup():
   a. biztechUsers record created (isMember: true, admin: auto-set)
   b. biztechMembers2026 record created (cardCount: 0)
   c. createProfile() runs → biztechProfiles record created
      + biztechMembers2026.profileID updated via TransactWrite
```

All three records are created atomically in the webhook handler.

### Scenario 2: Existing User Buys Membership

The user already has a `biztechUsers` record (e.g., they registered for a free event before becoming a member).

```
1. Stripe webhook fires
2. webhook() → memberSignup():
   a. biztechUsers record updated (isMember: true)
   b. biztechMembers2026 record created
   c. createProfile() runs → profile created + member.profileID set
```

### Scenario 3: Admin Grants Membership

```
1. Admin calls POST /members/grant with user data
2. grantMembership():
   a. biztechUsers record upserted (creates if doesn't exist, isMember: true)
   b. biztechMembers2026 record created if doesn't exist
   c. createProfile() runs if member has no profileID
```

### Scenario 4: User Without Membership

A user who has never paid for membership (e.g., attended a free event):

```
biztechUsers: EXISTS (isMember: false)
biztechMembers2026: DOES NOT EXIST
biztechProfiles: DOES NOT EXIST
```

The middleware redirects non-members to `/membership` on most routes.

---

## Lookup Patterns

| I have...  | I need...      | How                                                                             |
| ---------- | -------------- | ------------------------------------------------------------------------------- |
| Email      | User record    | `db.getOne(email, USERS_TABLE)`                                                 |
| Email      | Member record  | `db.getOne(email, MEMBERS2026_TABLE)`                                           |
| Email      | Profile        | Get member → read `profileID` → query `PROFILES_TABLE` by `PROFILE#<profileID>` |
| Profile ID | Email          | Query `MEMBERS2026_TABLE` GSI `profile-query` where `profileID = <id>`          |
| Profile ID | Public profile | `GET /profiles/profile/{profileID}` (filtered by `viewableMap`)                 |

---

## Data Duplication

Some fields are stored in multiple tables:

| Field    | `biztechUsers` | `biztechMembers2026` | `biztechProfiles`    |
| -------- | -------------- | -------------------- | -------------------- |
| Name     | `fname/lname`  | `firstName/lastName` | `firstName/lastName` |
| Faculty  | `faculty`      | `faculty`            | —                    |
| Year     | `year`         | `year`               | `year`               |
| Pronouns | `gender`       | `pronouns`           | `pronouns`           |
| Major    | `major`        | `major`              | `major`              |

Name, year, major, and pronouns on the profile are copied from the member record at profile creation time and are **not** kept in sync after creation. If a user updates their name on the user record, the profile still shows the old name. These fields are not in `MUTABLE_PROFILE_ATTRIBUTES` and cannot be changed via `PATCH /profiles/user/`.

---

## Deletion

There is no API endpoint for revoking membership. The `grantMembership` handler only grants — it does not accept a `membership: false` flag and has no deletion logic.

To remove membership, a developer must manually:

1. Set `isMember: false` on the `biztechUsers` record
2. Delete the `biztechMembers2026` record
3. Optionally delete the `biztechProfiles` record

The `DELETE /members/{id}` endpoint deletes the member record only — it does not update the user or profile tables

The `DELETE /members/{id}` endpoint deletes the member record only — it does not update the user or profile tables

The `DELETE /members/{id}` endpoint deletes the member record only — it does not update the user or profile tables.

---

## Related Pages

- [Account Creation](/docs/flows/account-creation) — How user records are created
- [Membership Flow](/docs/flows/membership) — How member and profile records are created
- [Profile Sync](/docs/flows/profile-sync) — Profile creation details and field mapping
- [Users Service](/docs/users) — User CRUD endpoints
- [Members API](/docs/members) — Member CRUD endpoints
- [Profiles API](/docs/profiles) — Profile CRUD endpoints
- [Table Ownership Map](/docs/database/table-ownership) — Which services access which tables
