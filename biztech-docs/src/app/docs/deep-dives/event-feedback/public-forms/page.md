---
title: 'Event Feedback: Public Forms'
nextjs:
  metadata:
    title: 'Event Feedback Public Forms'
    description: 'Public attendee and partner feedback experience, including validation and submission behavior.'
---

This is the user-facing flow for attendees and partners submitting feedback.

---

## Public URLs

| URL | Purpose |
| --- | --- |
| `/event/{eventId}/{year}/feedback` | Feedback hub with role selection |
| `/event/{eventId}/{year}/feedback/attendee` | Attendee form |
| `/event/{eventId}/{year}/feedback/partner` | Partner form |

No login is required to load or submit these forms.

---

## Availability Rules

A form is shown as available only when all conditions pass:

1. corresponding form is enabled on the event
2. that form has at least one configured question
3. event exists for `{eventId, year}`

If a form is disabled or empty, users see a clear unavailable state instead of a broken page.

---

## Form UX

Each form includes:
- event header card (image, location, date/time)
- optional respondent name/email fields
- dynamic question list
- required indicators
- inline validation messages

Question rendering:
- short/long text inputs
- radio group for multiple choice
- checkbox list for multi-select
- integer slider for linear scale (locks to whole numbers)

Validation messages are shown inline as high-contrast warning blocks.

---

## Submission States

| State | UX |
| --- | --- |
| Loading | Skeleton-like loading card / text state |
| Invalid formType | Explicit error state |
| Form unavailable | Disabled-state message + back link |
| Submit success | Thank-you confirmation card |
| Submit failure | Toast with backend error message |

---

## Responsive Behavior

Public feedback pages are built with single-column mobile-first layout, then progressively enhance for larger widths:
- touch-friendly inputs/buttons on mobile
- capped max-width card layout on desktop
- safe text wrapping for long prompts/options
