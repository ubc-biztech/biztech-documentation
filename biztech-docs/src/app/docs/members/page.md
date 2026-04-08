---
title: Members Service
nextjs:
  metadata:
    title: Members Service
    description: The Members service manages BizTech membership records — CRUD operations on biztechMembers2026 and the grant flow.
---

The Members service manages membership records in the `biztechMembers2026` DynamoDB table. **All endpoints are admin-only** (caller must have a `@ubcbiztech.com` email). Handlers are in `services/members/handler.js`. {% .lead %}

---

## Endpoints

| Method   | Path                         | Handler               | Description                   |
| -------- | ---------------------------- | --------------------- | ----------------------------- |
| `POST`   | `/members`                   | `create`              | Create a member record        |
| `GET`    | `/members/{id}`              | `get`                 | Get a member by email         |
| `GET`    | `/members`                   | `getAll`              | List all members              |
| `PATCH`  | `/members/{id}`              | `update`              | Update a member record        |
| `DELETE` | `/members/{id}`              | `del`                 | Delete a member record        |
| `POST`   | `/members/grant`             | `grantMembership`     | Grant membership              |
| `GET`    | `/members/email/{profileID}` | `getEmailFromProfile` | Look up email from profile ID |

All endpoints require Cognito authentication + `@ubcbiztech.com` email.

---

## Tables

The members service operates on multiple tables:

| Table                | Role                                          |
| -------------------- | --------------------------------------------- |
| `biztechUsers`       | Updated during grant (`isMember` flag) |
| `biztechMembers2026` | Primary member records                        |
| `biztechProfiles`    | Created during grant if no profile exists     |

{% callout type="note" title="Year-Suffixed Table" %}
The table name `biztechMembers2026` includes the membership year. The constant `MEMBERS2026_TABLE` in `constants/tables.js` controls which year is active. When the year rolls over, this constant and the corresponding DynamoDB table must be updated.
{% /callout %}

---

## GET /members/{id}

Fetch a single member by email.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Path Param | Description    |
| ---------- | -------------- |
| id         | Member’s email |

**Example Request**

```
GET /members/student@example.com
```

**Response**

```javascript
{
  "id": "student@example.com",
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

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

**Response**

```javascript
{
  "message": "success",
  "data": [
    {
      "id": "student@example.com",
      "firstName": "Alice",
      "lastName": "Wong",
      "year": "3",
      "major": "Accounting",
      "createdAt": 1755702100000,
      "updatedAt": 1755702100000
    },
    {
      "id": "bob@example.com",
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

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Path Param | Description    |
| ---------- | -------------- |
| id         | Member’s email |

**Body**

- Accepts any subset of the fields from `POST /members/`.

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

Delete a member by email.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Path Param | Description    |
| ---------- | -------------- |
| id         | Member’s email |

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

Grant membership for a user. This endpoint creates or updates user, member, and profile records as needed. There is **no revocation path** — this handler only grants.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

The body must contain the full set of member fields (the handler reads all of them):

| Body Property         | Type     | Description                                 |
| --------------------- | -------- | ------------------------------------------- |
| email                 | String   | User email (required)                       |
| firstName             | String   | First name                                  |
| lastName              | String   | Last name                                   |
| education             | String   | University or institution                   |
| studentNumber         | String   | Student number                              |
| pronouns              | String   | Pronouns                                    |
| levelOfStudy / year   | String   | Year of study (handler checks both fields)  |
| faculty               | String   | Faculty                                     |
| major                 | String   | Major                                       |
| internationalStudent  | Boolean  | International student flag                  |
| previousMember        | Boolean  | Was a member in a previous year             |
| dietaryRestrictions   | String   | Dietary restrictions                        |
| referral              | String   | How they heard about BizTech                |
| topics                | String[] | Topics of interest                          |

**Example Request**

```javascript
{
  "email": "isaacliu@gmail.com",
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

1. If the user does not exist in `biztechUsers`, creates a new user record via `db.put`
2. If the user exists, updates the user record via `db.updateDB` and sets `isMember: true`
3. If no member record exists in `biztechMembers2026`, creates one with all provided fields plus `cardCount: 0`
4. If no profile exists (checked via `profileID` on the member record), creates a profile via `createProfile()` — type is `EXEC` for `@ubcbiztech.com` emails, `ATTENDEE` otherwise

{% callout type="warning" title="No Revocation" %}
Despite the handler name, `grantMembership` only grants. There is no `membership: false` flag and no code path for revoking membership or deleting records. To revoke membership, update the DynamoDB records directly.
{% /callout %}

**Errors**

- `403` Unauthorized if caller is not `@ubcbiztech.com`
- `400` Invalid email format
