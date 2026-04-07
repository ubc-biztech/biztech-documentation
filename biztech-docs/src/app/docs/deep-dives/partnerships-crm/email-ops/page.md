---
title: 'Partnerships CRM: Email Ops'
nextjs:
  metadata:
    title: 'Partnerships CRM Email Ops'
    description: 'Template, mail merge, merge-field, and logging behavior for Partnerships CRM email operations.'
---

Email Ops is the outbound comms workspace inside `/admin/partnerships`.

---

## What This Tab Handles

- template library for reusable outreach messages
- mail merge sending
- merge-field picker and per-recipient preview
- sender identity from signed-in exec
- Gmail sync status and setup entry point

---

## Sender Model

Mail merges send as the signed-in admin user.

The backend resolves sender from auth context and validates sender email before sending. If sender email cannot be resolved, send is blocked with an input error.

---

## Template Lifecycle

### Create Template

Required fields:

- `name`
- `subjectTemplate`
- `bodyTemplate`

Optional fields:

- `description`

### Edit Template

Templates support partial update. At least one editable field must be provided.

### Archive Template

Archive is soft-delete behavior:

- template is hidden from normal pickers
- historical records remain intact
- archived template cannot be used for new sends

---

## Supported Merge Fields

Configured in backend (`massEmail.js`):

| Token | Meaning |
| --- | --- |
| `{{recipient_first_name}}` | partner contact first name |
| `{{recipient_last_name}}` | partner contact last name |
| `{{recipient_full_name}}` | partner contact full name |
| `{{recipient_email}}` | partner email |
| `{{sender_first_name}}` | signed-in sender first name |
| `{{sender_last_name}}` | signed-in sender last name |
| `{{sender_full_name}}` | signed-in sender full name |
| `{{sender_email}}` | signed-in sender email |
| `{{company_name}}` | partner company |
| `{{contact_name}}` | partner contact name |
| `{{event_name}}` | selected CRM event name |
| `{{event_year}}` | selected CRM event year |

Validation behavior:

- unknown tokens are rejected at save/send
- token format must be `{{token_name}}`

---

## Mail Merge Flow

1. Open **Mail Merge**.
2. Select recipients.
3. Optionally select event context.
4. Choose template or write one-off subject/body.
5. Preview output for selected recipients.
6. Send.

Backend behavior:

- max recipients per request: 200
- sends run in batches
- each recipient has individual result status
- successful sends write outbound communication logs

---

## Result Handling

Send response includes:

- totals (`sent`, `skipped`, `failed`)
- per-recipient failures with reason
- template usage update (`lastUsedAt`) when applicable

Useful operational pattern:

- immediately filter failed recipients
- fix missing email/template issues
- rerun the mail merge for failures only

---

## Communication Log Write-Back

For successful sends, the backend creates communication entries with:

- channel: email
- direction: outbound
- source: manual mail merge flow
- event context (if selected)
- rendered subject/summary context

This ensures partner timelines show both manual notes and mail merge sends.

---

## Limits And Guardrails

- template cap: 200
- recipient cap: 200 per send
- body/subject cannot render to empty text after merge
- archived templates are blocked from send

---

## Where To Read The Code

- frontend tab: `bt-web-v2/src/components/PartnershipsCRM/EmailTab.tsx`
- mail merge dialog: `bt-web-v2/src/components/PartnershipsCRM/MassEmailDialog.tsx`
- merge picker: `bt-web-v2/src/components/PartnershipsCRM/MergeFieldPicker.tsx`
- backend logic: `serverless-biztechapp-1/services/partnerships/massEmail.js`
- route wiring: `serverless-biztechapp-1/services/partnerships/handler.js`

---

## Related Pages

- Gmail ingest setup: [Gmail Sync Setup](/docs/deep-dives/partnerships-crm/gmail-sync)
- API contract: [Backend API](/docs/deep-dives/partnerships-crm/backend-api)
- common failures: [Troubleshooting](/docs/deep-dives/partnerships-crm/troubleshooting)
