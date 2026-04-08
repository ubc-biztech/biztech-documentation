---
title: Event Data Model
nextjs:
  metadata:
    title: Event Data Model
    description: Every field on a BizTech event record — types, defaults, examples, and where each field is used.
---

A complete reference for the event data model stored in `biztechEvents`. Every field that defines an event, where it comes from, and what uses it. {% .lead %}

---

## Primary Key

| Attribute | Type   | Example       | Description                                                     |
| --------- | ------ | ------------- | --------------------------------------------------------------- |
| `id`      | String | `"blueprint"` | URL-friendly event slug                                         |
| `year`    | Number | `2026`        | Event year — together with `id` forms the composite primary key |

The same `id` can be reused across years — `blueprint` + `2025` and `blueprint` + `2026` are separate events.

---

## Core Fields

| Field                | Type              | Required | Example                                | Description                                                             |
| -------------------- | ----------------- | -------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `ename`              | String            | No       | `"Blueprint 2026"`                     | Display name shown to users                                             |
| `description`        | String            | No       | `"Product and design conference"`      | Event description                                                       |
| `partnerDescription` | String            | No       | `"Join us as a sponsor..."`            | Description shown to partners                                           |
| `startDate`          | String (ISO 8601) | No       | `"2026-01-25T09:00:00.000Z"`           | Event start — used by `getActiveEvent` filter                           |
| `endDate`            | String (ISO 8601) | No       | `"2026-01-25T18:00:00.000Z"`           | Event end — used by `getActiveEvent` filter                             |
| `deadline`           | String/Number     | No       | —                                      | Registration deadline                                                   |
| `capac`              | Number            | Yes      | `200`                                  | Maximum registration capacity — enforced by `updateHelper()`            |
| `elocation`          | String            | No       | `"UBC Nest Ballroom"`                  | Event location                                                          |
| `longitude`          | Number            | No       | `-123.2460`                            | Longitude for map display                                               |
| `latitude`           | Number            | No       | `49.2606`                              | Latitude for map display                                                |
| `imageUrl`           | String            | No       | `"https://biztech-event-images.s3..."` | Thumbnail URL (uploaded via presigned URL)                              |
| `facebookUrl`        | String            | No       | —                                      | External link to Facebook event                                         |
| `isPublished`        | Boolean           | No       | `true`                                 | Controls visibility on public events page — `false` hides the event     |
| `isCompleted`        | Boolean           | No       | `false`                                | Marks event as completed                                                |
| `isApplicationBased` | Boolean           | No       | `false`                                | Enables application flow (accept/reject) instead of direct registration |
| `nonBizTechAllowed`  | Boolean           | No       | `false`                                | Whether non-BizTech members can register                                |
| `createdAt`          | Number            | Auto     | `1735689600000`                        | Unix timestamp — set on creation                                        |
| `updatedAt`          | Number            | Auto     | `1735689600000`                        | Unix timestamp — updated on every write                                 |

---

## Pricing

| Field     | Type   | Example                               | Description                      |
| --------- | ------ | ------------------------------------- | -------------------------------- |
| `pricing` | Object | `{ "members": 0, "nonMembers": 5 }` | Price in dollars. `0` = free event |

The payments service reads `pricing.members` or `pricing.nonMembers` based on the user's `isMember` status to set the Stripe checkout session amount.

{% callout title="Pricing is in dollars" %}
A value of `5` means $5.00 CAD. The frontend displays values directly with `$${value.toFixed(2)}`. The payments handler multiplies by 100 when building the Stripe `unit_amount` (which requires cents).
{% /callout %}

---

## Registration Questions

| Field                          | Type  | Description                                              |
| ------------------------------ | ----- | -------------------------------------------------------- |
| `registrationQuestions`        | Array | Dynamic questions shown to attendees during registration |
| `partnerRegistrationQuestions` | Array | Dynamic questions shown to partners during registration  |

Each question object:

```json
{
  "questionId": "uuid-abc-123",
  "type": "TEXT",
  "label": "Why do you want to attend?",
  "required": true,
  "options": ["Option A", "Option B"]
}
```

**Question types (frontend):** `TEXT`, `SELECT`, `CHECKBOX`, `UPLOAD`, `WORKSHOP_SELECTION`, `SKILLS`

The `questionId` is auto-assigned by `addIdsToRegistrationQuestions()` in `services/events/helpers.js` if not already present. UUIDs are generated with `uuid.v4()`.

On update (`PATCH`), the handler checks each question — if `questionId` is missing, it assigns a new UUID to that question while preserving existing IDs.

---

## Feedback Questions

| Field                       | Type    | Description                                    |
| --------------------------- | ------- | ---------------------------------------------- |
| `attendeeFeedbackEnabled`   | Boolean | Whether the attendee feedback form is active   |
| `partnerFeedbackEnabled`    | Boolean | Whether the partner feedback form is active    |
| `attendeeFeedbackQuestions` | Array   | Question config for the attendee feedback form |
| `partnerFeedbackQuestions`  | Array   | Question config for the partner feedback form  |

Each feedback question object:

```json
{
  "questionId": "uuid-def-456",
  "type": "LINEAR_SCALE",
  "label": "How would you rate this event overall?",
  "required": true,
  "scaleMin": 1,
  "scaleMax": 10,
  "scaleMinLabel": "Poor",
  "scaleMaxLabel": "Excellent"
}
```

