---
title: Users Service
nextjs:
  metadata:
    title: Users Service
    description: API endpoints for the Users service in serverless-biztechapp-1, covering user CRUD, membership checks, favorites, and the GET /users/self pattern.
---

The Users service manages user accounts in the `biztechUsers` DynamoDB table. Handlers live in `services/users/handler.js`. {% .lead %}

---

## Endpoints

| Method   | Path                             | Auth       | Description                                    |
| -------- | -------------------------------- | ---------- | ---------------------------------------------- |
| `POST`   | `/users`                         | 🌐         | Create a user                                  |
| `GET`    | `/users/check/{email}`           | 🌐         | Check whether a user record exists             |
| `GET`    | `/users/checkMembership/{email}` | 🌐         | Check whether a user's `isMember` flag is true |
| `GET`    | `/users/{email}`                 | 🔓         | Get a user record (see behavior note below)    |
| `GET`    | `/users`                         | 🔓 (admin) | List all users                                 |
| `PATCH`  | `/users/{email}`                 | 🔓         | Update a user                                  |
| `PATCH`  | `/users/favEvent/{email}`        | 🔓         | Toggle a favorite event                        |
| `DELETE` | `/users/{email}`                 | 🔓         | Delete a user                                  |

---

## `GET /users/{email}` — Self vs. Admin Lookup

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

## User Object Shape

| Field                | Type          | Description                                                                 |
| -------------------- | ------------- | --------------------------------------------------------------------------- |
| `id`                 | string        | User's email (primary key)                                                  |
| `fname`              | string        | First name                                                                  |
| `lname`              | string        | Last name                                                                   |
| `email`              | string        | Redundant email field (same as `id`)                                        |
| `education`          | string        | Education status                                                            |
| `studentId`          | number        | UBC student number                                                          |
| `faculty`            | string        | Faculty                                                                     |
| `major`              | string        | Major/program                                                               |
| `year`               | number        | Year of study                                                               |
| `gender`             | string        | Pronouns/gender                                                             |
| `diet`               | string        | Dietary restrictions                                                        |
| `isMember`           | boolean       | Whether the user has paid membership                                        |
| `admin`              | boolean       | Whether the user is a BizTech admin (auto-set for `@ubcbiztech.com` emails) |
| `favedEventsID;year` | Set\<string\> | Favorite event IDs in `"eventId;year"` format                               |
| `createdAt`          | number        | Unix timestamp (ms)                                                         |
| `updatedAt`          | number        | Unix timestamp (ms)                                                         |

### Immutable Fields

The `admin` field cannot be changed via `PATCH /users/{email}`. It is set on creation and treated as immutable. See `constants/tables.js` → `IMMUTABLE_USER_PROPS`.

---

## `POST /users`: Create User

**Request body:**

```json
{
  "email": "student@example.com",
  "fname": "Alice",
  "lname": "Wong",
  "education": "Bachelor's",
  "studentId": 12345678,
  "faculty": "Commerce",
  "major": "Accounting",
  "year": 3,
  "gender": "She/Her",
  "diet": "None",
  "isMember": false
}
```

**Behavior:**

- Email is validated and lowercased.
- If the email domain is `ubcbiztech.com`, `admin` is set to `true` automatically.
- Returns `409` if a user with this email already exists.
- Returns `201` with the created user params on success.

---

## `GET /users/check/{email}`

Returns `true` if a user record exists, `false` otherwise. Used before registration to check if an account needs to be created. No auth required.

---

## `GET /users/checkMembership/{email}`

Returns `true` if the user exists and has `isMember: true`. Used by the membership signup flow to skip the payment step if the user is already a member. No auth required.

---

## Related Pages

- [Create User](/docs/users/create) — detailed create endpoint docs
- [Get User](/docs/users/get-user) — detailed get endpoint docs
- [Update User](/docs/users/update-user) — detailed update endpoint docs
- [Check User](/docs/users/check-user) — check existence
- [Check Membership](/docs/users/check-user-membership) — check membership flag
- [Favourite Event](/docs/users/favourite-event) — toggle favorite events
- [Delete User](/docs/users/delete-user) — delete user
- [Authentication](/docs/authentication) — how users authenticate and how the JWT claims work
