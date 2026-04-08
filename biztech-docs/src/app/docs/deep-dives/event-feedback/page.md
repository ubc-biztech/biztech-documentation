---
title: 'Event Feedback System'
nextjs:
  metadata:
    title: 'Event Feedback System'
    description: 'How BizTech event feedback works end-to-end: admin builder, public forms, validation pipeline, storage, and QR distribution.'
---

The event feedback system replaces external Google Forms with built-in attendee and partner forms that live inside the BizTech app. {% .lead %}

---

## Why This Exists

- Feedback stays in one place with event metadata, analytics, and exports
- Admins can build forms per event without code changes
- Attendees and partners submit feedback without signing in
- Responses are queryable through our API and stored in DynamoDB
- Five question types: SHORT_TEXT, LONG_TEXT, MULTIPLE_CHOICE, CHECKBOXES, LINEAR_SCALE

---

## End-to-End Flow

1. An admin opens `/admin/event/{id}/{year}` → **Feedback tab** (`FeedbackTab.tsx`)
2. They enable attendee and/or partner feedback and customize questions using `FeedbackQuestionsBuilder.tsx`
3. The app saves form config to the event record via `PATCH /events/{id}/{year}`
4. Backend validates questions through `normalizeFeedbackQuestions()` in `feedbackHelpers.js` — checks types, labels, choices, scale bounds, assigns UUIDs
5. `ensureDefaultOverallRatingQuestion()` prepends the locked overall-rating question
6. Admins share the public links or generated QR codes for each form
7. Users submit answers at `/event/{id}/{year}/feedback/{formType}` — rendered by `EventFeedbackForm.tsx`
8. Backend validates each response via `validateFeedbackPayload()` — per-type rules (text length, choice validity, scale bounds)
9. Submissions are stored in `biztechEventFeedback` table
10. Admins review responses, search, sort, and export JSON in the Feedback tab

---

## Key Routes

| Route                                  | Access | Purpose                                  |
| -------------------------------------- | ------ | ---------------------------------------- |
| `/admin/event/{id}/{year}`             | Admin  | Event dashboard with Feedback tab        |
| `/event/{id}/{year}/feedback`          | Public | Hub page — attendee vs partner selection |
| `/event/{id}/{year}/feedback/attendee` | Public | Attendee feedback form                   |
| `/event/{id}/{year}/feedback/partner`  | Public | Partner feedback form                    |

{% callout title="Default question" %}
Both forms always include the locked default question: **"How would you rate this event overall?"** (`overall-rating`) as a required 1–10 linear scale. This is injected by `ensureDefaultOverallRatingQuestion()` and cannot be removed by admins.
{% /callout %}

---

## Key Files

| File                                                                 | Purpose                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `bt-web-v2/src/components/EventsDashboard/FeedbackTab.tsx`           | Admin builder + responses UI + QR generation                           |
| `bt-web-v2/src/components/Events/FeedbackQuestionsBuilder.tsx`       | Question editor for all 5 question types                               |
| `bt-web-v2/src/pages/event/[eventId]/[year]/feedback/index.tsx`      | Public feedback hub                                                    |
| `bt-web-v2/src/pages/event/[eventId]/[year]/feedback/[formType].tsx` | Public form page — loads config and renders form                       |
| `bt-web-v2/src/components/Events/EventFeedbackForm.tsx`              | Renders questions, handles validation, submits                         |
| `serverless-biztechapp-1/services/events/handler.js`                 | `getFeedbackForm`, `submitFeedback`, `getFeedbackSubmissions` handlers |
| `serverless-biztechapp-1/services/events/feedbackHelpers.js`         | Question normalization + response validation (~350 lines)              |
| `serverless-biztechapp-1/services/events/serverless.yml`             | HTTP routes + `biztechEventFeedback` table definition                  |

---

## In This Section

{% quick-links %}

{% quick-link title="Admin Form Builder" icon="installation" href="/docs/deep-dives/event-feedback/admin-builder/" description="How admins configure forms, question types, QR links, and review responses." /%}

{% quick-link title="Public Forms" icon="presets" href="/docs/deep-dives/event-feedback/public-forms/" description="Attendee-facing form: question rendering, validation, and submission states." /%}

{% quick-link title="Backend API" icon="plugins" href="/docs/deep-dives/event-feedback/backend-api/" description="Endpoints, feedbackHelpers.js pipeline, payloads, auth, and DynamoDB schema." /%}

{% /quick-links %}
