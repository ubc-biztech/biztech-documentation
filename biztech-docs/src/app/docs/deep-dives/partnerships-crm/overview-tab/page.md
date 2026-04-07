---
title: 'Partnerships CRM: Overview Tab'
nextjs:
  metadata:
    title: 'Partnerships CRM Overview Tab'
    description: 'How to read and use the Partnerships CRM Overview tab: scope controls, goals, pipeline, event scoreboard, and action queue.'
---

The Overview tab is the fastest way to understand current pipeline health.

---

## 1) Dashboard Scope Controls

Top controls decide what every card/table is based on:

- year (`auto`, `all`, or specific year)
- event (all or one partnerships event)
- follow-up window days
- include archived records toggle

Rule of thumb:

- if a number looks off, check scope first before debugging data.

---

## 2) Top KPI Cards

Overview shows high-level cards for:

- active partners
- events in scope
- archived events
- revenue secured
- goal remaining
- open pipeline
- action items

These are summary totals, not raw table rows. They refresh when scope changes.

---

## 3) Goal Pace Card

Goal Pace compares:

- actual progress (`secured / goal`)
- expected progress by today (based on event timeline)
- pace delta (ahead/on track/behind)

If event/annual goal is missing, pace intentionally shows no-goal state.

---

## 4) Pipeline Breakdown

Pipeline table groups links by status and shows:

- relationship count
- dollar amount
- share of count
- share of amount

Use this to spot where value is stuck (for example lots of value in `pitched` but low conversion to `confirmed`/`paid`).

---

## 5) Event Scoreboard

Each row shows one event with:

- secured amount vs goal
- open pipeline
- pace status
- follow-up pressure

Desktop and mobile render differently, but values are the same.

Clicking an event row opens event detail in the Events tab.

---

## 6) Action Queue

Action items combine due and stale signals across links/communications.

Fields include:

- due date + overdue status
- priority score
- partner + event context
- status and amount context

Recommended usage:

1. work overdue items first
2. log communication immediately after outreach
3. adjust follow-up date/status to clear resolved items

---

## 7) Sync Health Blocks

Overview also includes quick integration controls:

- Email sync health summary
- Google Sheets sync status + manual push/pull buttons

These are operational controls, not analytics metrics.

---

## Metric Definitions Used Here

- **Secured revenue**: link amounts in secured statuses
- **Open pipeline**: link amounts not yet secured
- **Goal remaining**: `goal - secured` (floored at zero only where needed in UI)
- **Action items**: overdue/due-soon/stale records based on configured window and rules in `dashboardReport.js`

---

## Code Locations

- UI: `bt-web-v2/src/components/PartnershipsCRM/OverviewTab.tsx`
- payload type: `bt-web-v2/src/components/PartnershipsCRM/types.ts`
- backend aggregation: `serverless-biztechapp-1/services/partnerships/dashboardReport.js`

---

## Related Docs

- operator flow: [Admin Workflows](/docs/deep-dives/partnerships-crm/admin-workflows)
- partner-level actions: [Partners Tab](/docs/deep-dives/partnerships-crm/partners-tab)
- issue recovery: [Troubleshooting](/docs/deep-dives/partnerships-crm/troubleshooting)
