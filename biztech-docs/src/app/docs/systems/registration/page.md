---
title: Registration System
nextjs:
  metadata:
    title: Registration System
    description: Complete documentation of the event registration system, covering all components across frontend, backend, database, email, and payment.
---

The registration system is the most complex flow in the BizTech app. It spans the frontend form, backend validation, capacity management, Stripe payments, email delivery (QR codes + calendar invites), and Slack notifications. {% .lead %}

---

## Architecture

```
Frontend                  Backend                        External
─────────────────        ──────────────────────          ──────────
Registration Form  ───→  POST /registrations/     ───→   DynamoDB
  ├ basic info            ├ validate event exists         SendGrid (QR email)
  ├ custom questions      ├ check existing reg            SES (calendar invite)
  └ payment link?         ├ capacity check                SNS → Slack
                          ├ write registration             Stripe (if paid)
Stripe Checkout    ───→  POST /payments/webhook   ───→   Update reg status
```

---

## Components

### Frontend

| File                                                      | Role                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| `src/pages/event/[eventId]/[year]/register/index.tsx`     | Registration page — loads event, checks capacity, renders form |
| `src/components/Events/AttendeeEventRegistrationForm.tsx` | The form component — dynamic questions, Zod validation         |
| `src/lib/registrationStrategy/`                           | Abstracts free vs paid registration paths                      |

### Backend

| File                                    | Role                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `services/registrations/handler.js`     | All registration handlers: `post`, `put`, `get`, `del`, `delMany`, `massUpdate`, `leaderboard` |
| `services/registrations/helpers.js`     | `getEventCounts()`, `sendDynamicQR()`, `sendCalendarInvite()`                                  |
| `services/registrations/serverless.yml` | Route definitions                                                                              |
| `services/payments/handler.js`          | Stripe checkout session creation and webhook handling                                          |

### Database

| Table                  | Keys                                 | Role                                                       |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `biztechRegistrations` | PK: `id` (email), SK: `eventID;year` | Stores all registrations                                   |
| `biztechEvents`        | PK: `id`, SK: `year`                 | Event config including `registrationQuestions` and `capac` |
| `biztechUsers`         | PK: `id` (email)                     | User profile data (pre-filled in form)                     |

GSI: `event-query` on `eventID;year` for querying all registrations for a single event.

---

## Registration Process

### 1. Page Load

The registration page fetches:

- Event data from `GET /events/{eventId}/{year}` (includes `registrationQuestions` array)
- Current counts to display remaining spots
- User data from `GET /users/{email}` to pre-fill basic info
- Existing registration from `GET /registrations?email={email}` to prevent duplicates

### 2. Form Rendering

The form has two sections:

**Base fields** (always present): email, firstName, lastName, yearLevel, faculty, major, pronouns, dietaryRestrictions, howDidYouHear

**Dynamic questions** (from `event.registrationQuestions`): Each question has a `questionId`, `type`, `required` flag, and optional `choices` array. The component generates a Zod schema from these questions at render time.

### 3. Submission

| Event Type             | Path                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ |
| Free (`pricing === 0`) | `POST /registrations/` directly → success page                                 |
| Paid                   | `POST /payments` → Stripe checkout → webhook confirms → `POST /registrations/` |

**Payload shape:**

```json
{
  "email": "student@example.com",
  "fname": "Alice",
  "eventID": "blueprint",
  "year": 2026,
  "registrationStatus": "registered",
  "basicInformation": { "fname": "Alice", "lname": "Wong", "year": 3, ... },
  "dynamicResponses": { "workshop-choice": "Product Management", ... }
}
```

### 4. Backend Processing (handler.js → post)

1. **Validate**: Email format, eventID (string), year (number), required fields
2. **Event check**: Query `biztechEvents` — 404 if not found
3. **Duplicate check**: Query `biztechRegistrations` for this email + event
   - If exists with status `incomplete` → update and return checkout link
   - If exists with other status → return 400
4. **Capacity check**: `getEventCounts()` counts registrations by status. If `registeredCount >= event.capac` → change status to `"waitlist"`
5. **Send emails**: QR code email via SendGrid (`sendDynamicQR`), calendar invite via SES (`sendCalendarInvite`). Skipped for: `incomplete`, `rejected`, `accepted`, `checkedIn` statuses, and for partner registrations
6. **Write to DynamoDB**: Create registration in `biztechRegistrations`
7. **Slack notification**: SNS message with registration details

