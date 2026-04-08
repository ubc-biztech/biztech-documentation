---
title: Admin Event Management
nextjs:
  metadata:
    title: Admin Event Management
    description: How admins create, configure, and manage events — the event form, dashboard tabs, registration management, image upload, feedback configuration, and all frontend components.
---

How admins create and manage events through the admin dashboard. Covers the event form, all dashboard tabs, registration management, image upload, and the components that implement each feature. {% .lead %}

---

## Admin Event Pages

| URL                             | Page File                                          | Purpose                                                                        |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `/admin/home`                   | `src/pages/admin/home.tsx`                         | Event listing (grid/list toggle, pagination, all events including unpublished) |
| `/admin/event/new`              | `src/pages/admin/event/new.tsx`                    | Create a new event                                                             |
| `/admin/event/{id}/{year}/edit` | `src/pages/admin/event/[eventId]/[year]/edit.tsx`  | Edit an existing event                                                         |
| `/admin/event/{id}/{year}`      | `src/pages/admin/event/[eventId]/[year]/index.tsx` | Event dashboard (registrations, analytics, feedback)                           |

---

## Event Creation

**Page:** `src/pages/admin/event/new.tsx`
**Component:** `src/components/Events/EventForm.tsx`
**Schema:** `src/components/Events/EventFormSchema.ts`
**Backend:** `POST /events/` (Cognito auth)

The form is organized into sections:

### Settings

- `isApplicationBased` — enables accept/reject flow instead of direct registration
- `nonBizTechAllowed` — whether non-BizTech members can register

### Cover Photo

Uses `EventThumbnailUploader.tsx` — compresses image client-side (2.5MB max), gets presigned URL from `POST /events/event-image-upload-url`, uploads optimized + original versions to S3. See [Event Image Upload](/docs/events/image-upload).

### Event Information

| Frontend Field | Maps To       | Notes                                   |
| -------------- | ------------- | --------------------------------------- |
| Event Name     | `ename`       | Display name                            |
| Event Slug     | `id`          | URL-friendly, becomes the partition key |
| Capacity       | `capac`       | Maximum attendee count                  |
| Description    | `description` | Shown to attendees                      |

### Date & Time

| Frontend Field | Maps To     | Format                |
| -------------- | ----------- | --------------------- |
| Start Date     | `startDate` | ISO 8601 string       |
| End Date       | `endDate`   | ISO 8601 string       |
| Deadline       | `deadline`  | Registration deadline |

### Location

Maps to `elocation`, `longitude`, `latitude`.

### Pricing

| Frontend Field   | Maps To              | Notes                                                                                     |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| Member Price     | `pricing.members`    | In dollars — backend reads as dollars, payment handler multiplies by 100 for Stripe cents |
| Non-Member Price | `pricing.nonMembers` | Same                                                                                      |

### Registration Questions

`CustomQuestions.tsx` (React Hook Form field array) lets admins add dynamic questions. Each question:

- **Type:** `TEXT`, `SELECT`, `CHECKBOX`, `UPLOAD`, `WORKSHOP_SELECTION`, `SKILLS`
- **Label:** question text
- **Required:** boolean
- **Options:** for select/checkbox types

Component hierarchy: `CustomQuestions.tsx` → `CustomQuestionItem.tsx` (individual question editor)

### Partner Fields

Partner description and `partnerRegistrationQuestions` for partner-facing events. Uses the same `CustomQuestions.tsx` component.

### Live Preview

`PreviewForm.tsx` renders a live preview of the registration form as the admin configures it, with hardcoded options for year levels and faculties.

### What Happens on Submit

`new.tsx` transforms frontend field names to backend format (e.g., `eventSlug` → `id`, `capacity` → `capac`, `customQuestions` → `registrationQuestions`) and POSTs to `/events/`. On success, redirects to the edit page.

See [Event Creation Flow](/docs/events/creation-flow) for the full frontend-to-backend trace.

---

## Event Editing

**Page:** `src/pages/admin/event/[eventId]/[year]/edit.tsx`
**Backend:** `PATCH /events/{id}/{year}` (Cognito auth)

The edit page:

1. Fetches the event via `GET /events/{id}/{year}`
2. Transforms backend format back to frontend schema
3. Shows the same `EventForm.tsx`
4. On save, transforms and sends `PATCH` with the changed fields

Publishing happens here — toggling `isPublished` and saving makes the event visible on the public events page.

---

## Admin Event Dashboard

**Page:** `src/pages/admin/event/[eventId]/[year]/index.tsx`
**Container:** `src/components/EventsDashboard/EventDashboard.tsx`

### Dashboard Header

Shows the event name, dates, capacity utilization, and a graphic overview (`EventOverviewGraphic.tsx`). Fetches event data with `GET /events/{id}/{year}?count=true&users=true`.

### Tab Components

All in `src/components/EventsDashboard/`:

| Tab        | Component                       | What It Shows                                                         |
| ---------- | ------------------------------- | --------------------------------------------------------------------- |
| Data Table | `EventDashboard.tsx` (built-in) | All registrations with filtering, sorting, status toggles, CSV export |
| Teams      | `TeamsTab.tsx`                  | Team assignments for team-based activities                            |
| Analytics  | `AnalyticsTab.tsx`              | Registration timeline, capacity utilization, response distributions   |
| Feedback   | `FeedbackTab.tsx`               | Feedback question builder + response viewer                           |

### Supporting Components

| Component         | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `EventCard.tsx`   | Card layout for event listings (`/admin/home`) |
| `FilterTab.tsx`   | Registration data filters                      |
| `GuestBanner.tsx` | Guest user banner                              |
| `SearchBar.tsx`   | Registration search                            |
| `Tabs.tsx`        | Tab navigation                                 |

