---
title: 'Event Feedback System'
nextjs:
  metadata:
    title: 'Event Feedback System'
    description: 'How BizTech event feedback works end-to-end: admin builder, public forms, API, storage, and QA.'
---

The event feedback system replaces external Google Forms with built-in attendee and partner forms that live inside the BizTech app. {% .lead %}

---

## Why This Exists

- Feedback now stays in one place with event metadata, analytics, and exports.
- Execs can build forms per event without code changes.
- Attendees and partners can submit feedback without signing in.
- Responses are queryable through our API and stored in DynamoDB.

---

## End-to-End Flow

1. An exec opens `Admin Event -> Feedback` for a specific event/year.
2. They enable attendee and/or partner feedback and customize questions.
3. The app saves form config to the event record (`PATCH /events/{id}/{year}`).
4. They share the public links (or generated QR codes) for each form.
5. Users submit answers at `/event/{id}/{year}/feedback/{formType}`.
6. Submissions are validated and stored in `biztechEventFeedback`.
7. Execs review responses in the same Feedback tab and export JSON.

---

## Key Routes

| Route                                       | Access | Purpose                               |
| ------------------------------------------- | ------ | ------------------------------------- |
| `/admin/event/{eventId}/{year}`             | Admin  | Event dashboard with the Feedback tab |
| `/event/{eventId}/{year}/feedback`          | Public | Hub page for attendee vs partner form |
| `/event/{eventId}/{year}/feedback/attendee` | Public | Attendee feedback form                |
| `/event/{eventId}/{year}/feedback/partner`  | Public | Partner feedback form                 |

{% callout title="Default question behavior" %}
Both forms always include the locked default question: **"How would you rate this event overall?"** (`overall-rating`) as a required 1-10 linear scale.
{% /callout %}

---

## Key Files

| File                                                                 | What it does                                      |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `bt-web-v2/src/components/EventsDashboard/FeedbackTab.tsx`           | Admin builder + responses UI + QR generation      |
| `bt-web-v2/src/components/Events/FeedbackQuestionsBuilder.tsx`       | Question editor for all supported question types  |
| `bt-web-v2/src/pages/event/[eventId]/[year]/feedback/index.tsx`      | Public feedback hub                               |
| `bt-web-v2/src/pages/event/[eventId]/[year]/feedback/[formType].tsx` | Public feedback page loader + submit flow         |
| `bt-web-v2/src/components/Events/EventFeedbackForm.tsx`              | Render/validate/submit form inputs                |
| `serverless-biztechapp-1/services/events/handler.js`                 | Form metadata, submission, and response endpoints |
| `serverless-biztechapp-1/services/events/serverless.yml`             | HTTP routes + DynamoDB table/index wiring         |

---

## In This Section

{% quick-links %}

{% quick-link title="Admin Form Builder" icon="installation" href="/docs/deep-dives/event-feedback/admin-builder/" description="How execs configure forms, question types, QR links, and responses." /%}

{% quick-link title="Public Forms" icon="presets" href="/docs/deep-dives/event-feedback/public-forms/" description="What users see, validation behavior, and submission states." /%}

{% quick-link title="Backend API" icon="plugins" href="/docs/deep-dives/event-feedback/backend-api/" description="Endpoints, payloads, auth rules, and DynamoDB storage model." /%}

{% /quick-links %}
