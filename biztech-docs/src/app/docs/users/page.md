---
title: Users Service
nextjs:
  metadata:
    title: Users Service
    description: API endpoints for the Users service — user CRUD, membership checks, favorites, and the GET /users/self pattern.
---

The Users service manages user accounts in the `biztechUsers` DynamoDB table. Handlers are in `services/users/handler.js`. {% .lead %}

---

## Endpoints

| Method   | Path                             | Auth          | Handler               | Description                        |
| -------- | -------------------------------- | ------------- | --------------------- | ---------------------------------- |
| `POST`   | `/users`                         | Public        | `create`              | Create a user                      |
| `GET`    | `/users/check/{email}`           | Public        | `checkUser`           | Check whether a user record exists |
| `GET`    | `/users/checkMembership/{email}` | Public        | `checkUserMembership` | Check `isMember` flag              |
| `GET`    | `/users/{email}`                 | Cognito       | `get`                 | Get user record (see self pattern) |
| `GET`    | `/users`                         | Cognito       | `getAll`              | List all users (no handler-level admin check) |
| `PATCH`  | `/users/{email}`                 | Cognito       | `update`              | Update a user                      |
| `PATCH`  | `/users/favEvent/{email}`        | Cognito       | `favouriteEvent`      | Toggle a favorite event            |
| `DELETE` | `/users/{email}`                 | Cognito       | `del`                 | Delete a user                      |

---

## GET /users/{email} Self vs. Admin Lookup

This endpoint has a special behavior: **non-admin callers always get their own record**, regardless of the `{email}` path param.

The handler reads the caller's email from the Cognito JWT claims:

```javascript
let email = event.requestContext.authorizer.claims.email.toLowerCase()
// Only admins can override the email from path params:
if (
  email.endsWith('@ubcbiztech.com') &&
  isValidEmail(event.pathParameters.email)
) {
  email = event.pathParameters.email
}
```

**This is why the frontend and middleware call `GET /users/self`.** The string `"self"` is not a real path segment — it's a placeholder that gets ignored. The handler resolves identity from the Cognito token, so any value in `{email}` works for non-admins. Admins can pass a real email to fetch any user.

---

## User Record Shape

| Field                | Type      | Description                                                   |
| -------------------- | --------- | ------------------------------------------------------------- |
| `id`                 | String    | Email address (primary key)                                   |
| `fname`              | String    | First name                                                    |
| `lname`              | String    | Last name                                                     |
| `email`              | String    | Email (redundant with `id`)                                   |
| `education`          | String    | Education status                                              |
| `studentId`          | Number    | UBC student number                                            |
| `faculty`            | String    | Faculty                                                       |
| `major`              | String    | Major/program                                                 |
| `year`               | Number    | Year of study                                                 |
| `gender`             | String    | Pronouns/gender                                               |
| `diet`               | String    | Dietary restrictions                                          |
| `isMember`           | Boolean   | `true` after membership payment or admin grant                |
| `admin`              | Boolean   | Auto-set for `@ubcbiztech.com` emails. **Immutable via API.** |
| `favedEventsID;year` | StringSet | Favorite event IDs in `"eventId;year"` format                 |
| `createdAt`          | Number    | Unix timestamp (ms)                                           |
| `updatedAt`          | Number    | Unix timestamp (ms)                                           |

### Immutable Fields

The `admin` field cannot be changed via `PATCH /users/{email}`. The handler checks for immutable props and **throws an error** (not a silent strip) if any are included in the update bodyhrows an error** (not a silent strip) if any are included in the update bodyhrows an error** (not a silent strip) if any are included in the update body. See `constants/tables.js` → `IMMUTABLE_USER_PROPS`.

---

## POST /users Create User

**Auth:** Public (no Cognito required)

Creates a user record. The email is validated and lowercased.

- If the email ends with `@ubcbiztech.com`, `admin` is set to `true` automatically
- Returns `409` if a user with this email already exists (enforced by DynamoDB `ConditionExpression: attribute_not_exists(id)`)
- Returns `201` with the created user params on success
- Optional `favedEventsArray` (array of strings, validated for uniqueness, stored as DynamoDB StringSet)

---

## GET /users/check/{email}

**Auth:** Public

Returns `true` (200) if a user record exists, `false` (200) if not. Used before registration to check whether an account needs to be created.

---

## GET /users/checkMembership/{email}

**Auth:** Public

Returns the value of `isMember` if the user exists, `false` if the user does not exist. Used by the membership signup flow to skip the payment step for existing members.

---

## PATCH /users/{email} Update User

**Auth:** Cognito

Updates user fields. The handler validates the user exists first. If the request body contains any field in `IMMUTABLE_USER_PROPS` (currently `["admin"]`), the handler **throws an error** — it does not silently strip the fieldshe fieldshe fields.

---

## PATCH /users/favEvent/{email} Toggle Favorite Event

**Auth:** Cognito

Toggles a favorite event on or off.

**Request body:**

| Field         | Type    | Required | Description                      |
| ------------- | ------- | -------- | -------------------------------- |
| `eventID`     | String  | Yes      | Event ID                         |
| `year`        | Number  | Yes      | Event year                       |
| `isFavourite` | Boolean | Yes      | `true` to add, `false` to remove |

The handler validates that the event exists in `biztechEvents` and the user exists in `biztechUsers`. It uses DynamoDB `ADD`/`DELETE` operations on the `favedEventsID;year` StringSet.

---

## DELETE /users/{email}

**Auth:** Cognito

Deletes the user record from `biztechUsers`. Validates the user exists first.

---

## IAM Permissions

The users service has IAM access to:

- `biztechUsers*` — Scan, GetItem, PutItem, UpdateItem, DeleteItem
- `biztechEvents*` — GetItem (for favourite event validation)
- `inviteCodes*` — GetItem (legacy invite code system)

---

## Related Pages

- [User, Member & Profile Relationships](/docs/identity/relationships) — How user, member, and profile records connect
- [Account Creation](/docs/flows/account-creation) — How user records are created during signup
- [Authentication Overview](/docs/authentication) — Cognito auth and the JWT claims used by this service
- [Admin Detection](/docs/authentication/admin-detection) — How the `admin` field is set and enforced
