---
title: Registrations Service
nextjs:
  metadata:
    title: Registrations Service
    description: Complete reference for the registrations service — endpoints, the updateHelper function, email sending, capacity checks, and the leaderboard.
---

The registrations service handles event registration CRUD, capacity management, email notifications, and the leaderboard. All handlers live in `services/registrations/handler.js`. {% .lead %}

---

## Endpoints

| Method   | Path                             | Auth            | Handler       | Description                                     |
| -------- | -------------------------------- | --------------- | ------------- | ----------------------------------------------- |
| `POST`   | `/registrations/`                | Public          | `post`        | Register for an event                           |
| `PUT`    | `/registrations/{email}/{fname}` | Public          | `put`         | Update a registration (check-in, status change) |
| `GET`    | `/registrations/`                | Public          | `get`         | Query registrations by email or event           |
| `DELETE` | `/registrations/{email}`         | Cognito         | `del`         | Delete one registration                         |
| `DELETE` | `/registrations`                 | Cognito (admin) | `delMany`     | Delete multiple registrations                   |
| `GET`    | `/registrations/leaderboard/`    | Public          | `leaderboard` | Get leaderboard sorted by points                |
| `PUT`    | `/registrations/massUpdate`      | Public          | `massUpdate`  | Bulk update registrations                       |

---

## Registration Data Model

Table: `biztechRegistrations` — Primary key: `id` (email) + sort key: `eventID;year` (string compound)

```json
{
  "id": "jane@student.ubc.ca",
  "eventID;year": "blueprint;2026",
  "registrationStatus": "registered",
  "isPartner": false,
  "points": 0,
  "basicInformation": { "fname": "Jane", "lname": "Doe" },
  "dynamicResponses": { "uuid-1": "I love tech!" },
  "checkoutLink": "https://checkout.stripe.com/...",
  "createdAt": 1735689600000,
  "updatedAt": 1735689600000
}
```

**GSI:** `event-query` — indexes `eventID;year` so you can query all registrations for a given event.

### Registration Statuses

| Status             | Meaning                                                |
| ------------------ | ------------------------------------------------------ |
| `incomplete`       | Started registration, hasn't paid (has `checkoutLink`) |
| `registered`       | Confirmed registration                                 |
| `waitlist`         | Event at capacity                                      |
| `checkedIn`        | Checked in at the event                                |
| `cancelled`        | Cancelled                                              |
| `accepted`         | Application accepted (application events)              |
| `acceptedPending`  | Accepted + free event                                  |
| `acceptedComplete` | Accepted + paid (application events)                   |
| `rejected`         | Application rejected                                   |

---

## POST /registrations/ Create Registration

Steps:

1. Validates required fields (`eventID`, `year`, `email`, etc.)
2. Checks if a registration already exists for this email + event
3. If an `incomplete` registration exists, returns `{ url: existingReg.checkoutLink }` — the frontend uses this to redirect to the existing Stripe session instead of creating a new one
4. Hardcodes initial `balance` for kickstart events:
   - `kickstart;2025` → `50000`
   - `kickstart-showcase;2025` → `100000`
5. Calls `createRegistration()` which uses `db.putDB()` with a conditional expression to prevent duplicates

{% callout title="Re-Registration Shortcut" %}
When a user who started but didn't complete payment tries to register again, the backend returns their existing Stripe checkout link instead of creating a new registration. The frontend detects the `url` field in the response and redirects directly.
{% /callout %}

---

## PUT /registrations/{email}/{fname} Update Registration

The primary endpoint for status changes (check-in, waitlist promotion, acceptance, etc.).

1. Reads `{ eventID, year, registrationStatus, ...otherFields }` from the body
2. Gets email from the path parameter
3. For `accepted` status on free events: auto-sets status to `acceptedPending`
4. Delegates to `updateHelper()` with the update payload

---

## The updateHelper() Function

This is the core registration pipeline — called by create, update, and mass-update operations.

### Steps

