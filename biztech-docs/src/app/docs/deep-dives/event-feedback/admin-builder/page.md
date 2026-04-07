---
title: 'Event Feedback: Admin Form Builder'
nextjs:
  metadata:
    title: 'Event Feedback Admin Builder'
    description: 'How execs create and maintain attendee and partner feedback forms from the admin dashboard.'
---

This page covers the exec workflow for building and reviewing event feedback forms in the admin dashboard.

---

## Where to Find It

Path: `/admin/event/{eventId}/{year}`

Open the **Feedback** tab (next to Data Table, Teams, and Analytics).

---

## Builder Mode

### 1. Enable forms

Execs can independently toggle:
- attendee form (`attendeeFeedbackEnabled`)
- partner form (`partnerFeedbackEnabled`)

At least one must be enabled to collect responses.

### 2. Define questions

Question builder supports:

| Type | Notes |
| --- | --- |
| `SHORT_TEXT` | Single-line style answer, max 280 chars |
| `LONG_TEXT` | Longer freeform answer, max 4000 chars |
| `MULTIPLE_CHOICE` | Single selection |
| `CHECKBOXES` | Multi selection |
| `LINEAR_SCALE` | Integer scale with min/max + labels |

### 3. Default locked question

Each form always includes:
- ID: `overall-rating`
- Label: `How would you rate this event overall?`
- Type: `LINEAR_SCALE`
- Required: `true`
- Range: `1` to `10`

This question is locked in the UI (cannot be removed or modified).

### 4. Save behavior

Click **Save Feedback Forms** to patch the event record with:
- form enabled flags
- normalized question arrays for attendee/partner

Backend validation runs before save is accepted (question type validity, options, scale bounds, etc).

---

## QR + Share Links

The tab auto-generates one QR card per form:
- attendee form QR
- partner form QR

Each card includes:
- direct public URL
- copy-link action
- open-in-new-tab action

---

## Responses Mode

Responses mode fetches both metadata and submissions for attendee + partner forms.

Features:
- role toggle (`attendee` / `partner`)
- quick stats (submission count, identified responses, avg overall rating, latest response)
- sort modes (newest, oldest, top rated, low rated)
- full-text search across contact info + answers
- expandable response cards
- export current tab as JSON

{% callout title="Auth behavior" %}
Public submissions are unauthenticated, but viewing response lists is admin-only (`GET /events/{id}/{year}/feedback/{formType}/submissions` requires Cognito auth).
{% /callout %}
