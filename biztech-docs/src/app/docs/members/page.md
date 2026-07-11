---
title: Members Service
nextjs:
  metadata:
    title: Members Service
    description: The Members service manages BizTech yearly membership records - CRUD operations on biztechMembers2027 and the grant flow.
---

The Members service manages yearly membership records in the `biztechMembers2027` DynamoDB table. **All endpoints are admin-only** (caller must have a `@ubcbiztech.com` email). Handlers are in `services/members/handler.js`. {% .lead %}

---

## Endpoints

| Method | Path | Handler | Description |
| ------ | ---- | ------- | ----------- |
| `POST` | `/members` | `create` | Create a yearly member record |
| `GET` | `/members/{id}` | `get` | Get a member by email |
| `GET` | `/members` | `getAll` | List all members |
| `PATCH` | `/members/{id}` | `update` | Update a member record |
| `DELETE` | `/members/{id}` | `del` | Delete a member record |
| `POST` | `/members/grant` | `grantMembership` | Grant membership |
| `GET` | `/members/email/{profileID}` | `getEmailFromProfile` | Legacy lookup; prefer `biztechUsers.profileID-index` |

All endpoints require Cognito authentication + `@ubcbiztech.com` email.

{% callout type="warning" title="Profile Lookup Ownership" %}
Membership rows no longer own profile identity. Use `biztechUsers.profileID` and `profileID-index` as the source of truth for profile lookups.
{% /callout %}

---

## Tables

The members service operates on multiple tables:

| Table | Role |
| ----- | ---- |
| `biztechUsers` | Created or updated during grant/payment flow (`isMember` flag and canonical `profileID`) |
| `biztechMembers2027` | Primary yearly member records |
| `biztechProfiles` | Created or refreshed when membership changes |

{% callout type="note" title="Year-Suffixed Table" %}
The table name `biztechMembers2027` includes the membership year. When the year rolls over, the corresponding table constant and DynamoDB table must be updated.
{% /callout %}

---

## Member Record Shape

Table: `biztechMembers2027`

Purpose: yearly membership record. It should no longer own profile identity.

| Field | Type | Key / Index | Notes |
| ----- | ---- | ----------- | ----- |
| `id` | String | PK | Lowercase email. |
| `profileType` | String | - | New field. Normal paid membership should set `"MEMBER"`. |
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

---

## GET /members/{id}

Fetch a single member by email.

**Request**

| Headers | Type |
| ------- | ---- |
| Authorization | Bearer Token |

| Path Param | Description |
| ---------- | ----------- |
| id | Member's email |

**Example Request**

```
GET /members/student@example.com
```

**Response**

```javascript
{
  "id": "student@example.com",
  "profileType": "MEMBER",
  "firstName": "Alice",
  "lastName": "Wong",
  "faculty": "Commerce",
  "year": "3",
  "major": "Accounting",
  "international": true,
  "topics": ["Finance", "Tech"],
  "createdAt": 1755702100000,
  "updatedAt": 1755702100000
}
```

**Errors**

- `403` Unauthorized
- `400` Invalid email
- `404` Member not found

---

## GET /members/

Fetch all members.

**Request**

| Headers | Type |
| ------- | ---- |
| Authorization | Bearer Token |

**Response**

```javascript
{
  "message": "success",
  "data": [
    {
      "id": "student@example.com",
      "profileType": "MEMBER",
      "firstName": "Alice",
      "lastName": "Wong",
      "year": "3",
      "major": "Accounting",
      "createdAt": 1755702100000,
      "updatedAt": 1755702100000
    },
    {
      "id": "bob@example.com",
      "profileType": "MEMBER",
      "firstName": "Bob",
      "lastName": "Li",
      "year": "4",
      "major": "Finance"
    }
  ]
}
```

---

## PATCH /members/{id}

Update an existing member by email.

**Request**

| Headers | Type |
| ------- | ---- |
| Authorization | Bearer Token |

| Path Param | Description |
| ---------- | ----------- |
| id | Member's email |

**Body**

- Accepts any subset of the fields from the `biztechMembers2027` record shape.
- Do not write `profileID`; profile identity belongs on `biztechUsers`.

