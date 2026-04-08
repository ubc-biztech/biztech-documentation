---
title: Registration Flow
nextjs:
  metadata:
    title: Registration Flow
    description: How event registration works end-to-end, from the frontend form through backend processing, capacity checks, emails, and database writes.
---

How a user registers for an event, step by step: from the form on the frontend through capacity checking, database writes, email notifications, and Slack alerts on the backend. {% .lead %}

---

## Overview

Event registration is one of the most complex flows in the BizTech app. It involves:

1. A dynamic form built from the event's custom registration questions
2. Payment via Stripe (for paid events)
3. Capacity checking and automatic waitlisting
4. QR code generation and email delivery via SendGrid
5. Calendar invite generation (ICS file)
6. Slack notification via SNS

---

## Frontend: The Registration Form

### Entry Point

The registration page lives at `src/pages/event/[eventId]/[year]/register/index.tsx`. When the page loads, it:

1. Fetches the event data from `GET /events/{eventId}/{year}` — this includes the `registrationQuestions` array
2. Fetches current registration counts to show remaining spots
3. Checks if the user is already registered via `GET /registrations?email={email}`
4. If already registered, shows the existing registration status instead of the form

### Dynamic Questions

Each event defines its own registration questions in the `registrationQuestions` array. Each question has a `questionId`, `type`, `required` flag, and optional `choices` and `participantCap`. The form component (`AttendeeEventRegistrationForm.tsx` in `src/components/Events/`) dynamically renders these questions and builds a Zod validation schema from them.

### Form Submission

The form collects two categories of data:

- **Basic information**: email, firstName, lastName, yearLevel, faculty, major, pronouns, diet, howDidYouHear
- **Dynamic responses**: answers to the event's custom questions, keyed by `questionId`

There are two submission paths:

| Path       | When                                | What Happens                                                                     |
| ---------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| Free event | `event.pricing === 0` or no pricing | Calls `POST /registrations` directly                                             |
| Paid event | Event has a price                   | Creates a Stripe checkout session via `POST /payments`, then redirects to Stripe |

The registration strategy pattern is implemented in `src/lib/registrationStrategy/` — it abstracts the difference between free and paid registration flows.

---

## Backend: Registration Handler

### Endpoint

`POST /registrations/` — handler is `post` in `services/registrations/handler.js`.

### Request Payload

```json
{
  "email": "student@example.com",
  "fname": "Alice",
  "eventID": "blueprint",
  "year": 2026,
  "registrationStatus": "registered",
  "basicInformation": {
    "fname": "Alice",
    "lname": "Wong",
    "year": 3,
    "faculty": "Commerce",
    "major": "Accounting",
    "gender": "She/Her",
    "diet": "Vegetarian",
    "heardFrom": "Instagram"
  },
  "dynamicResponses": {
    "workshop-choice": "Product Management",
    "dietary-notes": "No nuts"
  }
}
```

### Processing Steps

**1. Validate input**

The handler validates `email`, `eventID` (string), `year` (number), and `registrationStatus` using `helpers.checkPayloadProps()`.

**2. Check event exists**

Looks up the event in `biztechEvents` table. Returns 404 if not found.

**3. Check for existing registration**

Queries `biztechRegistrations` for this email + eventID;year:

- If a registration exists with status `incomplete` → update it and return (resumes a partial registration)
- If a registration exists with any other status → return 400 (already registered)
- If no registration → proceed to create

**4. Capacity check**

The `getEventCounts()` helper counts current registrations by status:

```javascript
{
  registeredCount, checkedInCount, waitlistCount, dynamicCounts
}
```

If `registeredCount >= event.capac` → the registration status is automatically changed to `"waitlist"`.

The function also tracks per-question participant caps (e.g. if a workshop has a 30-person cap and is full, it can track that).

**5. Send confirmation email**

For non-partner registrations with a `registrationStatus` that isn't `incomplete`, `rejected`, `accepted`, or `checkedIn`:

- **QR code email**: Sent via SendGrid using `sendDynamicQR()` — includes a QR code image inline
- **Calendar invite**: Generated as an ICS file via `sendCalendarInvite()` and sent as an attachment

Both functions are in `services/registrations/helpers.js`.

**6. Write to DynamoDB**

The registration is written to `biztechRegistrations` with:

- Primary key: `id` (email)
- Sort key: `eventID;year` (e.g. `"blueprint;2026"`)
- All basic information and dynamic responses
- `createdAt` timestamp
- For certain events (e.g. Kickstart 2025): initializes a `balance` field

**7. Slack notification**

Sends an SNS message that triggers a Slack notification with the registration details. This is how organizers get notified of new registrations in real-time.

---

## Post-Registration: Check-In

At the event, admins use the QR scanner (`src/components/QrScanner/`) or NFC tap to check attendees in.

Check-in is a `PUT /registrations/{email}/{fname}` call that updates `registrationStatus` to `"checkedIn"`. The admin event dashboard (`/admin/event/[eventId]/[year]`) shows registration status in real-time.

---

## All Registration Endpoints

| Method   | Path                             | Auth | Description                                              |
| -------- | -------------------------------- | ---- | -------------------------------------------------------- |
| `POST`   | `/registrations/`                | 🌐   | Create a new registration                                |
| `GET`    | `/registrations/`                | 🔓   | Query registrations (by email, eventID+year, or all)     |
| `PUT`    | `/registrations/{email}/{fname}` | 🔓   | Update registration (status, points, application status) |
| `DELETE` | `/registrations/{email}`         | 🔓   | Delete a single registration                             |
| `DELETE` | `/registrations`                 | 🔑   | Batch delete registrations (admin only)                  |
| `PUT`    | `/registrations/massUpdate`      | 🔓   | Mass update registrations                                |
| `GET`    | `/registrations/leaderboard/`    | 🔓   | Get leaderboard sorted by points                         |

---

## Key Files

| File                                                                | What It Does                            |
| ------------------------------------------------------------------- | --------------------------------------- |
| `bt-web-v2/src/pages/event/[eventId]/[year]/register/index.tsx`     | Registration page                       |
| `bt-web-v2/src/components/Events/AttendeeEventRegistrationForm.tsx` | Registration form component             |
| `bt-web-v2/src/lib/registrationStrategy/`                           | Free vs paid registration strategy      |
| `serverless-biztechapp-1/services/registrations/handler.js`         | Backend registration handlers           |
| `serverless-biztechapp-1/services/registrations/helpers.js`         | Email, QR code, calendar invite helpers |

---

## Related Pages

- [Events Service](/docs/api-reference/core) — event CRUD endpoints
- [Payments](/docs/api-reference/admin) — Stripe checkout for paid events
- [Authentication](/docs/authentication) — how user identity flows through the registration
- [Database](/docs/database) — `biztechRegistrations` table schema
