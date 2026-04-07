---
title: 'Event Feedback: Backend API & Data Model'
nextjs:
  metadata:
    title: 'Event Feedback Backend API'
    description: 'Event feedback endpoints, validation rules, auth model, and DynamoDB schema.'
---

This page documents the backend contract for event feedback forms and submissions.

---

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/events/{id}/{year}/feedback/{formType}` | 🌐 | Get public form metadata (`attendee` or `partner`) |
| `POST` | `/events/{id}/{year}/feedback/{formType}` | 🌐 | Submit feedback response |
| `GET` | `/events/{id}/{year}/feedback/{formType}/submissions` | 🔓 | Admin fetch of stored submissions |

Related admin write path (form config save):
- `PATCH /events/{id}/{year}`

---

## `formType`

Accepted values:
- `attendee`
- `partner`

Any other value returns `400`.

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

## Validation Rules

- unknown `questionId` keys are rejected
- required questions must be answered
- text limits: short `280`, long `4000`
- multiple-choice and checkbox values must be in configured options
- linear scale values must be whole numbers within configured bounds
- respondent name max length: `120`
- respondent email must be valid format when provided
- submissions are allowed when the selected form is enabled

---

## Event Record Fields

Feedback config is stored on the event item:

- `attendeeFeedbackEnabled` (boolean)
- `partnerFeedbackEnabled` (boolean)
- `attendeeFeedbackQuestions` (array)
- `partnerFeedbackQuestions` (array)

Both question arrays are normalized and automatically prepended with the default `overall-rating` question.

---

## Submission Storage (`biztechEventFeedback`)

Primary fields per submission:

| Field | Purpose |
| --- | --- |
| `id` | Submission UUID (PK) |
| `eventID` + `year` | Event identity |
| `formType` | `attendee` or `partner` |
| `eventFormKey` | `{eventId};{year};{formType}` for GSI querying |
| `eventIDYear` | `{eventId};{year}` |
| `submittedAt` | Sortable timestamp |
| `responses` | Normalized answer object |
| `respondentName` / `respondentEmail` | Optional contact metadata |

GSIs used:
- `event-form-query` (PK: `eventFormKey`, SK: `submittedAt`)
- `event-year-query` (PK: `eventIDYear`, SK: `submittedAt`)

{% callout type="warning" title="Legacy `feedback` field" %}
The event model still includes a legacy `feedback` URL field from the old external-form flow. The new built-in system runs off the attendee/partner feedback fields above.
{% /callout %}
