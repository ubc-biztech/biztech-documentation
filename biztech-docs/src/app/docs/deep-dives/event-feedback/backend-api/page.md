---
title: 'Event Feedback: Backend API & Data Model'
nextjs:
  metadata:
    title: 'Event Feedback Backend API'
    description: 'Event feedback endpoints, the feedbackHelpers.js normalization and validation pipeline, submission storage, and DynamoDB schema.'
---

The backend contract for event feedback: endpoints, the complete validation pipeline in `feedbackHelpers.js`, submission storage, and the DynamoDB schema. {% .lead %}

---

## Endpoints

| Method | Path                                                  | Auth    | Handler                  | Description                 |
| ------ | ----------------------------------------------------- | ------- | ------------------------ | --------------------------- |
| `GET`  | `/events/{id}/{year}/feedback/{formType}`             | Public  | `getFeedbackForm`        | Get form config             |
| `POST` | `/events/{id}/{year}/feedback/{formType}`             | Public  | `submitFeedback`         | Submit a response           |
| `GET`  | `/events/{id}/{year}/feedback/{formType}/submissions` | Cognito | `getFeedbackSubmissions` | Admin: list all submissions |

Related admin write path (saves feedback config on the event):

- `PATCH /events/{id}/{year}` — updates `attendeeFeedbackQuestions`, `partnerFeedbackQuestions`, enabled flags

All handlers are in `services/events/handler.js`.

---

## formType

Accepted values: `"attendee"` or `"partner"`. Any other value returns 400.

Internally, `parseFormType()` from `feedbackHelpers.js` maps this to the correct event fields:

| `formType` | Enabled field             | Questions field             |
| ---------- | ------------------------- | --------------------------- |
| `attendee` | `attendeeFeedbackEnabled` | `attendeeFeedbackQuestions` |
| `partner`  | `partnerFeedbackEnabled`  | `partnerFeedbackQuestions`  |

---

## Question Types

Defined as `FEEDBACK_QUESTION_TYPES` in `feedbackHelpers.js`:

| Type              | Description                   | Validation rules                                |
| ----------------- | ----------------------------- | ----------------------------------------------- |
| `SHORT_TEXT`      | Single-line text              | Max 280 characters                              |
| `LONG_TEXT`       | Multi-line text               | Max 4000 characters                             |
| `MULTIPLE_CHOICE` | Single selection from choices | Value must be in the question's `choices` array |
| `CHECKBOXES`      | Multiple selections           | Each value must be in `choices`                 |
| `LINEAR_SCALE`    | Numeric rating                | Integer, within `scaleMin`–`scaleMax`           |

---

## feedbackHelpers.js — Normalization Pipeline

**File:** `services/events/feedbackHelpers.js` (~350 lines)

When an admin creates or updates feedback questions (via `POST /events/` or `PATCH /events/{id}/{year}`), the handler runs each question array through this pipeline:

### normalizeFeedbackQuestions(questions, prefix)

For each question:

1. **Type validation** — must be in `FEEDBACK_QUESTION_TYPES` set, returns 406 otherwise
2. **Label validation** — must exist and be ≤500 characters
3. **UUID assignment** — if no `questionId`, assigns `uuid.v4()`. Deduplicates IDs (returns 406 on duplicate)
4. **Selectable type validation** (MULTIPLE_CHOICE, CHECKBOXES):
   - Must have a `choices` array with ≥2 items
   - Each choice is trimmed, empty choices are filtered out
   - Duplicate choices are rejected
5. **Scale validation** (LINEAR_SCALE):
   - `scaleMin` and `scaleMax` must be integers
   - `scaleMin < scaleMax`
   - Both must be 0–20 range
   - `scaleMinLabel` and `scaleMaxLabel` are trimmed, max 120 characters each
6. **Max count** — enforces ≤50 questions per form

### ensureDefaultOverallRatingQuestion(questions)

Called on both create and update. Strips any existing question with `questionId === "overall-rating"` and prepends:

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

This question is locked — admins cannot remove or modify it.

---

## feedbackHelpers.js — Validation Pipeline

When a user submits feedback via `POST /events/{id}/{year}/feedback/{formType}`:

### validateFeedbackPayload(questions, payload)

1. **Respondent validation:**

   - `respondentName` — optional, ≤120 characters
   - `respondentEmail` — optional, must match email regex

2. **`validateResponseObjectShape(responses)`** — responses must be a plain object

3. **`validateNoUnknownQuestionIds(questions, responses)`** — every key in `responses` must match a `questionId` in the question config. Unknown keys return 400.

4. **Per-question validation** — for each question in the config:
   - If `required: true` and the response is missing/empty → 400
   - Type-specific validation:

| Type              | Validator                        | Rules                                             |
| ----------------- | -------------------------------- | ------------------------------------------------- |
| `SHORT_TEXT`      | `validateTextResponse`           | Must be string, ≤280 chars                        |
| `LONG_TEXT`       | `validateTextResponse`           | Must be string, ≤4000 chars                       |
| `MULTIPLE_CHOICE` | `validateMultipleChoiceResponse` | Must be string, must be in `choices`              |
| `CHECKBOXES`      | `validateCheckboxResponse`       | Must be array, each value in `choices`            |
| `LINEAR_SCALE`    | `validateScaleResponse`          | Must be number, integer, within scaleMin–scaleMax |

---

## Submit Payload

```json
{
  "respondentName": "Jane Doe",
  "respondentEmail": "jane@example.com",
  "responses": {
    "overall-rating": 9,
    "q-networking": "Great networking opportunities",
    "q-format": ["Panels", "Workshops"]
  }
}
```

Response on success:

```json
{
  "message": "Feedback submitted successfully.",
  "id": "<submission-uuid>"
}
```

---

## getFeedbackForm Response

Returns a subset of the event record tailored for the public form:

```json
{
  "id": "blueprint",
  "year": 2026,
  "ename": "Blueprint 2026",
  "description": "Product and design conference",
  "imageUrl": "https://...",
  "endDate": "2026-01-25T18:00:00.000Z",
  "isCompleted": true,
  "formType": "attendee",
  "enabled": true,
  "questions": [
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
  ]
}
```

---

## Submission Storage — biztechEventFeedback

| Field             | Type          | Description                                    |
| ----------------- | ------------- | ---------------------------------------------- |
| `id`              | String (UUID) | Submission UUID — partition key                |
| `eventID`         | String        | Event ID                                       |
| `year`            | Number        | Event year                                     |
| `formType`        | String        | `"attendee"` or `"partner"`                    |
| `eventFormKey`    | String        | `"{id};{year};{formType}"` — GSI partition key |
| `eventIDYear`     | String        | `"{id};{year}"`                                |
| `submittedAt`     | String (ISO)  | Submission timestamp — GSI sort key            |
| `responses`       | Object        | Answer map keyed by `questionId`               |
| `respondentName`  | String        | Optional respondent name                       |
| `respondentEmail` | String        | Optional respondent email                      |

### GSIs

| GSI                | Partition Key  | Sort Key      | Used by                                                                |
| ------------------ | -------------- | ------------- | ---------------------------------------------------------------------- |
| `event-form-query` | `eventFormKey` | `submittedAt` | `getFeedbackSubmissions` — lists submissions for one event + form type |
| `event-year-query` | `eventIDYear`  | `submittedAt` | Query all submissions for an event regardless of form type             |

Table billing: `PAY_PER_REQUEST` (on-demand).

---

## Error Responses

| Condition                      | Status | Message pattern                         |
| ------------------------------ | ------ | --------------------------------------- |
| Invalid formType               | 400    | "Invalid form type"                     |
| Feedback disabled              | 403    | "attendee feedback is not enabled"      |
| No questions configured        | 400    | "No questions found"                    |
| Unknown questionId in response | 400    | "Unknown question IDs"                  |
| Required question missing      | 400    | "is required but was not answered"      |
| Text exceeds limit             | 400    | "exceeds {limit} characters"            |
| Choice not in options          | 400    | "is not a valid choice"                 |
| Scale out of bounds            | 400    | "must be between {min} and {max}"       |
| Scale not integer              | 400    | "must be a whole number"                |
| respondentName > 120           | 400    | "respondentName exceeds 120 characters" |
| Invalid email format           | 400    | "respondentEmail is not valid"          |

---

## Key Files

| File                                                                                         | Purpose                                                         |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `services/events/handler.js` → `getFeedbackForm`, `submitFeedback`, `getFeedbackSubmissions` | Endpoint handlers                                               |
| `services/events/feedbackHelpers.js`                                                         | Normalization (questions) + validation (responses) — ~350 lines |
| `services/events/serverless.yml`                                                             | Route definitions, IAM, biztechEventFeedback table              |

{% callout type="warning" title="Legacy feedback field" %}
The event model still includes a legacy `feedback` URL field from the old external-form flow (e.g., Google Forms). The new built-in system runs off `attendeeFeedbackQuestions` / `partnerFeedbackQuestions` and the `biztechEventFeedback` table.
{% /callout %}

---

## Related Pages

- [Event Feedback Overview](/docs/deep-dives/event-feedback) — top-level feedback architecture
- [Admin Builder](/docs/deep-dives/event-feedback/admin-builder) — how admins configure feedback questions
- [Public Forms](/docs/deep-dives/event-feedback/public-forms) — the attendee-facing form experience
- [Events Service](/docs/services/events) — all 10 event endpoints
- [Event Data Model](/docs/events/data-model) — feedback fields on the event record