**Example Request**

```javascript
{
  "major": "Business Technology Management",
  "year": "4",
  "topics": ["Consulting", "AI"]
}
```

**Response**

```javascript
{
  "message": "Updated member with email student@example.com!",
  "response": {
    "Attributes": {
      "major": "Business Technology Management",
      "year": "4",
      "topics": ["Consulting", "AI"],
      "updatedAt": 1755703100000
    }
  }
}
```

**Errors**

- `403` Unauthorized
- `400` Invalid email
- `404` Member not found

---

## DELETE /members/{id}

Delete a yearly member record by email.

**Request**

| Headers | Type |
| ------- | ---- |
| Authorization | Bearer Token |

| Path Param | Description |
| ---------- | ----------- |
| id | Member's email |

**Example Request**

```
DELETE /members/student@example.com
```

**Response**

```javascript
{
  "message": "Member deleted!",
  "response": {
    "id": "student@example.com"
  }
}
```

**Errors**

- `403` Unauthorized
- `400` Invalid email
- `404` Member not found

---

## POST /members/grant

Grant membership for a user. This endpoint creates or updates user, member, and profile records as needed. There is **no revocation path** - this handler only grants.

**Request**

| Headers | Type |
| ------- | ---- |
| Authorization | Bearer Token |

The body should contain the member fields needed to create or refresh the yearly membership:

| Body Property | Type | Description |
| ------------- | ---- | ----------- |
| email | String | User email (required) |
| profileType | String | New field. Normal paid membership should set `"MEMBER"` |
| firstName | String | First name |
| lastName | String | Last name |
| education | String | University or institution |
| studentNumber | String | Student number |
| pronouns | String | Pronouns |
| levelOfStudy / year | String | Year of study (handler checks both fields) |
| faculty | String | Faculty |
| major | String | Major |
| internationalStudent / international | Boolean | International student flag |
| previousMember / prevMember | Boolean | Was a member in a previous year |
| dietaryRestrictions / diet | String | Dietary restrictions |
| referral / heardFrom | String | How they heard about BizTech |
| heardFromSpecify | String | Referral detail |
| topics | String[] | Topics of interest |

**Example Request**

```javascript
{
  "email": "isaacliu@gmail.com",
  "profileType": "MEMBER",
  "firstName": "Isaac",
  "lastName": "Liu",
  "education": "University of British Columbia",
  "studentNumber": "12345678",
  "pronouns": "He/Him/His",
  "levelOfStudy": "3",
  "faculty": "Commerce",
  "major": "BUCS",
  "internationalStudent": false,
  "previousMember": true,
  "dietaryRestrictions": "None",
  "referral": "Friend",
  "topics": ["Finance", "Tech"]
}
```

**Response**

```javascript
{
  "message": "Membership granted"
}
```

**Behavior**

1. If the user does not exist in `biztechUsers`, creates a new user record with `isMember: true`.
2. If the user exists, updates the user record with latest basic fields and sets `isMember: true`.
3. Creates a yearly member row in `biztechMembers2027` with `profileType: "MEMBER"` if no explicit profile type is provided.
4. Reads `biztechUsers.profileID`.
5. If `profileID` exists, refreshes the existing `biztechProfiles` row with membership fields such as `pronouns`, `major`, and `year`.
6. If `profileID` is missing, creates a profile via `createProfile(email, "MEMBER")` and writes the generated profile ID to `biztechUsers.profileID`.

{% callout type="warning" title="No Revocation" %}
Despite the handler name, `grantMembership` only grants. There is no `membership: false` flag and no code path for revoking membership or deleting records. To revoke membership, update the DynamoDB records directly.
{% /callout %}

**Errors**

- `403` Unauthorized if caller is not `@ubcbiztech.com`
- `400` Invalid email format

---

## Related Pages

- [User, Member & Profile Relationships](/docs/identity/relationships) - how the three records relate
- [Membership Flow](/docs/flows/membership) - paid membership write path
- [Users Service](/docs/users) - account identity and `profileID-index`
- [Profiles Service](/docs/profiles) - profile rows and connection rows
