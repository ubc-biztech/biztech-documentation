---
title: 'Partnerships CRM: Events Tab'
nextjs:
  metadata:
    title: 'Partnerships CRM Events Tab'
    description: 'How to manage partnerships events, tier presets, and event-level partner involvements.'
---

Events tab manages partnerships-specific event records and event-side involvement operations.

---

## Why These Events Are Separate

CRM events are not the same as public registration events.

Reason:

- partner outreach often starts before public event pages are created
- partnerships team needs planning fields that public events do not carry

Optional bridge fields exist for future linking to main events.

---

## Creating A Partnerships Event

Required:

- event name
- event year

Recommended:

- outreach start date
- event start/end date
- sponsorship goal
- event notes

Date format must be `YYYY-MM-DD`.

---

## Tier Presets

Each event can define its own tier presets.

Tier preset fields:

- label (for display)
- key (normalized slug)
- default amount (optional)

Why this matters:

- involvement forms can assign tiers quickly
- default amount helps reduce repeated manual entry
- reporting stays consistent across records

---

## Event Detail View

Event detail shows:

- current goal/progress context
- involved partners for that event
- status mix and follow-up pressure

From this view you can:

- link existing partner
- edit involvement status/role/tier/amount/follow-up
- remove involvement link

---

## Involvement Roles

Role is flexible text so one event can include:

- sponsor
- mentor
- keynote speaker
- judge
- workshop lead
- any custom relationship type

Use role consistently so filtering and handoffs stay clean.

---

## Event Delete And Archive Behavior

- delete is blocked if partner-event links still exist
- archive should be default for historical events
- use delete only for incorrect test data or accidental records

---

## Event-Level Workflow Example

1. Create event with goal + dates.
2. Add tier presets.
3. Link first batch of target partners.
4. Set follow-up dates on all open statuses.
5. Review event scoreboard in Overview.
6. Iterate weekly.

---

## Code Locations

- page orchestration: `bt-web-v2/src/pages/admin/partnerships.tsx`
- event/involvement dialogs: `bt-web-v2/src/components/PartnershipsCRM/PartnershipsDialogs.tsx`
- backend event handlers: `services/partnerships/handler.js`
- normalization helpers: `services/partnerships/helpers.js`

---

## Related Docs

- day-to-day operator flow: [Admin Workflows](/docs/deep-dives/partnerships-crm/admin-workflows)
- partner-side editing: [Partners Tab](/docs/deep-dives/partnerships-crm/partners-tab)
- metrics impact: [Overview Tab](/docs/deep-dives/partnerships-crm/overview-tab)
