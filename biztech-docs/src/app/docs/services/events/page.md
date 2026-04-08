---
title: Events Service
nextjs:
  metadata:
    title: Events Service
    description: Complete reference for the events service — all 10 endpoints, handler implementations, IAM permissions, S3 configuration, and the feedback system.
---

The events service manages event records, image uploads, and the feedback system. All handlers live in `services/events/handler.js` with helpers in `helpers.js` and `feedbackHelpers.js`. {% .lead %}

---

## Endpoints

| Method   | Path                                                  | Auth    | Handler                       | Description                |
| -------- | ----------------------------------------------------- | ------- | ----------------------------- | -------------------------- |
| `POST`   | `/events/`                                            | Cognito | `create`                      | Create event               |
| `GET`    | `/events/`                                            | Public  | `getAll`                      | List all events            |
| `GET`    | `/events/{id}/{year}`                                 | Public  | `get`                         | Get single event           |
| `PATCH`  | `/events/{id}/{year}`                                 | Cognito | `update`                      | Update event               |
| `DELETE` | `/events/{id}/{year}`                                 | Cognito | `del`                         | Delete event               |
| `GET`    | `/events/getActiveEvent`                              | Public  | `getActiveEvent`              | Get currently active event |
| `POST`   | `/events/event-image-upload-url`                      | Cognito | `createThumbnailPicUploadUrl` | Presigned S3 URL           |
| `GET`    | `/events/{id}/{year}/feedback/{formType}`             | Public  | `getFeedbackForm`             | Get feedback form config   |
| `POST`   | `/events/{id}/{year}/feedback/{formType}`             | Public  | `submitFeedback`              | Submit feedback            |
| `GET`    | `/events/{id}/{year}/feedback/{formType}/submissions` | Cognito | `getFeedbackSubmissions`      | List feedback submissions  |

---

## POST /events/ Create

**Handler:** `create`
**Auth:** Cognito

1. Validates required fields: `id`, `year` (number), `capac` (number)
2. If `attendeeFeedbackQuestions` or `partnerFeedbackQuestions` provided, runs each through `normalizeFeedbackQuestions()` from `feedbackHelpers.js` — validates types, labels, scale bounds, assigns UUIDs
3. Runs `ensureDefaultOverallRatingQuestion()` to prepend the locked default question (LINEAR_SCALE 1-10, questionId `"overall-rating"`)
4. Validates enabled/questions consistency — returns 406 if feedback is enabled but no custom questions exist
5. Assigns UUIDs to `registrationQuestions` and `partnerRegistrationQuestions` entries missing a `questionId` via `addIdsToRegistrationQuestions()`
6. Checks for duplicate events — fetches `db.getOne(id, EVENTS_TABLE, { year })` and throws if exists
7. Writes to `biztechEvents` with `ConditionExpression: "attribute_not_exists(id)"` as a secondary safeguard
8. Returns 201

---

## GET /events/ List All

**Handler:** `getAll`
**Auth:** Public

Scans the `event-overview` GSI on `biztechEvents`. Supports optional `?id=` query parameter to filter by event slug. Results are sorted by `startDate` (string sort, ascending).

---

## GET /events/{id}/{year} Get Single

**Handler:** `get`
**Auth:** Public

Three modes controlled by query parameters:

### Default

Returns the bare event record from `biztechEvents`.

### ?count=true

Calls `eventHelpers.getEventCounts(id, year)` which delegates to `registrationHelpers.getEventCounts()`. This queries the `event-query` GSI on `biztechRegistrations` and counts by status (excluding partners):

```json
{
  ...event,
  "registeredCount": 45,
  "checkedInCount": 38,
  "waitlistCount": 5
}
```

Also returns dynamic workshop capacity counts if the event has questions with `participantCap`.

### ?users=true

Performs a **full table scan** on `biztechRegistrations` with a `FilterExpression` matching `eventID;year`, then batch-gets user records from `biztechUsers` (up to 100 per batch). Merges each user's profile data with their `registrationStatus`. Returns the enriched list.

