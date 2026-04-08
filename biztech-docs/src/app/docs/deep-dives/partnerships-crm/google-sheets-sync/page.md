---
title: 'Partnerships CRM: Google Sheets Sync'
nextjs:
  metadata:
    title: 'Partnerships CRM Google Sheets Sync'
    description: 'Detailed setup and operations guide for Partnerships CRM Google Sheets synchronization.'
---

Google Sheets sync keeps CRM data and spreadsheet workflows aligned.

---

## Sync Modes

| Mode | Direction | Use when |
| --- | --- | --- |
| `push` | CRM -> Sheet | CRM is source of truth |
| `pull` | Sheet -> CRM | team bulk-edited sheet and wants those edits in CRM |
| `merge` | pull then push | both sides changed and you want normalized reconciliation |

---

## Required Env Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `PARTNERSHIPS_GSHEETS_ENABLED` | recommended | set `false` to hard-disable |
| `PARTNERSHIPS_GSHEETS_AUTO_SYNC` | optional | if `true`, successful writes trigger best-effort push |
| `PARTNERSHIPS_GSHEETS_SPREADSHEET_ID` | yes | target spreadsheet id |
| `PARTNERSHIPS_GSHEETS_SHEET_NAME` | optional | defaults to `PartnershipsCRM` |
| `PARTNERSHIPS_GSHEETS_SERVICE_ACCOUNT_JSON` | preferred | full JSON credentials |
| `PARTNERSHIPS_GSHEETS_SERVICE_ACCOUNT_EMAIL` | fallback | used with private key |
| `PARTNERSHIPS_GSHEETS_PRIVATE_KEY` | fallback | used with account email |

{% callout title="Credentials stay backend-only" %}
Do not expose service account credentials in frontend env vars.
{% /callout %}

---

## One-Time Google Setup

### Step 1: Create service account

1. Open Google Cloud Console.
2. Create/select project.
3. Enable Google Sheets API.
4. Create service account.
5. Generate key JSON.

### Step 2: Share spreadsheet

1. Open target spreadsheet.
2. Click **Share**.
3. Add service account email as **Editor**.
4. Save.

### Step 3: Configure backend env and redeploy

Set env vars in the runtime where Partnerships backend runs, then deploy/restart service.

---

## Local Testing Against A Real Sheet

1. Export env vars in shell running `serverless offline`.
2. Start partnerships service locally.
3. Open CRM and check Sheets status card.
4. Trigger manual sync (`push`) from Overview tab.
5. Confirm spreadsheet updates.
6. Edit one row in sheet.
7. Trigger `pull` and verify CRM data updates.

---

## Status Card Meanings

- `Not configured`: missing/invalid env setup, or hard-disabled
- `Configured`: credentials + sheet access validated
- `Configured but not accessible`: credentials exist, but sheet cannot be opened

Status payload also returns:

- `diagnostics` for env presence checks
- `lastSyncAt`, `lastSyncMode`, `lastSyncStatus`
- `lastSyncSummary` + `lastSyncError`

---

## Auto-Sync Behavior

When `PARTNERSHIPS_GSHEETS_AUTO_SYNC=true`:

- partner/event/link/document/comm mutations can trigger a best-effort push
- write operation still succeeds even if auto-sync push fails
- sync failure is logged and shown in sync status metadata

---

## Pull Guardrails

During pull:

- row with empty company/contact context is skipped
- company is required
- date fields must be `YYYY-MM-DD`
- amount fields must parse as non-negative numbers
- status/tier values are normalized to CRM formats

Warnings are returned in sync result summary for skipped/partial rows.

---

## Formatting Applied To Sheet

After push, backend applies presentation rules:

- frozen header row
- grouped header color bands
- status chips with color formatting
- boolean highlights (alumni/archive)
- adjusted column widths

Formatting logic is in `services/partnerships/googleSheets.js`.

---

## Common Errors

### Google Sheets sync is not configured.

- missing spreadsheet id and/or credentials

### ...configured but the sheet could not be accessed.

- wrong spreadsheet id
- sheet not shared with service account
- invalid private key (newline formatting issue)

### Dynamo ResourceNotFoundException when checking status

- local tables were not migrated (including meta table)

---

## Related Docs

- column behavior: [Google Sheets Mapping](/docs/deep-dives/partnerships-crm/google-sheets-mapping)
- env setup: [Partnerships CRM Overview](/docs/deep-dives/partnerships-crm#environment-setup)
- route details: [Backend API](/docs/deep-dives/partnerships-crm/backend-api)