### 5. Capacity Management

`getEventCounts()` in `helpers.js` returns:

```javascript
{
  registeredCount, checkedInCount, waitlistCount, dynamicCounts
}
```

`dynamicCounts` tracks per-question participant caps. For example, if a workshop option has a 30-person limit, the system tracks how many people chose that option.

If the event is full, the handler changes `registrationStatus` from `"registered"` to `"waitlist"` automatically. Admins can manually promote waitlisted users from the event dashboard.

---

## All Registration Endpoints

| Method | Path                             | Auth | Handler       | Description                          |
| ------ | -------------------------------- | ---- | ------------- | ------------------------------------ |
| POST   | `/registrations/`                | 🌐   | `post`        | Create registration                  |
| GET    | `/registrations/`                | 🌐   | `get`         | Query by email, eventID+year, or all |
| PUT    | `/registrations/{email}/{fname}` | 🌐   | `put`         | Update registration (status, points) |
| DELETE | `/registrations/{email}`         | 🔓   | `del`         | Delete single registration           |
| DELETE | `/registrations`                 | 🔑   | `delMany`     | Batch delete (admin only)            |
| PUT    | `/registrations/massUpdate`      | 🌐   | `massUpdate`  | Mass update registrations            |
| GET    | `/registrations/leaderboard/`    | 🌐   | `leaderboard` | Leaderboard sorted by points         |

---

## Registration Status Values

Every registration has a `registrationStatus` and optionally an `applicationStatus`:

| `registrationStatus` | Meaning                                                    |
| -------------------- | ---------------------------------------------------------- |
| `"registered"`       | Confirmed and attending                                    |
| `"waitlist"`         | Event was full at registration time                        |
| `"incomplete"`       | Started registration, payment pending (paid events)        |
| `"checkedIn"`        | Checked in at the event                                    |
| `"cancelled"`        | Cancelled by user or admin                                 |
| `"accepted"`         | Application accepted, needs payment (paid app events)      |
| `"acceptedPending"`  | Application accepted, needs confirmation (free app events) |
| `"acceptedComplete"` | Application accepted + confirmed/paid                      |

| `applicationStatus` | Meaning                             |
| ------------------- | ----------------------------------- |
| `"reviewing"`       | Application submitted, under review |
| `"accepted"`        | Application accepted                |
| `"rejected"`        | Application rejected                |
| `"waitlist"`        | Application waitlisted              |

---

## End-to-End Trace: Free Event Registration

What happens when a user clicks "Register" on a free event, from button click to database write and email sent:

### 1. Frontend submit

- User clicks Register → `handleSubmit()` in `register/index.tsx` (line ~260)
- Builds payload with `basicInformation` + `dynamicResponses`
- Calls `state.regForFree(payload)` on `RegistrationStateOld`
- `regForFree()` sets `registrationStatus: "registered"`, `applicationStatus: ""`
- POSTs to `/registrations` via `fetchBackend`

### 2. Backend handler (post in handler.js)

- Parses body, normalizes email to lowercase
- Validates required fields: `email`, `eventID`, `year`, `registrationStatus`
- Fetches event from `biztechEvents` table — 404 if not found
- Checks for existing registration in `biztechRegistrations`
  - If duplicate with `"incomplete"` status → returns existing `checkoutLink`
  - If duplicate with other status → returns 400

### 3. Capacity check

- Calls `getEventCounts(eventID, year)` in `helpers.js`
- Queries all registrations for this event via the `event-query` GSI
- Counts by status: `registeredCount`, `checkedInCount`, `waitlistCount`
- If `registeredCount >= event.capac` → **overrides status to `"waitlist"`**

### 4. Emails sent

- **QR code email** via `SESEmailService.sendDynamicQR()` — generates a QR image from `"email;eventID;year;fname"`, embeds it inline in an HTML email. Sent via AWS SES (nodemailer), from `dev@ubcbiztech.com`
- **Calendar invite email** via `SESEmailService.sendCalendarInvite()` — generates an `.ics` file with event title, location, start/end time. Attached to email via SES
- If waitlisted: QR email still sent (with "waitlist" status text), but **no calendar invite**

