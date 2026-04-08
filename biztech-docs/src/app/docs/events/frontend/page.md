---
title: Event Frontend Implementation
nextjs:
  metadata:
    title: Event Frontend Implementation
    description: Complete map of all event-related frontend files — pages, components, query hooks, Zod schemas, TypeScript types, and constants.
---

A comprehensive map of every frontend file involved in the event system. Use this page to find where event features live in the `bt-web-v2` codebase. {% .lead %}

---

## Page Files

### Public Pages

| URL                                      | File                                                          | Purpose                                     |
| ---------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `/events`                                | `src/pages/events.tsx`                                        | Public event listing using `EventDashboard` |
| `/event/{id}/{year}/register`            | `src/pages/event/[eventId]/[year]/register/index.tsx`         | Attendee registration                       |
| `/event/{id}/{year}/register/success`    | `src/pages/event/[eventId]/[year]/register/success.tsx`       | Registration success page                   |
| `/event/{id}/{year}/register/partner`    | `src/pages/event/[eventId]/[year]/register/partner/index.tsx` | Partner registration                        |
| `/event/{id}/{year}/feedback`            | `src/pages/event/[eventId]/[year]/feedback/index.tsx`         | Feedback hub (attendee/partner selection)   |
| `/event/{id}/{year}/feedback/{formType}` | `src/pages/event/[eventId]/[year]/feedback/[formType].tsx`    | Feedback form                               |

### Admin Pages

| URL                             | File                                               | Purpose                                                       |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `/admin/event/new`              | `src/pages/admin/event/new.tsx`                    | Create new event form                                         |
| `/admin/event/{id}/{year}`      | `src/pages/admin/event/[eventId]/[year]/index.tsx` | Event dashboard (Data Table, Feedback, Teams, Analytics tabs) |
| `/admin/event/{id}/{year}/edit` | `src/pages/admin/event/[eventId]/[year]/edit.tsx`  | Edit existing event                                           |
| `/admin/event/productx/2025`    | `src/pages/admin/event/productx/2025.tsx`          | Custom ProductX 2025 admin page                               |

### Companion Pages

| URL                         | File                                           | Purpose                                             |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `/companion/{event}/{year}` | `src/pages/companion/[event]/[year]/index.tsx` | Companion app entry (schedule, quests, connections) |

---

## Event Management Components

These components handle event CRUD, registration, and feedback forms.

| File                                | Purpose                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `EventForm.tsx`                     | Admin event create/edit form — all sections (settings, cover photo, info, dates, location, pricing, questions) |
| `EventFormSchema.ts`                | Zod validation schema for the event form                                                                       |
| `EventPreview.tsx`                  | Preview of event card before publishing                                                                        |
| `PreviewForm.tsx`                   | Preview of the registration form                                                                               |
| `EventThumbnailUploader.tsx`        | Image upload with client-side compression, dual upload (optimized + original), presigned URL flow              |
| `AttendeeEventRegistrationForm.tsx` | Attendee-facing registration form with dynamic questions                                                       |
| `PartnerEventRegistrationForm.tsx`  | Partner-facing registration form                                                                               |
| `EventFeedbackForm.tsx`             | Public feedback form — renders questions by type, validates, submits                                           |
| `CustomQuestions.tsx`               | Builder for custom registration questions (admin)                                                              |
| `CustomQuestionItem.tsx`            | Individual custom question component within the builder                                                        |
| `FeedbackQuestionsBuilder.tsx`      | Builder for feedback questions — supports all 5 feedback types                                                 |

### FormComponents/ Reusable form primitives

| Component             | Used for                     |
| --------------------- | ---------------------------- |
| `FormInput`           | Text inputs                  |
| `FormTextarea`        | Multi-line text              |
| `FormSelect`          | Dropdown select              |
| `FormCheckbox`        | Checkbox inputs              |
| `FormDatePicker`      | Date/time picker             |
| `FormOptions`         | Option list editing          |
| `MultiSelectCheckbox` | Multi-select checkbox groups |