---

## Data Table Tab

The main registration management interface. Powered by `GET /events/{id}/{year}?users=true`:

1. Scans all registrations for the event via `event-query` GSI
2. Batch-gets user records from `biztechUsers`
3. Merges registration status with user profile data
4. Returns enriched list

### Admin Actions

| Action                | Endpoint                             | Status Change                    |
| --------------------- | ------------------------------------ | -------------------------------- |
| Check in              | `PUT /registrations/{email}/{fname}` | → `checkedIn`                    |
| Promote from waitlist | `PUT /registrations/{email}/{fname}` | `waitlist` → `registered`        |
| Accept application    | `PUT /registrations/{email}/{fname}` | → `accepted` / `acceptedPending` |
| Reject application    | `PUT /registrations/{email}/{fname}` | → `rejected`                     |
| Cancel                | `PUT /registrations/{email}/{fname}` | → `cancelled`                    |
| Delete one            | `DELETE /registrations/{email}`      | Removes record                   |
| Batch delete          | `DELETE /registrations`              | Removes multiple records         |
| Mass update           | `PUT /registrations/massUpdate`      | Bulk status changes              |

Each mass update calls `updateHelper()` per registration — capacity checks and email triggers still apply individually.

---

## Analytics Tab

**Component:** `src/components/EventsDashboard/AnalyticsTab.tsx`

Shows:

- **Registration timeline** — registrations over time
- **Capacity utilization** — percentage of `capac` filled
- **Response distributions** — charts for each registration question
- **Demographics** — faculty and year-level breakdowns

Counts are from `GET /events/{id}/{year}?count=true`, which calls `getEventCounts()` in `services/registrations/helpers.js`.

---

## Feedback Tab

**Component:** `src/components/EventsDashboard/FeedbackTab.tsx`

Two modes:

1. **Builder** — configure feedback questions using `FeedbackQuestionsBuilder.tsx`. Add questions of type `SHORT_TEXT`, `LONG_TEXT`, `MULTIPLE_CHOICE`, `CHECKBOXES`, `LINEAR_SCALE`. Toggle `attendeeFeedbackEnabled` / `partnerFeedbackEnabled`. Saves via `PATCH /events/{id}/{year}`.
2. **Responses** — view submitted feedback via `GET /events/{id}/{year}/feedback/{formType}/submissions`. Shows per-question response lists.

QR code and shareable link for feedback forms are displayed for distribution at or after the event.

See [Event Feedback](/docs/deep-dives/event-feedback) for the full feedback system.

---

## Active Event Detection

`GET /events/getActiveEvent` scans all events and filters by `startDate <= now AND endDate >= now` using ISO 8601 string comparison. Returns the earliest-starting active event or `null`.

{% callout type="warning" title="Unpublished events" %}
`getActiveEvent` does not filter by `isPublished`. An unpublished event with current dates will be returned as active.
{% /callout %}

See [Active Event Detection](/docs/events/active-event) for implementation details.

---

## Event Deletion

`DELETE /events/{id}/{year}` removes the event record from `biztechEvents`. Handler checks the event exists first (returns 404 if not).

{% callout type="warning" title="No cascade delete" %}
Deleting an event does **not** remove associated registrations in `biztechRegistrations`, feedback submissions in `biztechEventFeedback`, or S3 images. These become orphaned records.
{% /callout %}

---

## Key Files

| File                                                      | Purpose                            |
| --------------------------------------------------------- | ---------------------------------- |
| `src/pages/admin/event/new.tsx`                           | Event creation page                |
| `src/pages/admin/event/[eventId]/[year]/edit.tsx`         | Event edit page                    |
| `src/pages/admin/event/[eventId]/[year]/index.tsx`        | Event dashboard page               |
| `src/pages/admin/home.tsx`                                | Admin event listing                |
| `src/components/Events/EventForm.tsx`                     | Shared event form                  |
| `src/components/Events/EventFormSchema.ts`                | Zod validation schema              |
| `src/components/Events/EventThumbnailUploader.tsx`        | Image upload                       |
| `src/components/Events/CustomQuestions.tsx`               | Registration question manager      |
| `src/components/Events/CustomQuestionItem.tsx`            | Individual question editor         |
| `src/components/Events/PreviewForm.tsx`                   | Live form preview                  |
| `src/components/Events/FeedbackQuestionsBuilder.tsx`      | Feedback question editor           |
| `src/components/EventsDashboard/EventDashboard.tsx`       | Dashboard container                |
| `src/components/EventsDashboard/AnalyticsTab.tsx`         | Analytics visualizations           |
| `src/components/EventsDashboard/FeedbackTab.tsx`          | Feedback builder + viewer          |
| `src/components/EventsDashboard/TeamsTab.tsx`             | Team management                    |
| `src/components/EventsDashboard/EventCard.tsx`            | Event card component               |
| `src/components/EventsDashboard/EventOverviewGraphic.tsx` | Dashboard header graphic           |
| `src/queries/events.ts`                                   | `useAllEvents()` for admin listing |
| `services/events/handler.js`                              | All backend event handlers         |

---

## Related Pages

- [Events System Overview](/docs/events) — event architecture and system dependencies
- [Event Creation Flow](/docs/events/creation-flow) — full trace from form to DynamoDB
- [Event Data Model](/docs/events/data-model) — complete field reference
- [Event Lifecycle](/docs/flows/event-lifecycle) — creation through analytics
- [Event Feedback](/docs/deep-dives/event-feedback) — feedback system
- [Event Check-In](/docs/flows/check-in) — QR scanning and check-in flow
- [Events Service](/docs/services/events) — backend endpoint reference
