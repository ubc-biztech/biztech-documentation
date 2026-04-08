---
title: 'Partnerships CRM: Troubleshooting'
nextjs:
  metadata:
    title: 'Partnerships CRM Troubleshooting'
    description: 'Common Partnerships CRM failures and exact checks for local and deployed environments.'
---

Use this page when CRM behavior looks wrong and you need fast diagnosis.

---

## 502 On /partnerships/partners

Typical backend log:

- `ResourceNotFoundException: Cannot do operations on a non-existent table`

Root cause:

- one or more CRM Dynamo tables do not exist in current stage/local runtime

Fix:

1. run Dynamo migration for partnerships service
2. verify all six CRM tables exist
3. restart `serverless offline`

---

## Google Sheets Shows "Not configured"

Meaning:

- backend did not find full config at runtime

Check:

- `PARTNERSHIPS_GSHEETS_SPREADSHEET_ID`
- credentials (`...SERVICE_ACCOUNT_JSON` or split email/private-key vars)
- `PARTNERSHIPS_GSHEETS_ENABLED` not explicitly `false`

Important:

- set vars where backend process runs, not just in frontend env files

---

## Google Sheets Shows "Configured but not accessible"

Meaning:

- credentials were parsed, but API call to spreadsheet failed

Check in order:

1. spreadsheet ID is correct
2. target sheet is shared with service account email as Editor
3. private key formatting preserved newlines
4. service account has Sheets API enabled

---

## Email Sync Stuck / Last Sync Not Updating

Check:

1. Apps Script trigger still exists and is enabled
2. Apps Script Executions show successful runs
3. actor email domain is allowed by backend env
4. ingest URL in script is current for your stage/domain

---

## Mail Merge Send Fails For Some Recipients

Common reasons:

- partner missing valid email
- template/body renders empty after merge
- recipient limit exceeded

Recommended workflow:

1. inspect failed recipient list from response
2. correct data/template
3. rerun only for failed recipients

---

## Event Delete Fails

Expected behavior if links still exist.

Fix options:

- archive event instead
- remove/migrate partner links first, then delete

---

## Status Looks Wrong In Partner Directory

Usually a filter/scope misunderstanding, not data corruption.

Check:

- active event filter
- active status/tier filters
- archived toggle

Status shown in directory is scoped to current filter context.

---

## Local Works, Deployed Fails

Checklist:

1. confirm env vars are present in deployed runtime
2. redeploy the partnerships service after env changes
3. verify stage-specific table names and permissions
4. check API domain mapping/deployment health for service routes

---

## Deploy Fails With functionName Length Error

Typical CloudFormation error:

- `failed to satisfy constraint: Member must have length less than or equal to 64`

What it means:

- the generated Lambda function name is too long
- this usually happens when the service name + stage + function key exceed 64 chars

Fix:

1. open `services/partnerships/serverless.yml`
2. add explicit short `name` for the failing function
3. keep a short convention (for example `ptn-${sls:stage}-...`)
4. redeploy

Tip:

- if you add long function keys later, set short `name` values immediately

---

## Deploy Warning About 60s/120s Timeout On HTTP Functions

Example warning:

- `it's attached to API Gateway so it's automatically limited to 30 seconds`

Meaning:

- API Gateway synchronous integrations have a hard cap around 30s
- larger Lambda timeout values do not increase request time available to clients

What to do:

1. keep HTTP request handlers under ~30s end to end
2. move long work to async jobs/background processing when needed

This warning is noisy but expected unless timeout values are lowered.

---

## Quick API Probes

Use these to isolate backend state quickly:

- `GET /partnerships/dashboard`
- `GET /partnerships/partners`
- `GET /partnerships/google-sheets/status`
- `GET /partnerships/email/config`
- `GET /partnerships/email/sync/status`

If these load, frontend issues are usually rendering/state, not transport.

---

## Escalation Notes For New Devs

When handing off a bug, include:

- stage (`local/dev/staging/prod`)
- failing endpoint + payload
- exact UI error text
- backend log line/snippet
- expected vs actual behavior

This cuts debug time significantly.