---

## Event Dashboard Components

These components make up the public event listing and the admin event dashboard.

| File                       | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `EventDashboard.tsx`       | Main public event listing layout           |
| `EventCard.tsx`            | Individual event card in the listing       |
| `EventOverviewGraphic.tsx` | Visual overview/stats graphic for an event |
| `SearchBar.tsx`            | Event search input                         |
| `FilterTab.tsx`            | Filter events by criteria                  |
| `Tabs.tsx`                 | Tab navigation for dashboard views         |
| `GuestBanner.tsx`          | Banner shown to non-authenticated users    |
| `AnalyticsTab.tsx`         | Admin analytics view for an event          |
| `FeedbackTab.tsx`          | Admin feedback builder + responses viewer  |
| `TeamsTab.tsx`             | Admin teams management view                |

---

## Query Hooks

| Hook             | Query Key           | Purpose                                                                               |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `useEvents()`    | `["events"]`        | Published events only (excludes `alumni-night`), sorted newest-first. 60s stale time. |
| `useAllEvents()` | `["events", "all"]` | All events unfiltered — used by admin pages. 60s stale time.                          |

Both call `getEvents()` / `getAll()` which hit `GET /events/`.

Related hooks in `src/queries/registrations.ts`:

| Hook                          | Purpose                                |
| ----------------------------- | -------------------------------------- |
| `useUserRegistrations(email)` | User's registrations across all events |

---

## Event Form Schema

The admin event form validates through `eventFormSchema`:

### Required Fields

| Field                | Type     | Notes                                 |
| -------------------- | -------- | ------------------------------------- |
| `eventName`          | `string` | Min 1 character                       |
| `eventSlug`          | `string` | Used as event `id`                    |
| `description`        | `string` |                                       |
| `capacity`           | `number` | Min 1                                 |
| `startDate`          | `Date`   | Converted to ISO 8601 before API call |
| `endDate`            | `Date`   |                                       |
| `deadline`           | `Date`   | Registration deadline                 |
| `location`           | `string` |                                       |
| `imageUrl`           | `string` | S3 URL from thumbnail uploader        |
| `partnerDescription` | `string` |                                       |

### Optional Fields

| Field                | Type      | Default |
| -------------------- | --------- | ------- |
| `price`              | `number`  | `0`     |
| `nonMemberPrice`     | `number`  | —       |
| `isApplicationBased` | `boolean` | `false` |
| `nonBizTechAllowed`  | `boolean` | `false` |
| `isPublished`        | `boolean` | `false` |
| `isCompleted`        | `boolean` | `false` |

### Custom Questions

```ts
customQuestions: z.array(
  z.object({
    id: z.string(),
    type: z.enum([
      'TEXT',
      'SELECT',
      'CHECKBOX',
      'UPLOAD',
      'WORKSHOP_SELECTION',
      'SKILLS',
    ]),
    question: z.string(),
    required: z.boolean(),
    options: z.array(z.string()),
    charLimit: z.number().optional(),
    questionImageUrl: z.string().optional(),
    participantCap: z.number().optional(),
    isSkillsQuestion: z.boolean().optional(),
  }),
).default([])
```

---

## TypeScript Types

### BiztechEvent

Core event type with 30+ fields:

- Identity: `id`, `year`, `ename`
- Display: `description`, `partnerDescription`, `imageUrl`
- Scheduling: `startDate`, `endDate`, `deadline` (all ISO 8601 strings)
- Config: `capac`, `isPublished`, `isCompleted`, `isApplicationBased`, `nonBizTechAllowed`
- Pricing: `pricing: { members: number, nonMembers: number }`
- Questions: `registrationQuestions`, `partnerRegistrationQuestions`
- Feedback: `attendeeFeedbackQuestions`, `partnerFeedbackQuestions`, `attendeeFeedbackEnabled`, `partnerFeedbackEnabled`
- Runtime: `counts` (populated by `?count=true` query)