### 5. Database write

- `createRegistration()` calls DynamoDB `UpdateItem` on `biztechRegistrations`
- Key: `{ id: email, "eventID;year": "eventID;year" }`
- Uses `ConditionExpression: "attribute_not_exists(id)"` to prevent overwrites
- Sets `createdAt` timestamp for new records
- Returns 201

### 6. Slack notification

- Publishes to SNS topic (`process.env.SNS_TOPIC_ARN`)
- Payload: `{ type: "registration_update", email, eventID, year, registrationStatus, timestamp }`
- The bots service subscribes to SNS and posts to the Slack channel
- SNS failure is caught and logged — does **not** fail the registration

### 7. Frontend redirect

- On success, `router.push(/event/{id}/{year}/register/success)`

---

## End-to-End Trace: Paid Event Registration

### 1. Frontend submit

- Calls `state.regForPaid(payload)` → sets `registrationStatus: "incomplete"`
- POSTs to `/registrations` to create an incomplete record
- Then POSTs to `/payments` with `paymentType: "Event"`, `success_url`, `email`, `eventID`, `year`
- Backend creates a Stripe Checkout session and returns `session.url`
- Frontend redirects to Stripe via `window.open(url, "_self")`

### 2. No emails at registration time

- `sendEmail()` skips `"incomplete"` status entirely — no QR, no calendar invite

### 3. After Stripe payment

- Stripe sends `checkout.session.completed` webhook to `POST /payments/webhook`
- Webhook verifies signature, reads `metadata.paymentType === "Event"`
- Calls `eventRegistration()` → queries the existing incomplete registration → updates status to `"registered"`
- The update triggers `sendEmail()` again with `"registered"` status → QR + calendar emails sent

### 4. Re-registration shortcut

If a user tries to register again while they have an `"incomplete"` registration, the backend returns the existing `checkoutLink` (saved Stripe session URL) instead of creating a new one.

---

## Application-Based Events

Application events have an additional review step between registration and confirmation.

### Free application event

1. Frontend calls `regForFreeApp()` → sets `registrationStatus: "registered"`, `applicationStatus: "reviewing"`
2. Backend sends an application confirmation email (not a QR code)
3. Admin reviews and accepts → status becomes `"acceptedPending"`
4. User confirms attendance via `confirmAttendance()` → status becomes `"acceptedComplete"`

### Paid application event

1. Frontend calls `regForPaidApp()` → sets `registrationStatus: "incomplete"`, `applicationStatus: "reviewing"`
2. After Stripe payment → `registrationStatus` becomes `"registered"`
3. Admin reviews and accepts → `registrationStatus` becomes `"accepted"`
4. User pays remaining or confirms → `registrationStatus` becomes `"acceptedComplete"`

---

## Post-Registration: Check-In

At the event, admins check attendees in via QR scanner or the event dashboard. Check-in calls `PUT /registrations/{email}/{fname}` with `registrationStatus: "checkedIn"`. After check-in, the NFC popup appears automatically for card writing.

---

## Key Files

| File                                                                | What It Does                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `bt-web-v2/src/pages/event/[eventId]/[year]/register/index.tsx`     | Registration page                                               |
| `bt-web-v2/src/components/Events/AttendeeEventRegistrationForm.tsx` | Registration form component — dynamic questions, Zod validation |
| `bt-web-v2/src/lib/registrationStrategy/`                           | Free vs paid registration strategy                              |
| `serverless-biztechapp-1/services/registrations/handler.js`         | Backend registration handlers                                   |
| `serverless-biztechapp-1/services/registrations/helpers.js`         | `getEventCounts()`, `sendDynamicQR()`, `sendCalendarInvite()`   |
| `serverless-biztechapp-1/services/payments/handler.js`              | Stripe checkout session creation and webhook handling           |

---

## Related Pages

- [Event Lifecycle](/docs/flows/event-lifecycle) — registration in the context of the full event lifecycle
- [Payment Flow](/docs/systems/payment-flow) — Stripe checkout session creation, webhook handling, and paid registration
- [Endpoint Registry](/docs/systems/endpoint-registry) — all registration endpoints
- [Database Guide](/docs/database) — `biztechRegistrations` table details
