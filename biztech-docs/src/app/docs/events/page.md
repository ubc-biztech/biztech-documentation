---
title: Events System Overview
nextjs:
  metadata:
    title: Events System Overview
    description: How events work in BizTech — what an event is, what data defines it, which systems depend on it, and how it moves through its lifecycle.
---

Events are the central entity in the BizTech platform. Nearly every other system, registrations, payments, check-in, feedback, the companion app, the admin dashboard, and partnerships operates on or connects to an event. {% .lead %}

---

## What Is an Event?

An event is a record in the `biztechEvents` DynamoDB table identified by a composite key: `id` (string slug like `"blueprint"`) + `year` (number like `2026`). It stores everything needed to run an event: name, dates, capacity, pricing, registration questions, feedback questions, and image URL.

Events are created by admins, registered for by users, and managed through the admin dashboard. The same event record powers the public event listing, the registration form, the check-in scanner, the feedback forms, and the companion app.

---

## Systems That Depend on Events

```
                              ┌─────────────────┐
                              │   biztechEvents  │
                              │   (id + year)    │
                              └────────┬─────────┘
                                       │
          ┌────────────────┬───────────┼───────────┬────────────────┐
          │                │           │           │                │
   Registrations      Payments     Feedback    Companion       Admin
   (capacity,         (pricing     (question   (active event   Dashboard
    status,           from event)   config     detection,      (manage
    waitlist)                       on event)   per-event       everything)
                                                config)
```

| System               | How it uses events                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **Registrations**    | Reads `capac` for waitlist logic, `registrationQuestions` for forms, `eventID;year` as sort key |
| **Payments**         | Reads `pricing.members` / `pricing.nonMembers` for Stripe session amounts                       |
| **Feedback**         | Reads `attendeeFeedbackQuestions` / `partnerFeedbackQuestions` arrays and enabled flags         |
| **Companion App**    | Uses `getActiveEvent` to auto-detect current event; per-event config in `companion-events.ts`   |
| **Check-In**         | QR scanner and manual check-in update registration status for a specific event                  |
| **Admin Dashboard**  | Event CRUD, registration management, analytics, feedback review                                 |
| **Partnerships CRM** | Partners register for events; `partnerRegistrationQuestions` define their form                  |

---

## Event Lifecycle at a Glance

1. **Create** — Admin fills out the event form (`/admin/event/new`). Backend writes to `biztechEvents`.
2. **Configure** — Admin uploads a thumbnail image, adds registration questions, configures feedback questions, sets pricing.
3. **Publish** — Admin sets `isPublished: true`. Event appears on the public events page (`/events`).
4. **Registration** — Users register at `/event/{id}/{year}/register`. Paid events go through Stripe. Capacity enforcement automatically waitlists overflow.
5. **Event Day** — `getActiveEvent` returns the live event. Admins check in attendees via QR scanner. Companion app activates.
6. **Post-Event** — Feedback forms go live. Admin reviews submissions. Analytics tab shows breakdowns.

See [Event Lifecycle](/docs/flows/event-lifecycle) for the detailed stage-by-stage walkthrough.

---

## Event Identification

Every event is uniquely identified by `id` + `year`. This two-part key allows the same slug to be reused across years:

| `id`        | `year` | Result         |
| ----------- | ------ | -------------- |
| `blueprint` | `2025` | Blueprint 2025 |
| `blueprint` | `2026` | Blueprint 2026 |
| `kickstart` | `2025` | Kickstart 2025 |

This key is used in:

- **URL paths**: `/event/blueprint/2026/register`
- **Registration sort keys**: `eventID;year` = `"blueprint;2026"` (semicolon-joined)
- **Feedback keys**: `eventFormKey` = `"blueprint;2026;attendee"`
- **API paths**: `GET /events/blueprint/2026`

---

## Where Event Data Lives

| Table                  | Key                           | What it stores                                                                |
| ---------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `biztechEvents`        | `id` + `year`                 | The event record itself — name, dates, capacity, pricing, questions, image    |
| `biztechRegistrations` | `id` (email) + `eventID;year` | One record per user per event — status, responses, points                     |
| `biztechEventFeedback` | `id` (UUID)                   | Feedback submissions linked to events via `eventIDYear` and `eventFormKey`    |
| `biztechUsers`         | `id` (email)                  | User records (joined via registration data for admin dashboard `?users=true`) |

---

## Key Backend Files

