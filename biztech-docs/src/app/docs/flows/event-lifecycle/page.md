---
title: Event Lifecycle
nextjs:
  metadata:
    title: Event Lifecycle
    description: The complete lifecycle of an event in the BizTech app, from creation through registration, check-in, companion app, feedback collection, and post-event analytics.
---

How an event moves through its lifecycle in the BizTech system: creation, registration, check-in, companion, feedback, and post-event analytics. Each stage with the key files and endpoints involved. {% .lead %}

---

## Lifecycle Stages

```
Create → Configure → Publish → Registration → Event Day → Feedback → Analytics
                                   │               │
                                   │          ┌─────┴──────┐
                                   │          │  Companion  │
                                   │          │  Check-in   │
                                   │          └────────────┘
                                   │
                              ┌────┴────┐
                              │ Payments │
                              │ Waitlist │
                              └─────────┘
```

---

## 1. Event Creation

Admins create events at `/admin/event/new`.

**Frontend:** `src/pages/admin/event/new.tsx` uses `src/components/Events/EventForm.tsx` with Zod validation from `src/components/Events/EventFormSchema.ts`.

**What gets configured:**

| Field                          | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `id` (slug), `year`            | Composite primary key (e.g. `"blueprint"` + `2026`)          |
| `ename`, `description`         | Display name and description                                 |
| `startDate`, `endDate`         | ISO 8601 timestamps — used for active event detection        |
| `capac`                        | Maximum registration capacity — enforced by `updateHelper()` |
| `pricing`                      | `{ members: 0, nonMembers: 5 }` — price in dollars per group |
| `imageUrl`                     | Event thumbnail uploaded to S3 via presigned URL             |
| `registrationQuestions`        | Dynamic form questions for attendees                         |
| `partnerRegistrationQuestions` | Dynamic form questions for partners                          |
| `attendeeFeedbackQuestions`    | Post-event feedback form config                              |
| `partnerFeedbackQuestions`     | Post-event feedback form config                              |
| `isApplicationBased`           | Enables accept/reject flow instead of direct registration    |
| `nonBizTechAllowed`            | Whether non-members can register                             |

**Backend:** `POST /events/` — validates feedback questions, normalizes question arrays via `feedbackHelpers.js`, assigns UUIDs to registration questions, checks for duplicates, and writes to `biztechEvents`.

**Key files:**

- `src/pages/admin/event/new.tsx` — creation page with schema transform
- `src/components/Events/EventForm.tsx` — shared form with live preview
- `src/components/Events/EventThumbnailUploader.tsx` — image upload
- `src/components/Events/CustomQuestions.tsx` — registration question builder
- `services/events/handler.js` → `create` — backend handler
- `services/events/feedbackHelpers.js` — question normalization/validation

See [Event Creation Flow](/docs/events/creation-flow) for the full trace from form to DynamoDB.

---

## 2. Publishing and Event Listing

Events are created with `isPublished: false` by default. The admin toggles publishing from the edit page.

Once published, the event appears on `/events` (public events listing). The frontend query hook `useEvents()` in `src/queries/events.ts` filters for `isPublished: true` and excludes `alumni-night` events.

Admin users see all events (published and unpublished) on `/admin/home` via `useAllEvents()`.

---

## 3. Registration Period

Users register at `/event/{eventId}/{year}/register`. The registration form includes:

1. **Standard fields** — email, name, year level, faculty, major, pronouns, dietary
2. **Dynamic fields** — generated from the event's `registrationQuestions` array

**Capacity management:** `updateHelper()` in `services/registrations/handler.js` checks `registeredCount >= event.capac`. If full, status is set to `"waitlist"` instead of `"registered"`.

**Paid events:** Create a Stripe Checkout session using `event.pricing.members` or `event.pricing.nonMembers` based on `user.isMember`. Status starts as `"incomplete"` until payment completes.

**Key files:**

- `src/pages/event/[eventId]/[year]/register/index.tsx` — attendee registration page
- `src/components/Events/AttendeeEventRegistrationForm.tsx` — attendee form
- `src/components/Events/PartnerEventRegistrationForm.tsx` — partner form
- `services/registrations/handler.js` → `updateHelper` — capacity check and status logic
- `services/payments/handler.js` → `payment` — Stripe session creation

See [Events and Registrations](/docs/events/registrations) for the full registration-event dependency.

---

## 4. Event Day: Check-In

Admins check attendees in via the admin dashboard at `/admin/event/[eventId]/[year]`:

- **QR scanner tab**: Scans the QR code from the attendee's registration email
- **Manual check-in**: Click status toggle in the Data Table tab

Check-in calls `PUT /registrations/{email}/{fname}` with `registrationStatus: "checkedIn"`.

**Dashboard tabs:**

| Tab        | Component            | What It Shows                                                         |
| ---------- | -------------------- | --------------------------------------------------------------------- |
| Data Table | `EventDashboard.tsx` | All registrations with filtering, sorting, status toggles, CSV export |
| Teams      | `TeamsTab.tsx`       | Team assignments for team-based activities                            |
| Analytics  | `AnalyticsTab.tsx`   | Registration timeline, capacity usage, response breakdowns            |
| Feedback   | `FeedbackTab.tsx`    | Feedback question builder + response viewer                           |

All dashboard components are in `src/components/EventsDashboard/`.

See [Event Check-In](/docs/flows/check-in) for the check-in flow details.

---

