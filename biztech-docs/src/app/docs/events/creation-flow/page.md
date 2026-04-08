---
title: Event Creation Flow
nextjs:
  metadata:
    title: Event Creation Flow
    description: Full trace of creating a BizTech event — from the admin form through frontend validation, backend processing, and DynamoDB write.
---

How an event gets created, from the admin filling out the form to the record landing in DynamoDB. {% .lead %}

---

## Overview

```
Admin fills EventForm          Frontend transforms           Backend handler
(/admin/event/new)      →      schema to API format   →     POST /events/
                                                             │
                                                             ├─ validate fields
                                                             ├─ normalize feedback questions
                                                             ├─ assign question UUIDs
                                                             ├─ check for duplicates
                                                             └─ db.create() → biztechEvents
```

---

## Step 1: Admin Form (Frontend)

**Page:** `src/pages/admin/event/new.tsx`
**Component:** `src/components/Events/EventForm.tsx`
**Schema:** `src/components/Events/EventFormSchema.ts`

The admin fills out a form with these sections:

### Settings

| Field                | Type    | Default |
| -------------------- | ------- | ------- |
| `isApplicationBased` | Boolean | `false` |
| `nonBizTechAllowed`  | Boolean | `false` |

### Cover Photo

The admin uploads an image via `EventThumbnailUploader.tsx`. See [Event Image Upload](/docs/events/image-upload) for the full pipeline. The resulting S3 URL is stored as `imageUrl`.

### Event Information

| Field       | Frontend name | Maps to       |
| ----------- | ------------- | ------------- |
| Event Name  | `eventName`   | `ename`       |
| Event Slug  | `eventSlug`   | `id`          |
| Capacity    | `capacity`    | `capac`       |
| Description | `description` | `description` |

The slug becomes the `id` in the API — the permanent URL-friendly identifier.

### Date & Time

| Field                 | Frontend name | Maps to     |
| --------------------- | ------------- | ----------- |
| Start Date            | `startDate`   | `startDate` |
| End Date              | `endDate`     | `endDate`   |
| Registration Deadline | `deadline`    | `deadline`  |

### Location

Maps to `elocation`, `longitude`, `latitude`.

### Pricing

| Field            | Frontend name    | Maps to              |
| ---------------- | ---------------- | -------------------- |
| Member Price     | `price`          | `pricing.members`    |
| Non-Member Price | `nonMemberPrice` | `pricing.nonMembers` |

Both are in dollars on the form and converted to cents for the API.

### Registration Questions

Uses `CustomQuestions.tsx` — a React Hook Form field array. Admins can add, remove, and reorder questions. Each question has:

- Type: `TEXT`, `SELECT`, `CHECKBOX`, `UPLOAD`, `WORKSHOP_SELECTION`, `SKILLS`
- Label (question text)
- Required flag
- Options (for select/checkbox types)

### Partner-Specific Fields

Partner description and `partnerRegistrationQuestions` are configured in a separate section for partner-facing events.

---

## Step 2: Frontend Transformation

When the admin clicks "Create Event", `new.tsx` transforms the frontend schema to the backend API format:

- `eventName` → `ename`
- `eventSlug` → `id`
- `capacity` → `capac`
- `price` → `pricing.members` (dollars)
- `nonMemberPrice` → `pricing.nonMembers` (dollars)
- `customQuestions` → `registrationQuestions`
- `partnerCustomQuestions` → `partnerRegistrationQuestions`

Validation runs before submission:

- Dates are validated (start before end)
- Required fields are checked via Zod schema validation

The transformed payload is POSTed to `/events/`.

---

## Step 3: Backend Handler create

**File:** `services/events/handler.js` → `export const create`

### 3a. Validate feedback questions

If `attendeeFeedbackQuestions` or `partnerFeedbackQuestions` are provided, the handler validates they are arrays. Then runs each array through `normalizeFeedbackQuestions()` from `feedbackHelpers.js`:

- Checks each question has a valid `type` (one of `SHORT_TEXT`, `LONG_TEXT`, `MULTIPLE_CHOICE`, `CHECKBOXES`, `LINEAR_SCALE`)
- Validates labels exist and are ≤500 characters
- Assigns UUIDs to questions missing a `questionId`
- Deduplicates and validates option lists for selectable types
- Validates scale bounds for `LINEAR_SCALE` (integers, min < max, 0-20 range)
- Enforces max 50 questions per form
- Returns 406 on validation failure

### 3b. Inject default overall-rating question

`ensureDefaultOverallRatingQuestion()` prepends the locked default question to both feedback arrays:

