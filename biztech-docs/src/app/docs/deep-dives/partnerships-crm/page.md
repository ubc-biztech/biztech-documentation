---
title: 'Partnerships CRM'
nextjs:
  metadata:
    title: 'Partnerships CRM'
    description: 'Detailed guide for the Partnerships CRM across architecture, workflows, email operations, sync integrations, and backend APIs.'
---

The Partnerships CRM is the admin system used to track partner relationships across the year. It covers partner records, event-specific outreach tracking, reporting, email operations, communication history, and Google Sheets sync. {% .lead %}

---

## Where It Lives

- Admin route: `/admin/partnerships`
- Sidebar label: **Partnerships**
- Frontend repo: `bt-web-v2`
- Backend service: `serverless-biztechapp-1/services/partnerships`

---

## Environment Setup

Partnerships env is backend-only and defined in `services/partnerships/serverless.yml`.

Google Sheets variables:

- `PARTNERSHIPS_GSHEETS_ENABLED`
- `PARTNERSHIPS_GSHEETS_AUTO_SYNC`
- `PARTNERSHIPS_GSHEETS_SPREADSHEET_ID`
- `PARTNERSHIPS_GSHEETS_SHEET_NAME`
- credentials (choose one format):
  - `PARTNERSHIPS_GSHEETS_SERVICE_ACCOUNT_JSON` (recommended)
  - or `PARTNERSHIPS_GSHEETS_SERVICE_ACCOUNT_EMAIL` + `PARTNERSHIPS_GSHEETS_PRIVATE_KEY`

Email sync variables:

- `PARTNERSHIPS_EMAIL_SYNC_ENABLED`
- `PARTNERSHIPS_EMAIL_SYNC_INGEST_URL` (optional override)
- `PARTNERSHIPS_EMAIL_SYNC_ALLOWED_DOMAINS`

{% callout title="Important" %}
Set these in the runtime where the partnerships backend is deployed. Frontend env files do not configure backend integrations.
{% /callout %}

---

## What Is In Scope

- Partner directory (search, filters, archive, tags, alumni flag)
- Partnerships-specific events (separate from public registration events)
- Partner-event links with status, role, tier, amount, and follow-up date
- Overview reporting (goal pace, pipeline, event scoreboard, action queue)
- Document links and communication timeline per partner
- Template + mail merge sending from signed-in exec account
- Gmail ingest for sends/replies into communication logs
- Google Sheets push/pull/merge sync for spreadsheet workflows

{% callout title="Not in scope yet" %}
- Binary file storage for documents (documents are link records)
- Auto-generated MOU/invoice document creation
{% /callout %}

---

## Read This Section In Order

1. Architecture & File Map
2. Data Model
3. UI guides (Overview, Partners, Events, Email Ops)
4. Gmail Sync Setup
5. Google Sheets Sync + Sheet Mapping
6. Backend API + Troubleshooting

---

## Quick Links

{% quick-links %}

{% quick-link title="Architecture & File Map" icon="installation" href="/docs/deep-dives/partnerships-crm/architecture/" description="Frontend/backend boundaries, request flow, and file ownership." /%}

{% quick-link title="Data Model" icon="plugins" href="/docs/deep-dives/partnerships-crm/data-model/" description="Dynamo tables, key record shapes, indexes, and relationship rules." /%}

{% quick-link title="Admin Workflows" icon="presets" href="/docs/deep-dives/partnerships-crm/admin-workflows/" description="Operator playbook for day-to-day CRM usage." /%}

{% quick-link title="Overview Tab" icon="plugins" href="/docs/deep-dives/partnerships-crm/overview-tab/" description="How to read goals, pipeline, event scoreboard, and action items." /%}

{% quick-link title="Partners Tab" icon="plugins" href="/docs/deep-dives/partnerships-crm/partners-tab/" description="Directory filters, partner detail panels, and communication logging." /%}

{% quick-link title="Events Tab" icon="plugins" href="/docs/deep-dives/partnerships-crm/events-tab/" description="Create CRM events, define tier presets, and manage event involvements." /%}

{% quick-link title="Email Ops" icon="plugins" href="/docs/deep-dives/partnerships-crm/email-ops/" description="Template management, mail merge flow, and merge field behavior." /%}

{% quick-link title="Gmail Sync Setup" icon="installation" href="/docs/deep-dives/partnerships-crm/gmail-sync/" description="Exact Apps Script setup steps for syncing inbox activity." /%}

{% quick-link title="Google Sheets Sync" icon="plugins" href="/docs/deep-dives/partnerships-crm/google-sheets-sync/" description="Credential setup, status meanings, and push/pull/merge operations." /%}

{% quick-link title="Google Sheets Mapping" icon="warning" href="/docs/deep-dives/partnerships-crm/google-sheets-mapping/" description="Column-level mapping and merge rules between sheet rows and CRM records." /%}

{% quick-link title="Backend API" icon="plugins" href="/docs/deep-dives/partnerships-crm/backend-api/" description="Endpoint contract, route auth, and validation constraints." /%}

{% quick-link title="Troubleshooting" icon="warning" href="/docs/deep-dives/partnerships-crm/troubleshooting/" description="Common failures and the exact checks to resolve them quickly." /%}

{% /quick-links %}