## 5. During the Event: Companion App

For events with companion configurations (defined in `src/constants/companion-events.ts`), attendees access `/companion/{eventId}/{year}`.

Current companion-enabled events:

- Blueprint 2025 / 2026
- ProductX 2025
- Kickstart 2025

The companion provides:

- **Profile page** — attendee's business card with QR/NFC
- **Quests** — gamified tasks tracked in `biztechQuests`
- **Connections** — NFC-based networking stored in `bizConnections`
- **Partner directory** — browse sponsors

`getActiveEvent` (`GET /events/getActiveEvent`) returns the live event by comparing `startDate <= now AND endDate >= now` as ISO strings. This powers automatic event detection without manual selection.

See [Active Event Detection](/docs/events/active-event) and [Companion System](/docs/deep-dives/companion).

---

## 6. Post-Event: Feedback

Feedback uses a built-in system with configurable question types (`SHORT_TEXT`, `LONG_TEXT`, `MULTIPLE_CHOICE`, `CHECKBOXES`, `LINEAR_SCALE`).

**Collection:**

- Feedback forms at `/event/{id}/{year}/feedback/attendee` and `.../feedback/partner`
- Both endpoints are public — no login required
- Submissions stored in `biztechEventFeedback` table with `eventFormKey` GSI

**Admin review:**

- FeedbackTab in the admin dashboard shows all submissions
- `GET /events/{id}/{year}/feedback/{formType}/submissions` — Cognito-protected

**Default question:** Every feedback form starts with a locked "How would you rate this event overall?" question (LINEAR_SCALE 1-10), injected by `ensureDefaultOverallRatingQuestion()`.

See [Event Feedback](/docs/deep-dives/event-feedback) for the complete feedback system.

---

## 7. Post-Event: Analytics

The Analytics tab (`src/components/EventsDashboard/AnalyticsTab.tsx`) shows:

- Registration timeline chart
- Capacity utilization percentage
- Response distributions for each registration question
- Faculty and year-level breakdowns

Registration counts are powered by `GET /events/{id}/{year}?count=true`, which calls `getEventCounts()` — counting `registered`, `checkedIn`, and `waitlist` statuses.

---

## Key Data Model Fields

See [Event Data Model](/docs/events/data-model) for the complete field reference. Key fields:

```json
{
  "id": "blueprint",
  "year": 2026,
  "ename": "Blueprint 2026",
  "description": "Product and design conference",
  "startDate": "2026-01-25T09:00:00.000Z",
  "endDate": "2026-01-25T18:00:00.000Z",
  "capac": 200,
  "isPublished": true,
  "pricing": { "members": 0, "nonMembers": 5 },
  "registrationQuestions": [
    {
      "questionId": "q-why",
      "type": "TEXT",
      "label": "Why do you want to attend?",
      "required": true
    }
  ],
  "attendeeFeedbackEnabled": true,
  "attendeeFeedbackQuestions": [
    {
      "questionId": "overall-rating",
      "type": "LINEAR_SCALE",
      "label": "How would you rate this event overall?",
      "required": true,
      "scaleMin": 1,
      "scaleMax": 10
    }
  ]
}
```

---

## All Event Endpoints

| Method   | Path                                                  | Auth    | Handler                       | Description                    |
| -------- | ----------------------------------------------------- | ------- | ----------------------------- | ------------------------------ |
| `POST`   | `/events/`                                            | Cognito | `create`                      | Create event                   |
| `GET`    | `/events/`                                            | Public  | `getAll`                      | List all events                |
| `GET`    | `/events/{id}/{year}`                                 | Public  | `get`                         | Get event (`?count`, `?users`) |
| `PATCH`  | `/events/{id}/{year}`                                 | Cognito | `update`                      | Update event                   |
| `DELETE` | `/events/{id}/{year}`                                 | Cognito | `del`                         | Delete event                   |
| `GET`    | `/events/getActiveEvent`                              | Public  | `getActiveEvent`              | Currently active event         |
| `POST`   | `/events/event-image-upload-url`                      | Cognito | `createThumbnailPicUploadUrl` | S3 presigned upload URL        |
| `GET`    | `/events/{id}/{year}/feedback/{formType}`             | Public  | `getFeedbackForm`             | Feedback form config           |
| `POST`   | `/events/{id}/{year}/feedback/{formType}`             | Public  | `submitFeedback`              | Submit feedback                |
| `GET`    | `/events/{id}/{year}/feedback/{formType}/submissions` | Cognito | `getFeedbackSubmissions`      | List feedback submissions      |

---

## Related Pages

- [Events System Overview](/docs/events) — central event architecture and system dependencies
- [Event Data Model](/docs/events/data-model) — complete field reference
- [Event Creation Flow](/docs/events/creation-flow) — from admin form to DynamoDB
- [Events and Registrations](/docs/events/registrations) — capacity, waitlisting, dynamic questions
- [Event Pricing and Payments](/docs/events/pricing-payments) — Stripe integration
- [Active Event Detection](/docs/events/active-event) — how getActiveEvent works
- [Event Image Upload](/docs/events/image-upload) — thumbnail pipeline
- [Event Feedback](/docs/deep-dives/event-feedback) — feedback system
- [Event Check-In](/docs/flows/check-in) — QR and manual check-in
- [Admin Event Management](/docs/systems/admin-events) — admin dashboard
- [Events Service](/docs/services/events) — backend endpoint reference
