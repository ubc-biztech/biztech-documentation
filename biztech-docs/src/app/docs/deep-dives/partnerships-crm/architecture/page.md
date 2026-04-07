---
title: 'Partnerships CRM: Architecture & File Map'
nextjs:
  metadata:
    title: 'Partnerships CRM Architecture & File Map'
    description: 'Detailed architecture map for frontend, backend, sync integrations, and ownership boundaries in Partnerships CRM.'
---

Use this page when you need to quickly answer: "where should this change live?"

---

## Runtime Flow

1. Admin opens `/admin/partnerships`.
2. Frontend loads partners, events, overview data, and integration status.
3. Requests go through `fetchBackend` into `services/partnerships`.
4. Backend reads/writes DynamoDB tables.
5. Optional integrations run on top:
   - SES for outbound mail merge sends
   - Gmail ingest endpoint for communication sync
   - Google Sheets API for push/pull/merge sync

---

## Frontend Ownership

### Root page

- `bt-web-v2/src/pages/admin/partnerships.tsx`: cross-tab state, data fetch/mutate orchestration, directory/detail layout, modal orchestration.

### Main tab components

- `bt-web-v2/src/components/PartnershipsCRM/OverviewTab.tsx`: scope filters, KPI cards, pipeline/event tables, action queue, sync cards.
- `bt-web-v2/src/components/PartnershipsCRM/EmailTab.tsx`: template library, mail merge launch, Gmail sync setup/status.

### Dialog and shared UI

- `bt-web-v2/src/components/PartnershipsCRM/PartnershipsDialogs.tsx`: partner/event/involvement/document/communication forms.
- `bt-web-v2/src/components/PartnershipsCRM/MassEmailDialog.tsx`: mail merge compose, recipient selection, preview, send results.
- `bt-web-v2/src/components/PartnershipsCRM/GmailSyncSetupDialog.tsx`: Apps Script setup instructions.
- `bt-web-v2/src/components/PartnershipsCRM/MergeFieldPicker.tsx`: merge token picker.
- `bt-web-v2/src/components/PartnershipsCRM/StatusChip.tsx`: status chip rendering.

### Frontend types and helpers

- `bt-web-v2/src/components/PartnershipsCRM/partnershipsPageTypes.ts`: domain types for partners/events/docs/comms.
- `bt-web-v2/src/components/PartnershipsCRM/types.ts`: overview + sync response types.
- `bt-web-v2/src/components/PartnershipsCRM/partnershipsPageDefaults.ts`: default forms/constants/options.
- `bt-web-v2/src/components/PartnershipsCRM/partnershipsPageUtils.ts`: format/parse/export helpers.
- `bt-web-v2/src/components/PartnershipsCRM/emailTabUtils.ts`: merge preview helpers.
- `bt-web-v2/src/components/PartnershipsCRM/status.ts`: canonical status metadata and label helpers.

---

## Backend Ownership

- `serverless-biztechapp-1/services/partnerships/serverless.yml`: route registration, IAM, env vars, DynamoDB resources.
- `serverless-biztechapp-1/services/partnerships/handler.js`: route-level orchestration and response shaping.
- `serverless-biztechapp-1/services/partnerships/helpers.js`: normalization, validation, status/tier helpers.
- `serverless-biztechapp-1/services/partnerships/dashboardReport.js`: overview aggregations and action items.
- `serverless-biztechapp-1/services/partnerships/massEmail.js`: template CRUD, merge rendering, SES send, comm log write-back.
- `serverless-biztechapp-1/services/partnerships/emailSync.js`: Gmail ingest parser, dedupe, partner matching, sync status snapshot.
- `serverless-biztechapp-1/services/partnerships/googleSheets.js`: config/status, push/pull/merge behavior, sheet formatting.
- `serverless-biztechapp-1/services/partnerships/exportRows.js`: flat row generation for CSV/Sheets.

---

## Design Rules Used In This Service

- Keep `handler.js` thin; put normalization and reusable rules in helpers.
- Keep reporting logic separate from CRUD handlers.
- Keep mail merge send logic and inbox sync logic separate.
- Keep Google Sheets integration isolated from core CRUD behavior.
- Keep heavy page orchestration in `partnerships.tsx`, and render-heavy UI in tab/dialog components.

---

## Common Change Paths

### Add a new partner field

1. Update normalization in `helpers.js`.
2. Wire create/update route usage in `handler.js` if needed.
3. Update frontend types/defaults.
4. Update dialog fields.
5. Update directory/detail rendering.
6. Update export + Sheets mapping if this field must sync.

### Add a new overview metric

1. Compute in `dashboardReport.js`.
2. Extend backend response payload.
3. Update frontend response type in `types.ts`.
4. Render in `OverviewTab.tsx`.

### Add a new mail merge field

1. Add merge-field definition/rendering in `massEmail.js`.
2. Verify config response includes it.
3. Verify picker/preview handling in frontend.
