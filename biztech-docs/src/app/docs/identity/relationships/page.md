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
| Yearly membership | `biztechMembers2027` | Year-specific membership form data. This table should no longer own profile identity. |
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
| isMember    |       | cardCount       |        | fname, lname       |
| faculty     |       | pronouns        |        | pronouns           |
| year        |       | major, year     |        | major, year        |
| diet        |       | yearly answers  |        | viewableMap        |
| ...         |       | ...             |        | linkedIn, ...      |
---------------       ------------------        ----------------------
     PK: id (email)        PK: id (email)        PK: compositeID
     GSI: profileID-index                         SK: type
```

### Key Relationships

- **User -> Member**: Linked by `id` (lowercase email). A user may or may not have a member record. `isMember` on the user record tracks current membership state.
- **User -> Profile**: Linked by `biztechUsers.profileID`. This is the canonical profile identity link.
- **Member -> Profile**: Membership data can refresh profile fields like `pronouns`, `major`, and `year`, but membership rows do not own `profileID`.

---

## Table Schemas

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
| `gender` / `pronouns` | String | - | Existing code mostly uses `gender` on users; profiles use `pronouns`. |
| `diet` | String | - | Dietary restrictions. |
| `isMember` | Boolean | - | Current membership flag. |
| `admin` | Boolean | - | Auto-set for `ubcbiztech.com`; immutable via user API. |
| `favedEventsID;year` | StringSet | - | Favorite events. |
| `createdAt` | Number | - | Epoch ms. |
| `updatedAt` | Number | - | Epoch ms. |

**Indexes**

| Index | Key | Purpose |
| ----- | --- | ------- |
| table primary key | `id` | Email to user. |
| `profileID-index` | `profileID` | Profile ID to user/email. |

**Owner service:** `services/users/handler.js`

### `biztechMembers2027`

Purpose: yearly membership record. It should no longer own profile identity.

| Field | Type | Key / Index | Notes |
| ----- | ---- | ----------- | ----- |
| `id` | String | PK | Lowercase email. |
| `profileType` | String | - | New field. Allowed values are `"ATTENDEE"`, `"EXEC"`, and `"PARTNER"`. Normal paid membership should set `"ATTENDEE"`. |
| `education` | String | - | Membership form value. |
| `firstName` | String | - | Membership form first name. |
| `lastName` | String | - | Membership form last name. |
| `pronouns` | String | - | Used to refresh profile. |
| `studentNumber` | String | - | Membership form student number. |
| `faculty` | String | - | Membership form faculty. |
| `year` | String/Number | - | Used to refresh profile. |
| `major` | String | - | Used to refresh profile. |
| `prevMember` | Boolean/String | - | Previous member answer. |
| `international` | Boolean/String | - | International student answer. |
| `topics` | Array | - | Interest topics. |
| `heardFrom` | String | - | Referral source. |
| `heardFromSpecify` | String | - | Referral detail. |
| `diet` | String | - | Dietary restrictions. |
| `university` | String | - | School/university. |
| `highSchool` | String | - | High school, if applicable. |
| `admin` | Boolean | - | Existing admin snapshot. |
| `cardCount` | Number | - | NFC/card tracking. |
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
| `profileID` | Deprecated. Do not read from membership table anymore. |

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
| `resumeURL` | String | - | New planned field. |
| `description` | String | - | Bio. |
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
