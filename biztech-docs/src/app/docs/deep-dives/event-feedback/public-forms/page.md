---
title: 'Event Feedback: Public Forms'
nextjs:
  metadata:
    title: 'Event Feedback Public Forms'
    description: 'Public attendee and partner feedback experience — URLs, components, question rendering, validation, and submission behavior.'
---

The user-facing flow for attendees and partners submitting feedback after an event — no login required. {% .lead %}

---

## Public URLs

| URL                                    | Page File                                                  | Purpose                                          |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `/event/{id}/{year}/feedback`          | `src/pages/event/[eventId]/[year]/feedback/index.tsx`      | Feedback hub — role selection (attendee/partner) |
| `/event/{id}/{year}/feedback/attendee` | `src/pages/event/[eventId]/[year]/feedback/[formType].tsx` | Attendee feedback form                           |
| `/event/{id}/{year}/feedback/partner`  | `src/pages/event/[eventId]/[year]/feedback/[formType].tsx` | Partner feedback form                            |

No login is required to load or submit these forms. Both the form config and submission endpoints are public.

---

## How the Form Loads

1. The `[formType].tsx` page extracts `eventId`, `year`, and `formType` from the URL
2. Calls `GET /events/{id}/{year}/feedback/{formType}` to get the form config
3. Backend returns: event metadata (name, image, description), enabled flag, and questions array
4. If disabled or no questions → shows unavailable state
5. Otherwise renders `EventFeedbackForm.tsx` with the question config

---

## Form Component

**File:** `src/components/Events/EventFeedbackForm.tsx`

### Header Card

Displays the event image, name, and description from the form config response.

### Respondent Fields

Optional name and email fields at the top of the form:

- `respondentName` — text input, no validation beyond 120 char backend limit
- `respondentEmail` — text input, email format validated

### Question Rendering

Each question from the `questions` array is rendered based on its `type`:

| Question Type     | Component Rendering                            | Validation                                |
| ----------------- | ---------------------------------------------- | ----------------------------------------- |
| `SHORT_TEXT`      | Single-line text input with character counter  | Max 280 characters                        |
| `LONG_TEXT`       | Multi-line textarea with character counter     | Max 4000 characters                       |
| `MULTIPLE_CHOICE` | Radio button group                             | Must select one option from `choices`     |
| `CHECKBOXES`      | Checkbox list                                  | Each selected value must be in `choices`  |
| `LINEAR_SCALE`    | Numeric scale selector (min label → max label) | Integer between `scaleMin` and `scaleMax` |

The default overall-rating question (always at index 0) renders as a `LINEAR_SCALE` from 1 to 10 with "Poor" and "Excellent" labels.

### Required Indicators

Questions with `required: true` show a required indicator. Zod schema validation prevents submission if required questions are unanswered.

### Character Counting

Text inputs (`SHORT_TEXT`, `LONG_TEXT`) display a character count showing current length vs maximum (280 or 4000).

---

## Availability Rules

A form is available when all conditions pass:

1. The event exists for the given `id` + `year`
2. The corresponding enabled flag is `true` (`attendeeFeedbackEnabled` or `partnerFeedbackEnabled`)
3. The questions array has at least one question (beyond the default)

If any condition fails, the user sees an unavailable state instead of a broken page.

---

## Submission Flow

1. User fills out the form and clicks submit
2. Frontend builds the payload:
   ```json
   {
     "respondentName": "Jane Doe",
     "respondentEmail": "jane@example.com",
     "responses": {
       "overall-rating": 9,
       "q-networking": "Great networking opportunities"
     }
   }
   ```
3. POSTs to `/events/{id}/{year}/feedback/{formType}`
4. Backend validates via `validateFeedbackPayload()` in `feedbackHelpers.js`:
   - Checks respondent name ≤120 chars, email format
   - Validates each response matches a valid questionId
   - Validates per-type rules (text length, choice validity, scale bounds)
   - Checks required questions have non-empty responses
5. Writes to `biztechEventFeedback` table
6. Returns 201 with submission UUID

---

## Submission States

| State            | UX                                                 |
| ---------------- | -------------------------------------------------- |
| Loading          | Skeleton loading state while form config fetches   |
| Invalid formType | Error message (not `attendee` or `partner`)        |
| Form unavailable | "Feedback is not available" message with back link |
| Validation error | Inline error messages below affected fields        |
| Submit success   | Thank-you confirmation card                        |
| Submit failure   | Toast with backend error message                   |

---

## Responsive Behavior

Public feedback pages use a single-column mobile-first layout:

- Touch-friendly input sizes on mobile
- Capped max-width card on desktop
- Safe text wrapping for long question labels and option text

---

## Key Files

| File                                                       | Purpose                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `src/pages/event/[eventId]/[year]/feedback/index.tsx`      | Feedback hub (attendee/partner selection)                       |
| `src/pages/event/[eventId]/[year]/feedback/[formType].tsx` | Form page — loads config and renders form                       |
| `src/components/Events/EventFeedbackForm.tsx`              | Form component — renders questions, handles validation, submits |
| `services/events/handler.js` → `getFeedbackForm`           | Returns form config                                             |
| `services/events/handler.js` → `submitFeedback`            | Validates and stores submission                                 |
| `services/events/feedbackHelpers.js`                       | `validateFeedbackPayload()` — per-type validation               |

---

## Related Pages

- [Event Feedback Overview](/docs/deep-dives/event-feedback) — architecture and end-to-end flow
- [Admin Builder](/docs/deep-dives/event-feedback/admin-builder) — how admins configure the questions
- [Backend API](/docs/deep-dives/event-feedback/backend-api) — endpoint details and feedbackHelpers.js pipeline
- [Events Service](/docs/services/events) — all event endpoints
