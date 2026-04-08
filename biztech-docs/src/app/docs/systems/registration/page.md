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

### 4. Backend Processing (`handler.js` → `post`)

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

## Post-Registration: Check-In

At the event, admins check attendees in via QR scanner or the dashboard. Check-in calls `PUT /registrations/{email}/{fname}` with `registrationStatus: "checkedIn"`.

---

## Related Pages

- [Registration Flow](/docs/flows/registration) — step-by-step narrative walkthrough
- [Event Lifecycle](/docs/flows/event-lifecycle) — registration in the context of the full event lifecycle
- [Endpoint Registry](/docs/systems/endpoint-registry) — all registration endpoints
- [Database Guide](/docs/database) — `biztechRegistrations` table details