**Feedback question types:** `SHORT_TEXT` (280 char limit), `LONG_TEXT` (4000 char limit), `MULTIPLE_CHOICE`, `CHECKBOXES`, `LINEAR_SCALE`

### Default Overall Rating Question

Both `attendeeFeedbackQuestions` and `partnerFeedbackQuestions` always have this question prepended at index 0:

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

This is injected by `ensureDefaultOverallRatingQuestion()` in `feedbackHelpers.js` on both create and update. It cannot be removed — the function strips any existing question with `questionId === "overall-rating"` and re-prepends the default.

### Validation Rule

Enabling a feedback form (`attendeeFeedbackEnabled: true`) requires at least one question beyond the default. The handler returns 406 if you try to enable feedback with zero custom questions.

---

## Legacy Fields

These fields exist on the event schema but are from older versions of the registration system:

| Field                      | Type   | Description                                            |
| -------------------------- | ------ | ------------------------------------------------------ |
| `requiredTextFields`       | Array  | Old-style required text fields                         |
| `unrequiredTextFields`     | Array  | Old-style optional text fields                         |
| `requiredSelectFields`     | Array  | Old-style required dropdowns                           |
| `unrequiredSelectFields`   | Array  | Old-style optional dropdowns                           |
| `requiredCheckBoxFields`   | Array  | Old-style required checkboxes                          |
| `unrequiredCheckBoxFields` | Array  | Old-style optional checkboxes                          |
| `feedback`                 | String | Legacy external feedback URL (e.g., Google Forms link) |

The new system uses `registrationQuestions` and `attendeeFeedbackQuestions`/`partnerFeedbackQuestions` instead.

---

## GSI: event-overview

The `event-overview` GSI is used by `getAll` to scan all events efficiently. Used by:

- `GET /events/` — lists all events
- `GET /events/getActiveEvent` — finds the currently active event

---

## Full Example Record

```json
{
  "id": "blueprint",
  "year": 2026,
  "ename": "Blueprint 2026",
  "description": "UBC's premier product and design conference",
  "partnerDescription": "Join as a sponsor to connect with 200+ students",
  "startDate": "2026-01-25T09:00:00.000Z",
  "endDate": "2026-01-25T18:00:00.000Z",
  "deadline": "2026-01-20T23:59:59.000Z",
  "capac": 200,
  "elocation": "UBC Nest Ballroom",
  "longitude": -123.246,
  "latitude": 49.2606,
  "imageUrl": "https://biztech-event-images.s3.us-west-2.amazonaws.com/event-thumbnails/blueprint/optimized/1735689600000.jpg",
  "pricing": {
    "members": 0,
    "nonMembers": 5
  },
  "isPublished": true,
  "isCompleted": false,
  "isApplicationBased": false,
  "nonBizTechAllowed": false,
  "registrationQuestions": [
    {
      "questionId": "q-why-attend",
      "type": "TEXT",
      "label": "Why do you want to attend Blueprint?",
      "required": true
    },
    {
      "questionId": "q-workshop",
      "type": "SELECT",
      "label": "Which workshop track?",
      "required": true,
      "options": ["Product Design", "UX Research", "Prototyping"]
    }
  ],
  "partnerRegistrationQuestions": [],
  "attendeeFeedbackEnabled": true,
  "partnerFeedbackEnabled": true,
  "attendeeFeedbackQuestions": [
    {
      "questionId": "overall-rating",
      "type": "LINEAR_SCALE",
      "label": "How would you rate this event overall?",
      "required": true,
      "scaleMin": 1,
      "scaleMax": 10,
      "scaleMinLabel": "Poor",
      "scaleMaxLabel": "Excellent"
    },
    {
      "questionId": "q-enjoyed",
      "type": "SHORT_TEXT",
      "label": "What did you enjoy most?",
      "required": false
    }
  ],
  "partnerFeedbackQuestions": [
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
  ],
  "createdAt": 1735689600000,
  "updatedAt": 1735689600000
}
```

---

## Where Each Field Is Used

| Field                       | Used by                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `id` + `year`               | Every event endpoint, registration sort key (`eventID;year`), feedback keys  |
| `ename`                     | Public events page, registration page, feedback form header, admin dashboard |
| `capac`                     | `updateHelper()` in registrations service — capacity check                   |
| `pricing`                   | Payments service — Stripe session amount                                     |
| `isPublished`               | Frontend `useEvents()` filters published events; admin home shows all        |
| `startDate` / `endDate`     | `getActiveEvent` filter, frontend date display, calendar invite generation   |
| `registrationQuestions`     | Registration form page — generates dynamic form fields                       |
| `attendeeFeedbackQuestions` | `getFeedbackForm` returns these for the public feedback form                 |
| `attendeeFeedbackEnabled`   | `submitFeedback` checks before accepting submissions                         |
| `imageUrl`                  | Event cards, registration page header, feedback form header                  |

---

## Related Pages

- [Events System Overview](/docs/events) — how events fit into the platform
- [Event Creation Flow](/docs/events/creation-flow) — how the form data becomes a record
- [Events Service](/docs/services/events) — endpoint reference
- [Event Feedback Backend](/docs/deep-dives/event-feedback/backend-api) — feedback question validation details
