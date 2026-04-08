---
title: 'Partnerships CRM: Gmail Sync Setup'
nextjs:
  metadata:
    title: 'Partnerships CRM Gmail Sync Setup'
    description: 'Step-by-step guide to connect Gmail activity into Partnerships CRM communication logs using Apps Script.'
---

How to setup your Gmail to sync with the partnerships CRM

---

## What Gmail Sync Adds

Gmail sync imports normal inbox activity into partner communication logs.

What gets synced:

- outbound messages sent from connected inbox
- inbound replies from partners
- message/thread IDs for dedupe

Where it appears:

- Partner detail -> **Communications**
- Overview sync health cards

---

## Before You Start

1. Use the same Gmail inbox you send partner outreach from.
2. Open two tabs:
   - Partnerships CRM Email Ops
   - Google Apps Script
3. Confirm your email domain is allowed by backend (`PARTNERSHIPS_EMAIL_SYNC_ALLOWED_DOMAINS`).

---

## Setup Steps

### Step 1: Copy the script template from CRM

1. Open `/admin/partnerships`.
2. Go to **Email Ops**.
3. Click **Setup Guide**.
4. Copy the **Apps Script template** shown in the dialog.

The template already includes the correct ingest endpoint for your current backend.

### Step 2: Create a new Apps Script project

1. Go to [https://script.new](https://script.new).
2. Remove placeholder code.
3. Paste the copied template.
4. Save project as `Partnerships CRM Email Sync`.

### Step 3: Run once for Google permissions

1. In Apps Script toolbar, pick function `syncPartnershipEmails`.
2. Click **Run**.
3. Approve permissions in Google consent flow.
4. If you see an unverified warning:
   - click **Advanced**
   - click **Go to ... (unsafe)**
   - continue and allow

This one-time run grants Gmail read + webhook post permissions.

### Step 4: Create the time trigger

1. In Apps Script, click **Triggers** (clock icon).
2. Click **+ Add Trigger**.
3. Set:
   - function: `syncPartnershipEmails`
   - deployment: `Head`
   - event source: `Time-driven`
   - time-based type: `Minutes timer`
   - interval: `Every 10 minutes` (or `Every 15 minutes`)
4. Save.

### Step 5: Verify in CRM

1. Return to Email Ops.
2. Click **Refresh**.
3. Confirm:
   - status changes to configured
   - `Last Sync` updates
   - your inbox appears in `Synced Accounts`

---

## Multi-Exec Setup

Each exec should connect their own inbox with the same steps above.

Notes:

- this is expected behavior, not duplication
- actor email is tracked in sync status
- comm logs still dedupe by message/thread identifiers

---

## What To Check If It Stops Working

### Last Sync never changes

- Apps Script -> **Executions** -> open latest run
- confirm there are no runtime errors
- confirm trigger still exists and is enabled

### Status says configured but imports stay zero

- send one real email from that inbox
- wait one trigger interval
- refresh Email Ops status card

### Domain blocked error

- actor email domain is not allowed
- update backend env `PARTNERSHIPS_EMAIL_SYNC_ALLOWED_DOMAINS`

### Duplicate comm entries

- check if script payload includes stable message/thread ids
- dedupe logic relies on those identifiers

---

## Payload Summary

Ingest route accepts actor + entries payload. Each entry can include:

- direction
- sender/recipient email fields
- subject/summary snippet
- occurred timestamp
- message/thread ids
- optional event context (`eventId`, `eventYear`)

Backend normalizes and matches entries in `services/partnerships/emailSync.js`.

---

## Related Docs

- outbound mail merge: [Email Ops](/docs/deep-dives/partnerships-crm/email-ops)
- API routes and auth: [Backend API](/docs/deep-dives/partnerships-crm/backend-api)
- incident handling: [Troubleshooting](/docs/deep-dives/partnerships-crm/troubleshooting)