| File                                 | What it does                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/events/handler.js`         | All 10 event endpoint handlers (`create`, `get`, `getAll`, `update`, `del`, `getActiveEvent`, `createThumbnailPicUploadUrl`, `getFeedbackForm`, `submitFeedback`, `getFeedbackSubmissions`) |
| `services/events/helpers.js`         | `getEventCounts()` (delegates to registration helpers), `addIdsToRegistrationQuestions()`                                                                                                   |
| `services/events/feedbackHelpers.js` | Feedback question normalization, validation, default question injection                                                                                                                     |
| `services/events/serverless.yml`     | Endpoint routing, IAM permissions, S3 bucket, `biztechEventFeedback` table definition                                                                                                       |
| `services/registrations/handler.js`  | Registration handlers that read event data for capacity and pricing                                                                                                                         |
| `services/payments/handler.js`       | Payment handlers that read event pricing                                                                                                                                                    |

---

## Key Frontend Files

| File                                                          | What it does                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/pages/admin/event/new.tsx`                               | Admin event creation page                                                       |
| `src/pages/admin/event/[eventId]/[year]/edit.tsx`             | Admin event edit page                                                           |
| `src/pages/admin/event/[eventId]/[year]/index.tsx`            | Admin event dashboard (Data Table, QR Scanner, Teams, Analytics, Feedback tabs) |
| `src/pages/events.tsx`                                        | Public events listing page                                                      |
| `src/pages/event/[eventId]/[year]/register/index.tsx`         | Attendee registration page                                                      |
| `src/pages/event/[eventId]/[year]/register/partner/index.tsx` | Partner registration page                                                       |
| `src/pages/event/[eventId]/[year]/feedback/index.tsx`         | Feedback hub (attendee/partner selection)                                       |
| `src/pages/event/[eventId]/[year]/feedback/[formType].tsx`    | Public feedback form                                                            |
| `src/components/Events/EventForm.tsx`                         | Shared event form for create/edit                                               |
| `src/components/Events/EventThumbnailUploader.tsx`            | Image upload with compression                                                   |
| `src/components/Events/AttendeeEventRegistrationForm.tsx`     | Attendee registration form                                                      |
| `src/components/Events/PartnerEventRegistrationForm.tsx`      | Partner registration form                                                       |
| `src/components/Events/EventFeedbackForm.tsx`                 | Public feedback form renderer                                                   |
| `src/components/Events/FeedbackQuestionsBuilder.tsx`          | Admin feedback question editor                                                  |
| `src/components/Events/EventFormSchema.ts`                    | Zod schema for the event form                                                   |
| `src/components/EventsDashboard/EventDashboard.tsx`           | Admin dashboard container                                                       |
| `src/components/EventsDashboard/AnalyticsTab.tsx`             | Analytics visualizations                                                        |
| `src/components/EventsDashboard/FeedbackTab.tsx`              | Feedback builder + response viewer                                              |
| `src/components/EventsDashboard/EventCard.tsx`                | Event card for listing pages                                                    |
| `src/queries/events.ts`                                       | Event fetch hooks (`useEvents()`, `useAllEvents()`)                             |

---

## All Event Endpoints

| Method   | Path                                                  | Auth    | Handler                       | Purpose                                 |
| -------- | ----------------------------------------------------- | ------- | ----------------------------- | --------------------------------------- |
| `POST`   | `/events/`                                            | Cognito | `create`                      | Create event                            |
| `GET`    | `/events/`                                            | Public  | `getAll`                      | List all events                         |
| `GET`    | `/events/{id}/{year}`                                 | Public  | `get`                         | Get event (supports `?count`, `?users`) |
| `PATCH`  | `/events/{id}/{year}`                                 | Cognito | `update`                      | Update event                            |
| `DELETE` | `/events/{id}/{year}`                                 | Cognito | `del`                         | Delete event                            |
| `GET`    | `/events/getActiveEvent`                              | Public  | `getActiveEvent`              | Get currently active event              |
| `POST`   | `/events/event-image-upload-url`                      | Cognito | `createThumbnailPicUploadUrl` | Get S3 presigned upload URL             |
| `GET`    | `/events/{id}/{year}/feedback/{formType}`             | Public  | `getFeedbackForm`             | Get feedback form config                |
| `POST`   | `/events/{id}/{year}/feedback/{formType}`             | Public  | `submitFeedback`              | Submit feedback                         |
| `GET`    | `/events/{id}/{year}/feedback/{formType}/submissions` | Cognito | `getFeedbackSubmissions`      | List feedback submissions               |

---

## In This Section

{% quick-links %}

{% quick-link title="Event Data Model" icon="installation" href="/docs/events/data-model" description="Every field on an event record, with types and examples." /%}

{% quick-link title="Event Creation Flow" icon="presets" href="/docs/events/creation-flow" description="Full trace from admin form to DynamoDB write." /%}

{% quick-link title="Active Event Detection" icon="plugins" href="/docs/events/active-event" description="How the companion app discovers the current event." /%}

{% quick-link title="Event Image Upload" icon="theming" href="/docs/events/image-upload" description="The thumbnail pipeline from browser to S3." /%}

{% /quick-links %}

---

## Related Pages

- [Event Lifecycle](/docs/flows/event-lifecycle) — stage-by-stage walkthrough from creation to analytics
- [Admin Event Management](/docs/systems/admin-events) — admin dashboard and management workflows
- [Events Service](/docs/services/events) — backend endpoint reference
- [Registration System](/docs/systems/registration) — how registrations depend on events
- [Payment Flow](/docs/systems/payment-flow) — how event pricing connects to Stripe
- [Event Feedback](/docs/deep-dives/event-feedback) — the built-in feedback system
- [Companion App](/docs/deep-dives/companion) — per-event companion experience
- [Event Check-In](/docs/flows/check-in) — QR scanning and manual check-in
