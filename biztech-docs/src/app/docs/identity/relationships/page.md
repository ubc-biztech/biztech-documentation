---
title: User, Member & Profile Relationships
nextjs:
  metadata:
    title: User, Member & Profile Relationships
    description: How biztechUsers, biztechMembers2027, and biztechProfiles relate to each other and when each record is created.
---

How the three identity tables - `biztechUsers`, `biztechMembers2027`, and `biztechProfiles` - relate to each other and when each record is created. {% .lead %}

---

## Ownership Rules

| Area | Source of truth | Notes |
| ---- | --------------- | ----- |
| Account identity | `biztechUsers` | Stable user row keyed by lowercase email. This is the source of truth for `profileID`. |
| Yearly membership | `biztechMembers2027` | Row existence means the user is a current 2027 member. This table does not own profile identity. |
| Networking profile | `biztechProfiles` | Public/private profile data plus connection rows keyed by profile ID. |

Important rule for docs and implementation:

- User owns profile identity.
- Membership owns yearly membership data.
- Profile owns networking and public profile data.

---

## The Three Records

Every fully-registered BizTech member has records across three tables:

```
biztechUsers          biztechMembers2027        biztechProfiles
---------------       ------------------        ----------------------
| id (email)  | <---> | id (email)      |        | compositeID        |
| profileID --|-------------------------------> | PROFILE#<profileID>|
| fname       |       | firstName       |        | type: PROFILE      |
| lname       |       | lastName        |        | profileID          |
| admin       |       | profileType     |        | profileType        |
| education   |       | cardCount       |        | fname, lname       |
| faculty     |       | pronouns        |        | pronouns           |
| year        |       | major, year     |        | major, year        |
| diet        |       | yearly answers  |        | viewableMap        |
| ...         |       | ...             |        | linkedIn, ...      |
---------------       ------------------        ----------------------
     PK: id (email)        PK: id (email)        PK: compositeID
     GSI: profileID-index                         SK: type
```

### Key Relationships

- **User -> Member**: Linked by `id` (lowercase email). The existence of a `biztechMembers2027` row means the user is a current member.
- **User -> Profile**: Linked by `biztechUsers.profileID`. This is the canonical profile identity link.
- **Member -> Profile**: Membership data can refresh profile fields like `pronouns`, `major`, and `year`, but membership rows do not own `profileID`.

---

## Table Schemas

DynamoDB enforces the key attributes. Other fields below describe the effective write-path shape and may be absent unless noted otherwise.

### `biztechUsers`

Purpose: stable account identity. This table is now the source of truth for `profileID`.

| Field | Type | Key / Index | Notes |
| ----- | ---- | ----------- | ----- |
| `id` | String | PK | Lowercase email. |
| `profileID` | String | GSI `profileID-index` | Stable profile ID. Used to find the user's profile. |
| `fname` | String | - | First name. |
| `lname` | String | - | Last name. |
| `education` | String | - | School/education status. |
| `studentId` | String/Number | - | Student number. |
| `faculty` | String | - | Faculty. |
| `major` | String | - | Major/program. |
| `year` | String/Number | - | Year of study. |
| `gender` | String | - | Existing user write paths store pronouns/gender under `gender`; profiles use `pronouns`. |
| `diet` | String | - | Dietary restrictions. |
| `admin` | Boolean | - | Auto-set for `ubcbiztech.com`; immutable via user API. |
| `favedEventsID;year` | StringSet | - | Favorite events. |
| `createdAt` | Number | - | Epoch ms. |
| `updatedAt` | Number | - | Epoch ms. |

**Indexes**

| Index | Key | Purpose |
| ----- | --- | ------- |
| table primary key | `id` | Email to user. |
| `profileID-index` | `profileID` | `KEYS_ONLY` projection; profile ID to user/email. |

**Owner service:** `services/users/handler.js`

`isMember` is not part of the current user write/read contract. Older rows may still contain it, but membership checks use the yearly members table and ignore the legacy attribute.

### `biztechMembers2027`

Purpose: yearly membership record. Row existence means active membership for 2027; this row does not own profile identity.

| Field | Type | Key / Index | Notes |
| ----- | ---- | ----------- | ----- |
| `id` | String | PK | Lowercase email. |
| `profileType` | String | - | New field. Allowed values are `"ATTENDEE"`, `"EXEC"`, and `"PARTNER"`. Normal paid membership should set `"ATTENDEE"`. |
| `education` | String | - | Membership form value. |
| `firstName` | String | - | Membership form first name. |
| `lastName` | String | - | Membership form last name. |
| `pronouns` | String | - | Used to refresh profile. |
| `studentNumber` | String/Number | - | Membership form student number. |
| `faculty` | String | - | Membership form faculty. |
| `year` | String/Number | - | Used to refresh profile. |
| `major` | String | - | Used to refresh profile. |
| `prevMember` | Boolean | - | Previous member answer. |
| `international` | Boolean | - | International student answer. |
| `topics` | String[] | - | Interest topics. |
| `heardFrom` | String | - | Referral source. |
| `heardFromSpecify` | String | - | Referral detail. |
| `diet` | String | - | Dietary restrictions. |
| `university` | String | - | School/university. |
| `highSchool` | String | - | High school, if applicable. |
| `admin` | Boolean | - | Existing admin snapshot. |
| `cardCount` | Number | - | NFC/card tracking; defaults to `0`. |
| `discordId` | String | - | Existing location for now, though eventually user-level is cleaner. |
| `createdAt` | Number | - | Epoch ms. |
| `updatedAt` | Number | - | Epoch ms. |