```json
{
  "questionId": "overall-rating",
  "type": "LINEAR_SCALE",
  "label": "How would you rate this event overall?",
  "required": true,
  "scaleMin": 1,
  "scaleMax": 10,
  "scaleMinLabel": "Poor",
  "scaleMaxLabel": "Excellent"
}
```

### 3c. Validate enabled/questions consistency

If `attendeeFeedbackEnabled` is true but there are no attendee questions (beyond the default), returns 406. Same for partner.

### 3d. Check required fields

Uses `helpers.checkPayloadProps()` to verify:

- `id` — required
- `year` — required, must be a number
- `capac` — required, must be a number

### 3e. Check for duplicates

Attempts `db.getOne(data.id, EVENTS_TABLE, { year: data.year })`. If a non-empty result is returned, throws a duplicate error. This prevents overwriting an existing event with the same `id` + `year`.

### 3f. Assign registration question UUIDs

Calls `eventHelpers.addIdsToRegistrationQuestions()` on both `registrationQuestions` and `partnerRegistrationQuestions`. Each question without a `questionId` gets a `uuid.v4()`.

### 3g. Write to DynamoDB

Constructs the full event item with all fields and calls `db.create(item, EVENTS_TABLE)`. This uses a `PutItem` with `ConditionExpression: "attribute_not_exists(id)"` as a secondary safeguard against duplicates.

Returns 201 with the created item.

---

## Step 4: Post-Creation

After successful creation, `new.tsx` redirects the admin to the edit page at `/admin/event/{id}/{year}/edit` where they can further refine the event.

The event is **not published by default** — `isPublished` defaults to `false`. The admin must explicitly publish it from the edit page or dashboard to make it visible on the public events page.

---

## Event Edit Flow

**Page:** `src/pages/admin/event/[eventId]/[year]/edit.tsx`

Editing follows a similar pattern:

1. Fetches the existing event data via `GET /events/{id}/{year}`
2. Transforms backend format back to frontend schema
3. Admin makes changes in the same `EventForm.tsx`
4. On save, transforms and sends `PATCH /events/{id}/{year}`

The `update` handler in the backend:

- Fetches the existing event to verify it exists (404 if not)
- Validates any updated feedback questions through `normalizeFeedbackQuestions()`
- Assigns UUIDs to new registration questions
- Resolves feedback enabled/questions state (merges new data with existing)
- Builds a dynamic `UpdateExpression` using `db.createUpdateExpression()`
- Writes with `ConditionExpression: "attribute_exists(id) and attribute_exists(#vyear)"`

---

## Error Cases

| Condition                           | HTTP Status           | Message                                                                              |
| ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| Duplicate event `id` + `year`       | 500 (duplicate check) | "event id and year already exists"                                                   |
| Missing `id`, `year`, or `capac`    | 500                   | "Missing required props"                                                             |
| Invalid feedback question type      | 406                   | "{formType}FeedbackQuestions[{i}] has unsupported type"                              |
| Feedback enabled with no questions  | 406                   | "Enable attendee feedback only after adding at least one attendee feedback question" |
| Feedback question label > 500 chars | 406                   | "{prefix} exceeds 500 characters"                                                    |
| Duplicate question IDs              | 406                   | "contains duplicate questionId"                                                      |

---

## Key Files

| File                                               | Role                                          |
| -------------------------------------------------- | --------------------------------------------- |
| `src/pages/admin/event/new.tsx`                    | Admin creation page — schema transform + POST |
| `src/pages/admin/event/[eventId]/[year]/edit.tsx`  | Admin edit page — fetch + PATCH               |
| `src/components/Events/EventForm.tsx`              | Shared form component with live preview       |
| `src/components/Events/EventFormSchema.ts`         | Zod validation schema                         |
| `src/components/Events/CustomQuestions.tsx`        | Registration question field array manager     |
| `src/components/Events/EventThumbnailUploader.tsx` | Image upload component                        |
| `services/events/handler.js` → `create`, `update`  | Backend handlers                              |
| `services/events/helpers.js`                       | `addIdsToRegistrationQuestions()`             |
| `services/events/feedbackHelpers.js`               | Question normalization and validation         |

---

## Related Pages

- [Event Data Model](/docs/events/data-model) — every field on the event record
- [Event Image Upload](/docs/events/image-upload) — the thumbnail upload pipeline
- [Events System Overview](/docs/events) — how events fit into the platform
- [Admin Event Management](/docs/systems/admin-events) — the full admin dashboard
