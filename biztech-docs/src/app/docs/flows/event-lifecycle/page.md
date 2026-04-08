---
title: Event Lifecycle
nextjs:
  metadata:
    title: Event Lifecycle
    description: The complete lifecycle of an event in the BizTech app, from creation through registration, check-in, feedback collection, and post-event analytics.
---

How an event moves through its lifecycle in the BizTech system: creation, registration, check-in, feedback, and post-event analytics. {% .lead %}

---

## Lifecycle Stages

```
Create Event → Publish → Registration Opens → Event Day (Check-in) → Feedback → Analytics
```

---

## 1. Event Creation

Admins create events at `/admin/event/create` (frontend: `src/pages/admin/event/create.tsx`).

**What gets configured:**

| Field                       | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `id`, `year`                | Primary key (e.g. `"blueprint"`, `2026`)           |
| `ename`, `description`      | Display name and description                       |
| `startDate`, `endDate`      | Event timing (used for "active event" detection)   |
| `capac`                     | Maximum registration capacity                      |
| `isPublished`               | Controls visibility on the events page             |
| `registrationQuestions`     | Array of dynamic form questions for attendees      |
| `attendeeFeedbackQuestions` | Post-event feedback form for attendees             |
| `partnerFeedbackQuestions`  | Post-event feedback form for partners/sponsors     |
| `pricing`                   | Price in cents (0 = free)                          |
| `imageUrl`                  | Event thumbnail (uploaded to S3 via presigned URL) |

**Backend:** `POST /events/` — validates feedback question configuration, normalizes the question arrays, and writes to `biztechEvents` table.

**Key files:**

- Frontend: `src/components/Events/CreateEvent.tsx`, `src/components/Events/EventForm.tsx`
- Backend: `services/events/handler.js` → `create`

---

## 2. Registration Period

Once `isPublished` is true, the event appears on the events page. Users can register at `/event/{eventId}/{year}/register`.

See [Registration Flow](/docs/flows/registration) for the detailed step-by-step breakdown covering:

- Dynamic form generation from `registrationQuestions`
- Free vs paid registration paths (Stripe checkout)
- Capacity checking and automatic waitlisting
- QR code and calendar invite email delivery
- Slack notification to organizers

**Capacity management:** When `registeredCount >= event.capac`, new registrations automatically get `registrationStatus: "waitlist"`. Admins can manually promote waitlisted users from the event dashboard.

---

## 3. Event Day: Check-In

At the event, admins check attendees in via:

- **QR scanner** (`src/components/QrScanner/`): Scans the QR code from the registration email
- **Manual check-in**: Click on an attendee row in the event dashboard

Check-in calls `PUT /registrations/{email}/{fname}` with `registrationStatus: "checkedIn"`.

The admin event dashboard (`/admin/event/[eventId]/[year]`) shows real-time registration status in the Data tab:

| Tab        | What It Shows                                                         |
| ---------- | --------------------------------------------------------------------- |
| Data Table | All registrations with filtering, sorting, status updates, CSV export |
| Teams      | Team assignments (for events with team activities)                    |
| Analytics  | Registration timeline, capacity usage, response breakdowns            |

---

## 4. During the Event: Companion App

For events that have a companion configuration (defined in `src/constants/companions.ts`), attendees interact with the companion app at `/companion/{eventId}/{year}`.

The companion provides:

- **Profile page** — attendee's business card with QR/NFC for connections
- **Quests** — gamified tasks (scan QR, visit booths, attend talks) tracked in `biztechQuests`
- **Connections** — NFC-based networking, stored in `bizConnections`, visualized on the Live Wall
- **Partner directory** — browse sponsors and partner companies

See [Companion System](/docs/companion) for the companion architecture.

---

## 5. Post-Event: Feedback

After the event, feedback collection uses the built-in feedback system:

- **Attendee feedback**: `GET /events/{id}/{year}/feedback/attendee` returns the form config
- **Partner feedback**: `GET /events/{id}/{year}/feedback/partner` returns the form config
- **Submission**: `POST /events/{id}/{year}/feedback/{formType}` stores responses in `biztechEventFeedback`
- **Admin review**: `GET /events/{id}/{year}/feedback/{formType}/submissions` returns all submissions

Feedback forms are rendered at `/feedback/{eventId}/{year}/{formType}`. Both the form and submission endpoints are public (no login required) so attendees can submit feedback without logging in to the app.

---

## 6. Post-Event: Analytics

The Analytics tab in the event dashboard (`/admin/event/[eventId]/[year]`) shows:

- Registration over time (timeline chart)
- Capacity utilization
- Response distributions for registration questions
- Faculty and year-level breakdowns

The leaderboard endpoint (`GET /registrations/leaderboard/`) can rank attendees by points earned through quests and interactions.

---

## Event Data Model

An event record in `biztechEvents` looks like:

```json
{
  "id": "blueprint",
  "year": 2026,
  "ename": "Blueprint 2026",
  "description": "Product and design conference",
  "startDate": 1735689600000,
  "endDate": 1735776000000,
  "capac": 200,
  "isPublished": true,
  "pricing": 0,
  "imageUrl": "https://s3.../blueprint-2026.png",
  "registrationQuestions": [...],
  "attendeeFeedbackQuestions": [...],
  "partnerFeedbackQuestions": [...],
  "attendeeFeedbackEnabled": true,
  "partnerFeedbackEnabled": true
}
```

---

## All Event Endpoints

| Method   | Path                                                  | Auth | Description                                                    |
| -------- | ----------------------------------------------------- | ---- | -------------------------------------------------------------- |
| `POST`   | `/events/`                                            | 🔓   | Create event                                                   |
| `GET`    | `/events/`                                            | 🌐   | List all events                                                |
| `GET`    | `/events/{id}/{year}`                                 | 🌐   | Get single event (supports `?count` and `?users` query params) |
| `PATCH`  | `/events/{id}/{year}`                                 | 🔓   | Update event                                                   |
| `DELETE` | `/events/{id}/{year}`                                 | 🔓   | Delete event                                                   |
| `GET`    | `/events/getActiveEvent`                              | 🌐   | Get currently active event                                     |
| `POST`   | `/events/event-image-upload-url`                      | 🔓   | Get presigned S3 upload URL                                    |
| `GET`    | `/events/{id}/{year}/feedback/{formType}`             | 🌐   | Get feedback form config                                       |
| `POST`   | `/events/{id}/{year}/feedback/{formType}`             | 🌐   | Submit feedback                                                |
| `GET`    | `/events/{id}/{year}/feedback/{formType}/submissions` | 🔓   | Get feedback submissions                                       |

---

## Related Pages

- [Registration Flow](/docs/flows/registration) — detailed registration walkthrough
- [Events API](/docs/api-reference/core) — all event endpoint details
- [Database Guide](/docs/database) — `biztechEvents` and `biztechRegistrations` table schemas
