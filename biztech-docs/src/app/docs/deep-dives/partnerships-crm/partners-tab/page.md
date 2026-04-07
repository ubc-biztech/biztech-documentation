---
title: 'Partnerships CRM: Partners Tab'
nextjs:
  metadata:
    title: 'Partnerships CRM Partners Tab'
    description: 'Detailed guide to partner directory filters, status context, partner detail panels, and activity logging.'
---

Partners tab is the relationship workspace: directory on the left, detail context on selection.

---

## Directory Filters

Available filters include:

- free-text search (company/contact/email/tags)
- event filter
- status filter
- package tier filter
- partner tier filter
- alumni-only filter
- tag filter
- archived toggle

Important behavior:

- status shown in directory is context-sensitive
- if event filter is set, status reflects that event context
- if no event filter is set, status reflects latest relevant relationship snapshot

---

## Partner Row Design

Each row is optimized for fast scanning:

- contact-first identity (name emphasis)
- company secondary label
- status chip(s)
- follow-up and activity context

When multiple people exist from one company, treat each person as a separate partner record.

---

## Partner Detail Panels

Selecting a partner opens detail tabs:

1. **Sponsorships / Involvements**
2. **Documents**
3. **Communications**

### Sponsorships panel

Shows all partner-event links with status, role, tier, amount, and follow-up date.

### Documents panel

Stores link-based records for docs like decks, MOUs, invoices.

### Communications panel

Combines manual logs and synced email activity in one timeline.

---

## Create And Edit Partner

Create form fields include:

- company (required)
- contact name
- contact role
- email, phone, LinkedIn
- tags
- alumni flag
- notes

Edit supports archive state toggle and normal field updates.

---

## Logging Communications Properly

When adding manual comm entries, include:

- channel
- direction
- summary
- occurred date/time
- optional follow-up date
- optional event context

Do this consistently so action queue quality stays high.

---

## Linking And Updating Event Involvements

From partner detail, you can add/edit involvement records with:

- status (includes custom)
- role (mentor/sponsor/speaker/etc.)
- tier (event presets or custom)
- amount
- follow-up date

This is the source data for both reporting and follow-up queue.

---

## Good Data Hygiene Conventions

- archive old records instead of deleting whenever possible
- always set follow-up dates for open statuses
- keep custom statuses minimal and intentional
- avoid using notes as a replacement for structured fields

---

## Code Locations

- main page/table orchestration: `bt-web-v2/src/pages/admin/partnerships.tsx`
- dialog forms: `bt-web-v2/src/components/PartnershipsCRM/PartnershipsDialogs.tsx`
- status display: `bt-web-v2/src/components/PartnershipsCRM/StatusChip.tsx`
- normalization defaults/helpers: `partnershipsPageDefaults.ts`, `partnershipsPageUtils.ts`

---

## Related Docs

- event-side management: [Events Tab](/docs/deep-dives/partnerships-crm/events-tab)
- KPI interpretation: [Overview Tab](/docs/deep-dives/partnerships-crm/overview-tab)