### RegistrationQuestion

```ts
{
  label: string;
  questionId: string;
  type: string;        // TEXT | SELECT | CHECKBOX | UPLOAD | WORKSHOP_SELECTION | SKILLS
  required: boolean;
  choices?: string[];
  charLimit?: number;
  questionImageUrl?: string;
  participantCap?: number;
  isSkillsQuestion?: boolean;
}
```

### FeedbackQuestion

```ts
{
  label: string;
  questionId: string;
  type: "SHORT_TEXT" | "LONG_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOXES" | "LINEAR_SCALE";
  required: boolean;
  choices?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}
```

### DBRegistrationStatus

```ts
enum DBRegistrationStatus {
  WAITLISTED,
  REGISTERED,
  CHECKED_IN,
  CANCELLED,
  INCOMPLETE,
  ACCEPTED,
  ACCEPTED_PENDING,
  ACCEPTED_COMPLETE,
}
```

---

## Constants

### src/constants/questionTypes.ts

Registration question types:

```ts
enum QuestionTypes {
  TEXT,
  CHECKBOX,
  SELECT,
  UPLOAD,
  WORKSHOP_SELECTION,
  SKILLS,
}
```

### src/constants/feedbackQuestionTypes.ts

Feedback question types and defaults:

```ts
enum FeedbackQuestionTypes {
  SHORT_TEXT,
  LONG_TEXT,
  MULTIPLE_CHOICE,
  CHECKBOXES,
  LINEAR_SCALE,
}
FEEDBACK_FORM_TYPES = { attendee, partner }
DEFAULT_OVERALL_RATING_QUESTION // Linear scale 1–10
```

### src/constants/registrations.ts

Registration status labels, QR scan stages, table types:

```ts
REGISTRATION_STATUS = {
  REGISTERED,
  CHECKED_IN,
  WAITLISTED,
  CANCELLED,
  INCOMPLETE,
  ACCEPTEDCOMPLETE,
}
QR_SCAN_STAGE = { SCANNING, FAILED, SUCCESS }
SCAN_CYCLE_DELAY = 5000 // ms
ATTENDEE_TABLE_TYPE, PARTNER_TABLE_TYPE, APPLICATION_TABLE_TYPE
```

### src/constants/companion-events.ts

Companion app event definitions (4 events configured):

- **Blueprint 2025** — basic companion
- **ProductX 2025** — basic companion
- **Kickstart 2025** — with team and invest sub-pages
- **Blueprint 2026** — full companion with profile, partner-database, quests, companies, MBTI, discover, connections sub-pages

Each entry specifies `eventID`, `year`, `ChildComponent`, optional `pages` (sub-routes), and `options` (theming, headers, schedule config).

---

## Data Flow Patterns

### Event Listing

```
events.tsx → useEvents() → GET /events/ → EventDashboard → EventCard[]
```

### Event Creation

```
new.tsx → EventForm → eventFormSchema.parse() → POST /events/ → redirect to dashboard
```

### Event Edit

```
edit.tsx → useAllEvents() → EventForm (prefilled) → eventFormSchema.parse() → PATCH /events/{id}/{year}
```

### Registration

```
register/index.tsx → GET /events/{id}/{year} → AttendeeEventRegistrationForm → POST /registrations/
```

### Feedback

```
feedback/[formType].tsx → GET /events/{id}/{year}/feedback/{formType} → EventFeedbackForm → POST .../feedback/{formType}
```

---

## Related Pages

- [Events System Overview](/docs/events) — architecture and system dependencies
- [Event Creation Flow](/docs/events/creation-flow) — frontend-to-backend trace
- [Event Data Model](/docs/events/data-model) — complete field reference
- [Event Image Upload](/docs/events/image-upload) — thumbnail upload pipeline
- [Events and Registrations](/docs/events/registrations) — registration dependency on events
- [Admin Event Management](/docs/systems/admin-events) — admin dashboard
- [Events Service](/docs/services/events) — all backend endpoints