**Indexes**

| Index | Key | Purpose |
| ----- | --- | ------- |
| table primary key | `id` | Email to yearly membership. |

**Deprecated/removed from docs as source of truth**

| Field | Status |
| ----- | ------ |
| `profileID` | Not part of the current row shape. Read it from `biztechUsers`. |

**Owner service:** `services/members/handler.js`

{% callout type="note" title="Year-Suffixed Table" %}
The table name includes the membership year. The active yearly members table is now `biztechMembers2027`; when the membership year rolls over, update the table constant and create the corresponding DynamoDB table.
{% /callout %}

### `biztechProfiles`

Purpose: public/private profile data and connection rows.

#### Profile Row

| Field | Type | Key / Index | Notes |
| ----- | ---- | ----------- | ----- |
| `compositeID` | String | PK | `PROFILE#{profileID}`. |
| `type` | String | SK | `"PROFILE"` for profile row. |
| `profileID` | String | - | Stored explicitly now for convenience. |
| `profileType` | String | - | `"ATTENDEE"`, `"EXEC"`, or `"PARTNER"`. |
| `fname` | String | - | Public profile first name. |
| `lname` | String | - | Public profile last name. |
| `pronouns` | String | - | Refreshed from membership purchase. |
| `major` | String | - | Refreshed from membership purchase. |
| `year` | String/Number | - | Refreshed from membership purchase. |
| `hobby1` | String | - | Editable profile field. |
| `hobby2` | String | - | Editable profile field. |
| `funQuestion1` | String | - | Editable profile field. |
| `funQuestion2` | String | - | Editable profile field. |
| `linkedIn` | String | - | Editable. |
| `profilePictureURL` | String | - | Editable/uploaded. |
| `additionalLink` | String | - | Editable. |
| `resumeURL` | String | - | Resume link. |
| `description` | String | - | Bio. |
| `company` | String | - | Company name, when applicable. |
| `position` | String | - | Position/title, when applicable. |
| `viewableMap` | Object | - | Visibility flags. |
| `createdAt` | Number | - | Epoch ms. |
| `updatedAt` | Number | - | Epoch ms. |

#### Connection Row

| Field | Type | Key / Index | Notes |
| ----- | ---- | ----------- | ----- |
| `compositeID` | String | PK | `PROFILE#{sourceProfileID}`. |
| `type` | String | SK | `CONNECTION#{targetProfileID}`. |
| `connectionID` | String | - | Target profileID. |
| `connectionType` | String | - | Target profile type. |
| `createdAt` | Number | - | First connection timestamp. |
| `fname`, `lname`, `pronouns`, `major`, `year`, `company`, `title` | Mixed | - | Denormalized target snapshot. |

A connection normally writes two rows, one under each profile, so the relationship is bidirectional.

**Indexes**

| Index | Key | Purpose |
| ----- | --- | ------- |
| table primary key | `compositeID`, `type` | Profile row and profile-scoped connection rows. |

**Owner service:** `services/profiles/handler.js`

---

## Lookup Patterns

| I have... | I need... | How |
| --------- | --------- | --- |
| Email | User record | Read `biztechUsers` by `id`. |
| Email | Yearly member record | Read `biztechMembers2027` by `id`. |
| Email | Profile | Read `biztechUsers.profileID`, then read `biztechProfiles` with `compositeID: "PROFILE#{profileID}"` and `type: "PROFILE"`. |
| Profile ID | User/email | Query `biztechUsers.profileID-index` by `profileID`. |
| Profile ID | Public profile | `GET /profiles/profile/{profileID}` filtered by `viewableMap`. |

{% callout type="warning" title="Deprecated Profile Lookup" %}
Do not read `profileID` from `biztechMembers2027`. Membership rows no longer own profile identity.
{% /callout %}

---

## Related Pages

- [Membership Flow](/docs/flows/membership) - How member and profile records are created
- [Profile Sync](/docs/flows/profile-sync) - Profile creation details and field mapping
- [Users Service](/docs/users) - User CRUD endpoints
- [Members API](/docs/members) - Member CRUD endpoints
- [Profiles API](/docs/profiles) - Profile CRUD endpoints
- [Table Ownership Map](/docs/database/table-ownership) - Which services access which tables