1. **Fetch event** from `biztechEvents` to get `capac` (capacity) and event details
2. **Count registrations** by querying the `event-query` GSI on `biztechRegistrations`
3. **Capacity check**: if `registeredCount >= capac` and the new status would be `registered`, auto-downgrade to `waitlist`
4. **Email decision**: determines whether to send emails based on status:

   | Status                                    | Email sent?                                          |
   | ----------------------------------------- | ---------------------------------------------------- |
   | `registered`                              | Yes — QR code + calendar invite                      |
   | `waitlist`                                | Yes — QR code only (no calendar invite)              |
   | `acceptedComplete`                        | Yes — QR code only (no calendar invite)              |
   | `incomplete`                              | No                                                   |
   | `rejected`                                | No                                                   |
   | `accepted`                                | No                                                   |
   | `checkedIn`                               | No                                                   |
   | Partner registrations (`isPartner: true`) | No                                                   |

5. **Send QR email** via `SESEmailService.sendDynamicQR()` — generates an inline QR code image
6. **Send calendar invite** via `SESEmailService.sendCalendarInvite()` — `.ics` attachment (only for `registered` status)
7. **Publish SNS notification** to Slack (registration alerts channel)
8. **Write to DynamoDB** — `db.updateDB()` or `db.putDB()` to `biztechRegistrations`

---

## GET /registrations/ Query Registrations

Supports two query patterns:

### By email

```
GET /registrations/?email=jane@student.ubc.ca
```

Returns all registrations for that email (all events the user has registered for).

### By event

```
GET /registrations/?eventID=blueprint&year=2026
```

Queries the `event-query` GSI to return all registrations for that event.

---

## DELETE /registrations/{email} Delete One

Requires Cognito auth. Takes `{ eventID, year }` in the **request body** (not query parameters) to identify which registration to delete.

## DELETE /registrations Batch Delete

Admin-only (checks `@ubcbiztech.com` email in handler). Takes a body with:

```json
{
  "ids": ["email1@example.com", "email2@example.com"],
  "eventID": "blueprint",
  "year": 2026
}
```

The `ids` array contains email addresses. All specified registrations for the given event are deleted.

---

## GET /registrations/leaderboard/ Leaderboard

Returns all registrations for a given event, sorted by `points` in descending order. Used by the companion app to show the event leaderboard.

Query parameters: `eventID`, `year`

---

## PUT /registrations/massUpdate Bulk Update

Takes an array of registration updates and calls `updateHelper()` for each in parallel using `Promise.all()`. Each update independently runs the full pipeline (capacity check, email, SNS, DynamoDB write).

---

## Email Sending Details

### SESEmailService Class

**File:** `services/registrations/EmailService/SESEmailService.js`

Two methods:

**`sendDynamicQR(registrationData)`**

- Generates a QR code encoding the attendee's email and event ID
- Embeds the QR code as an inline image in the email
- Includes event name, date, and location

**`sendCalendarInvite(registrationData)`**

- Builds an `.ics` calendar file with the event's start/end times
- Attaches it to the email as a MIME attachment
- Uses `ses:SendRawEmail` for the attachment

---

## DynamoDB Tables

| Table                  | Key                           | GSIs                                | Usage                              |
| ---------------------- | ----------------------------- | ----------------------------------- | ---------------------------------- |
| `biztechRegistrations` | `id` (email) + `eventID;year` | `event-query` (eventID;year → HASH) | Registration records               |
| `biztechEvents`        | `id` + `year`                 | —                                   | Event lookup for capacity, details |
| `biztechUsers`         | `id` (email)                  | —                                   | User lookup in some flows          |

---

## Side Effects

| Side effect                 | When                                                   |
| --------------------------- | ------------------------------------------------------ |
| SES email (QR code)         | On `registered`, `waitlist`, `acceptedComplete` status              |
| SES email (calendar invite) | On `registered` status only                                         |
| SNS → Slack                 | On every registration/update via `updateHelper()`      |

---

## Key Files

| File                                                | Purpose                                               |
| --------------------------------------------------- | ----------------------------------------------------- |
| `services/registrations/handler.js`                 | All registration endpoint handlers + `updateHelper()` |
| `services/registrations/EmailService/SESEmailService.js` | QR code and calendar invite email sending        |
| `services/registrations/serverless.yml`             | Endpoint definitions, IAM permissions                 |
| `services/registrations/test/`                      | Unit tests                                            |
| `services/registrations/test_integration/`          | Integration tests                                     |

---

## Related Pages

- [Registration System](/docs/systems/registration) — the registration state machine and frontend integration
- [Event Check-In](/docs/flows/check-in) — check-in via QR scan
- [Payment Flow](/docs/systems/payment-flow) — how paid registrations complete
- [Email Service](/docs/deep-dives/emails) — email infrastructure overview
