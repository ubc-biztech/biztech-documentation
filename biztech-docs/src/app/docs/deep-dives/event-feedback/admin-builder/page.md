---
title: 'Event Feedback: Admin Form Builder'
nextjs:
  metadata:
    title: 'Event Feedback Admin Builder'
    description: 'How admins create and manage attendee and partner feedback forms — the builder interface, question types, save behavior, QR sharing, and response review.'
---

How admins build feedback forms and review submissions from the event dashboard. {% .lead %}

---

## Where to Find It

**Page:** `src/pages/admin/event/[eventId]/[year]/index.tsx`
**Tab Component:** `src/components/EventsDashboard/FeedbackTab.tsx`
**Question Builder:** `src/components/Events/FeedbackQuestionsBuilder.tsx`

Path: `/admin/event/{eventId}/{year}` → **Feedback** tab (next to Data Table, Teams, and Analytics).

---

## Builder Mode

### 1. Enable Forms

Admins independently toggle:

- **Attendee form** (`attendeeFeedbackEnabled`)
- **Partner form** (`partnerFeedbackEnabled`)

At least one must be enabled for feedback collection.

### 2. Define Questions

`FeedbackQuestionsBuilder.tsx` provides the question editor interface. Supported types:

| Type              | Description                     | Constraints                 |
| ----------------- | ------------------------------- | --------------------------- |
| `SHORT_TEXT`      | Single-line text answer         | Max 280 characters          |
| `LONG_TEXT`       | Multi-line freeform answer      | Max 4000 characters         |
| `MULTIPLE_CHOICE` | Single selection from options   | Requires ≥2 choices         |
| `CHECKBOXES`      | Multiple selection from options | Requires ≥2 choices         |
| `LINEAR_SCALE`    | Integer rating with labels      | Min/max 0-20, integers only |

For each question, admins set:

- Question label (max 500 characters)
- Required flag
- Type-specific config (choices for selectable types, scale bounds and labels for linear scale)

### 3. Default Locked Question

Every feedback form starts with a locked question that cannot be removed or modified:

- **questionId:** `overall-rating`
- **Type:** `LINEAR_SCALE`
- **Label:** "How would you rate this event overall?"
- **Required:** `true`
- **Range:** 1 to 10 ("Poor" → "Excellent")

This is enforced by `ensureDefaultOverallRatingQuestion()` in `feedbackHelpers.js`. The builder UI shows it as non-editable.

### 4. Save Behavior

Clicking **Save Feedback Forms** sends `PATCH /events/{id}/{year}` with:

- `attendeeFeedbackEnabled` / `partnerFeedbackEnabled` flags
- `attendeeFeedbackQuestions` / `partnerFeedbackQuestions` arrays

Backend validation runs before the save is accepted:

- `normalizeFeedbackQuestions()` validates types, labels, choices, scale bounds
- Assigns UUIDs to new questions
- Rejects duplicate questionIds
- Max 50 questions per form
- If enabled but no custom questions → returns 406

---

## QR and Share Links

The Feedback tab auto-generates QR codes and links for distribution:

| Form     | Public URL                             |
| -------- | -------------------------------------- |
| Attendee | `/event/{id}/{year}/feedback/attendee` |
| Partner  | `/event/{id}/{year}/feedback/partner`  |

Each card includes:

- QR code image
- Direct public URL
- Copy-link button
- Open-in-new-tab button

These URLs are public — attendees can submit feedback without logging in.

---

## Responses Mode

The Feedback tab also shows submitted responses via `GET /events/{id}/{year}/feedback/{formType}/submissions`.

Features:

- **Role toggle** — switch between attendee and partner submissions
- **Quick stats** — submission count, identified responses, average overall rating, latest response time
- **Sort modes** — newest, oldest, top rated, lowest rated
- **Full-text search** — across respondent name, email, and answer text
- **Expandable cards** — click to expand individual responses
- **JSON export** — export the current tab's responses

{% callout title="Auth behavior" %}
Public submissions are unauthenticated (anyone can submit), but viewing response lists requires Cognito auth (`GET .../submissions` is admin-only).
{% /callout %}

---

## Key Files

| File                                                    | Purpose                                               |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `src/components/EventsDashboard/FeedbackTab.tsx`        | Tab component — builder + responses                   |
| `src/components/Events/FeedbackQuestionsBuilder.tsx`    | Question editor interface                             |
| `services/events/handler.js` → `update`                 | Saves feedback config via PATCH                       |
| `services/events/handler.js` → `getFeedbackSubmissions` | Returns submissions                                   |
| `services/events/feedbackHelpers.js`                    | Question normalization and default question injection |

---

## Related Pages

- [Event Feedback Overview](/docs/deep-dives/event-feedback) — end-to-end feedback architecture
- [Public Forms](/docs/deep-dives/event-feedback/public-forms) — the attendee-facing feedback form
- [Backend API](/docs/deep-dives/event-feedback/backend-api) — endpoints and validation pipeline
- [Admin Event Management](/docs/systems/admin-events) — the full admin dashboard
