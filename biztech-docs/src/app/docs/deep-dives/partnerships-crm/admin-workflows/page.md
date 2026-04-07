---
title: 'Partnerships CRM: Admin Workflows'
nextjs:
  metadata:
    title: 'Partnerships CRM Admin Workflows'
    description: 'Operator workflows for the Partnerships CRM across overview, partners, events, and email operations.'
---

This page is the practical playbook for execs using the CRM day to day.

---

## Daily Flow Most Teams Follow

1. Open **Overview** first.
2. Check overdue and due-soon items.
3. Open the partner records you need to action.
4. Log new communication right after each outreach touch.
5. Send mail merges (if needed) from Email Ops.
6. Run Sheets sync only when reconciling spreadsheet edits.

---

## Workflow A: Add A New Partner

1. Go to **Partners**.
2. Click **Add Partner**.
3. Fill `company` (required) plus contact info.
4. Add optional notes, tags, and alumni flag.
5. Save.

What updates right away:

- partner appears in directory
- partner counts update
- filters include new tag/status context after refresh
- optional Sheets auto-sync push runs if enabled

---

## Workflow B: Add A Partnerships Event

Use this for outreach planning events, even if no public registration event exists yet.

1. Go to **Events**.
2. Click **New Event**.
3. Set name and year.
4. Add outreach/start/end dates.
5. Add sponsorship goal.
6. Add tier presets (optional but recommended).
7. Save.

Tier presets matter because involvement forms can assign them quickly with default amounts.

---

## Workflow C: Link A Partner To An Event

1. Open partner detail or event detail.
2. Click **Link Partner** / **Add Involvement**.
3. Set:
   - status
   - role (sponsor, mentor, speaker, judge, etc.)
   - package tier
   - amount
   - follow-up date
4. Save.

Notes:

- one partner-event pair is unique
- status supports **Other / Custom**
- amount is optional but must be non-negative

---

## Workflow D: Work The Follow-Up Queue

1. Open **Overview**.
2. Set window to 7/14/21/30/45 days depending on urgency.
3. Start with overdue items.
4. Open partner detail from each row.
5. Record outreach in communications.
6. Adjust follow-up dates/status on links.

The queue gets more useful if follow-up dates are always set during link updates.

---

## Workflow E: Send A Mail Merge

1. Go to **Email Ops**.
2. Create or pick a template.
3. Open **Mail Merge**.
4. Select recipients.
5. Preview merge output for at least one recipient.
6. Send.

After send:

- each successful email is logged in partner communications
- failed/skipped recipients are returned in send results
- template `lastUsedAt` is updated when template is used

---

## Workflow F: Keep The Timeline Complete

To preserve clean handoffs between execs:

- log calls/meetings manually in comms
- use Gmail sync for normal inbox sends/replies
- avoid duplicating logs manually for emails already synced

---

## Where To Go Next

- For metric interpretation: [Overview Tab](/docs/deep-dives/partnerships-crm/overview-tab)
- For detailed directory behavior: [Partners Tab](/docs/deep-dives/partnerships-crm/partners-tab)
- For event setup and tiers: [Events Tab](/docs/deep-dives/partnerships-crm/events-tab)
- For outbound comms: [Email Ops](/docs/deep-dives/partnerships-crm/email-ops)