{% callout type="warning" title=\"Performance note\" %}
This is a table scan, not a GSI query. For events with many total registrations across all events, this can be slow.
{% /callout %}

{% callout type="warning" title="Mutual exclusion" %}
Passing both `?count=true&users=true` simultaneously returns 406. The handler explicitly rejects this combination.
{% /callout %}

---

## PATCH /events/{id}/{year} Update

**Handler:** `update`
**Auth:** Cognito

1. Fetches the existing event (404 if not found)
2. If feedback questions are included, validates via `normalizeFeedbackQuestions()`
3. Runs `ensureDefaultOverallRatingQuestion()` to ensure the default question is present
4. Resolves feedback state — merges new questions with existing, respects enabled/disabled state
5. Assigns UUIDs to new `registrationQuestions` entries via `addIdsToRegistrationQuestions()`
6. Builds a dynamic `UpdateExpression` using `db.createUpdateExpression()`
7. Writes with `ConditionExpression: "attribute_exists(id) and attribute_exists(#vyear)"` to verify the event still exists

---

## DELETE /events/{id}/{year} Delete

**Handler:** `del`
**Auth:** Cognito

Verifies the event exists (404 if not), then deletes the record. Does **not** cascade to registrations, feedback submissions, or S3 images.

---

## GET /events/getActiveEvent Active Event

**Handler:** `getActiveEvent`
**Auth:** Public

Scans all events via the `event-overview` GSI with a DynamoDB `FilterExpression`:

```
startDate <= :now AND endDate >= :now
```

Where `:now` is `new Date().toISOString()`. Sorts matches by `startDate` and returns the first (earliest-starting) event. Returns `null` (not 404) if no event is currently active.

This uses ISO 8601 string comparison — works because ISO strings sort lexicographically in chronological order.

---

## POST /events/event-image-upload-url Image Upload

**Handler:** `createThumbnailPicUploadUrl`
**Auth:** Cognito
**CORS:** Restricted to `localhost:3000`, `app.ubcbiztech.com`, `dev.app.ubcbiztech.com`

Required body fields: `fileType`, `fileName`, `prefix`, `eventId`.

1. Validates `fileType` starts with `"image/"`
2. Sanitizes file extension: `fileName.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "")`
3. Builds S3 key: `event-thumbnails/{eventId}/{folder}/{timestamp}.{extension}` — folder is `"original"` or `"optimized"` based on prefix
4. Creates a `PutObjectCommand` with `ContentType` and `CacheControl: "public, max-age=31536000, immutable"`
5. Generates presigned URL with 60-second expiry
6. Returns `{ uploadUrl, key, publicUrl }`

**S3 Bucket:** `biztech-event-images`

---

## Feedback Endpoints

### GET /events/{id}/{year}/feedback/{formType} Get Form Config

**Handler:** `getFeedbackForm`
**Auth:** Public

Returns a subset of the event record:

- `id`, `year`, `ename`, `description`, `partnerDescription`, `imageUrl`, `endDate`, `isCompleted`
- `formType` (from path param)
- `enabled` flag (`attendeeFeedbackEnabled` or `partnerFeedbackEnabled`)
- `feedbackQuestions` array (`attendeeFeedbackQuestions` or `partnerFeedbackQuestions`)

`formType` must be `"attendee"` or `"partner"` — returns 400 otherwise.

### POST /events/{id}/{year}/feedback/{formType} Submit Feedback

**Handler:** `submitFeedback`
**Auth:** Public

1. Validates the feedback form is enabled (returns 403 if disabled)
2. Validates the event has questions for this form type
3. Runs `validateFeedbackPayload()` from `feedbackHelpers.js`:
   - Checks `respondentName` (≤120 chars if provided)
   - Checks `respondentEmail` (valid email if provided)
   - Validates each response matches a valid `questionId`
   - Validates response values by question type:
     - **SHORT_TEXT**: ≤280 characters
     - **LONG_TEXT**: ≤4000 characters
     - **MULTIPLE_CHOICE**: value must be in question's choices
     - **CHECKBOXES**: each value must be in choices
     - **LINEAR_SCALE**: numeric, within `scaleMin`–`scaleMax`
   - Validates required questions have non-empty responses
4. Generates a UUID for the submission
5. Writes to `biztechEventFeedback` with `eventFormKey = "{id};{year};{formType}"` and `eventIDYear = "{id};{year}"`
6. Returns 201

### GET /events/{id}/{year}/feedback/{formType}/submissions List Submissions

**Handler:** `getFeedbackSubmissions`
**Auth:** Cognito

Queries the `event-form-query` GSI on `biztechEventFeedback` with `eventFormKey = "{id};{year};{formType}"`. Results are sorted by `submittedAt` descending (most recent first).

---

## IAM Permissions

From `services/events/serverless.yml`:

| Resource                  | Actions                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| `biztechEvents`           | Full CRUD + `event-overview` GSI query                                         |
| `biztechEventFeedback`    | Scan, Query, GetItem, PutItem + `event-form-query` and `event-year-query` GSIs |
| `biztechRegistrations`    | Query on `event-query` GSI                                                     |
| `biztechUsers`            | BatchGetItem                                                                   |
| `biztech-event-images` S3 | PutObject, GetObject                                                           |

---

## DynamoDB Tables

| Table                  | Key                           | GSIs                                                                                            | Usage                            |
| ---------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------- |
| `biztechEvents`        | `id` (S) + `year` (N)         | `event-overview`                                                                                | Event records                    |
| `biztechEventFeedback` | `id` (S, UUID)                | `event-form-query` (eventFormKey + submittedAt), `event-year-query` (eventIDYear + submittedAt) | Feedback submissions             |
| `biztechRegistrations` | `id` (S) + `eventID;year` (S) | `event-query`                                                                                   | Registration counts, user lookup |
| `biztechUsers`         | `id` (S, email)               | —                                                                                               | User data for `?users=true`      |

The `biztechEventFeedback` table is defined as a CloudFormation resource in `services/events/serverless.yml` with `BillingMode: PAY_PER_REQUEST`.

---

## Helper Modules

### services/events/helpers.js

| Function                                   | Description                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `getEventCounts(eventID, year)`            | Delegates to `registrationHelpers.getEventCounts()`                     |
| `addIdsToRegistrationQuestions(questions)` | Maps `questionId: question.questionId \|\| uuidv4()` onto each question |

### services/events/feedbackHelpers.js

| Function                                        | Description                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `normalizeFeedbackQuestions(questions, prefix)` | Validates types, labels (≤500 chars), choices, scale bounds. Assigns UUIDs. Max 50 questions. |
| `ensureDefaultOverallRatingQuestion(questions)` | Strips any existing `overall-rating` and prepends the locked default LINEAR_SCALE question    |
| `validateFeedbackPayload(questions, payload)`   | Validates responses match question config — type-specific rules for text, choices, scale      |
| `parseFormType(formType)`                       | Returns config mapping for `"attendee"` or `"partner"`                                        |
| `FEEDBACK_QUESTION_TYPES`                       | Set: `SHORT_TEXT`, `LONG_TEXT`, `MULTIPLE_CHOICE`, `CHECKBOXES`, `LINEAR_SCALE`               |

---

## Key Files

| File                                 | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- |
| `services/events/handler.js`         | All 10 endpoint handlers                           |
| `services/events/helpers.js`         | Event count and question ID helpers                |
| `services/events/feedbackHelpers.js` | Feedback normalization and validation (~350 lines) |
| `services/events/serverless.yml`     | Routes, IAM, CORS, table definitions               |
| `services/events/test/`              | Unit tests per handler                             |
| `services/events/test_integration/`  | Integration tests                                  |

---

## Related Pages

- [Events System Overview](/docs/events) — architecture and system dependencies
- [Event Data Model](/docs/events/data-model) — complete field reference
- [Event Creation Flow](/docs/events/creation-flow) — frontend-to-backend trace
- [Active Event Detection](/docs/events/active-event) — `getActiveEvent` implementation
- [Event Image Upload](/docs/events/image-upload) — thumbnail pipeline
- [Event Feedback](/docs/deep-dives/event-feedback) — feedback system deep dive
- [Admin Event Management](/docs/systems/admin-events) — admin dashboard

- [Admin Event Management](/docs/systems/admin-events) — admin workflows for events
- [Event Lifecycle](/docs/flows/event-lifecycle) — full lifecycle flow
- [Event Feedback](/docs/deep-dives/event-feedback) — feedback system details
- [Registration System](/docs/systems/registration) — how registrations work
