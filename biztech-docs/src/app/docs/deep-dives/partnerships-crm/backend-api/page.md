---
title: 'Partnerships CRM: Backend API & Validation'
nextjs:
  metadata:
    title: 'Partnerships CRM Backend API and Validation'
    description: 'Route groups, auth behavior, key payloads, and validation rules for the Partnerships CRM backend.'
---

This is the route contract used by `/admin/partnerships`.

---

## Auth Model

Most routes require admin auth (Cognito user pool authorizer).

Open route:

- `POST /partnerships/email/sync/ingest`

Even on the open ingest route, payload validation and domain checks still run.

---

## Endpoint Groups

### Dashboard + Export + Sync

| Method | Path                                 | Purpose                            |
| ------ | ------------------------------------ | ---------------------------------- |
| `GET`  | `/partnerships/dashboard`            | overview reporting payload         |
| `GET`  | `/partnerships/export`               | flat row export payload            |
| `GET`  | `/partnerships/google-sheets/status` | integration status and diagnostics |
| `POST` | `/partnerships/google-sheets/sync`   | run `push`, `pull`, or `merge`     |

Dashboard query params:

- `year`: `auto`, `all`, or explicit year
- `eventId`: optional event scope
- `includeArchived`: `true/false`
- `upcomingWindowDays`: follow-up window
- `actionLimit`: max action items

### Partners

| Method  | Path                                 |
| ------- | ------------------------------------ |
| `GET`   | `/partnerships/partners`             |
| `POST`  | `/partnerships/partners`             |
| `GET`   | `/partnerships/partners/{partnerId}` |
| `PATCH` | `/partnerships/partners/{partnerId}` |

### Partnerships Events

| Method   | Path                             |
| -------- | -------------------------------- |
| `GET`    | `/partnerships/events`           |
| `POST`   | `/partnerships/events`           |
| `GET`    | `/partnerships/events/{eventId}` |
| `PATCH`  | `/partnerships/events/{eventId}` |
| `DELETE` | `/partnerships/events/{eventId}` |

### Partner-Event Links

| Method   | Path                                        |
| -------- | ------------------------------------------- |
| `POST`   | `/partnerships/partners/{partnerId}/events` |
| `PATCH`  | `/partnerships/partner-events/{linkId}`     |
| `DELETE` | `/partnerships/partner-events/{linkId}`     |

### Partner Documents

| Method   | Path                                           |
| -------- | ---------------------------------------------- |
| `GET`    | `/partnerships/partners/{partnerId}/documents` |
| `POST`   | `/partnerships/partners/{partnerId}/documents` |
| `PATCH`  | `/partnerships/partner-documents/{documentId}` |
| `DELETE` | `/partnerships/partner-documents/{documentId}` |

### Partner Communications

| Method   | Path                                                     |
| -------- | -------------------------------------------------------- |
| `GET`    | `/partnerships/partners/{partnerId}/communications`      |
| `POST`   | `/partnerships/partners/{partnerId}/communications`      |
| `PATCH`  | `/partnerships/partner-communications/{communicationId}` |
| `DELETE` | `/partnerships/partner-communications/{communicationId}` |

### Email Ops + Gmail Sync

| Method   | Path                                         |
| -------- | -------------------------------------------- |
| `GET`    | `/partnerships/email/config`                 |
| `GET`    | `/partnerships/email/templates`              |
| `POST`   | `/partnerships/email/templates`              |
| `PATCH`  | `/partnerships/email/templates/{templateId}` |
| `DELETE` | `/partnerships/email/templates/{templateId}` |
| `POST`   | `/partnerships/email/send`                   |
| `GET`    | `/partnerships/email/sync/status`            |
| `POST`   | `/partnerships/email/sync/ingest`            |

---

## Validation Rules You Will Hit Most

- partner create requires `company`
- event create requires `name` and `year`
- date fields must be `YYYY-MM-DD`
- amount values must be numeric and non-negative
- duplicate partner-event links are blocked
- event delete is blocked while links still exist
- template save/send rejects unsupported merge tokens
- mail merge send enforces recipient cap
- sync ingest enforces actor email/domain and payload shape

---

## Email API Notes

`GET /partnerships/email/config` returns:

- sender identity from signed-in user
- max recipient cap
- allowed merge fields

`POST /partnerships/email/send` accepts recipient ids plus subject/body or template id, resolves merge fields per recipient, sends via SES, and writes communication rows for successful deliveries.

---

## Sync API Notes

### Google Sheets

`POST /partnerships/google-sheets/sync` body:

```json
{
  "mode": "push"
}
```

Modes: `push`, `pull`, `merge`

### Gmail ingest

`POST /partnerships/email/sync/ingest` body shape supports:

- `actorEmail`
- `entries` array (or `events` alias)
- each entry: sender/recipient fields, subject/summary, occurred timestamp, ids

The parser normalizes entry shape to one internal model before matching partners.

---

## Error Semantics

- malformed input -> 4xx with field hints
- missing path ids -> 4xx missing param response
- missing record -> not found response
- integration failures -> structured error message for UI
- missing local Dynamo table -> mapped setup-oriented error output

---

## Deployment Constraints

Two AWS limits matter for this service:

1. **Lambda function name length**

   - max is 64 characters
   - long Serverless function keys can overflow this when combined with service and stage
   - this service uses explicit short `name` values for long handlers in `serverless.yml`

2. **API Gateway timeout cap**
   - API Gateway limits synchronous Lambda integrations to ~30 seconds
   - setting `timeout: 60` or `timeout: 120` on HTTP handlers still results in a 30-second effective cap
   - keep user-facing HTTP work under that window or move long work to async/background flow

{% callout title="When adding new routes" %}
If a handler key is long, set an explicit short function `name` up front and keep it stage-safe.
{% /callout %}

---

## Main Files

- `services/partnerships/serverless.yml`
- `services/partnerships/handler.js`
- `services/partnerships/helpers.js`
- `services/partnerships/dashboardReport.js`
- `services/partnerships/massEmail.js`
- `services/partnerships/emailSync.js`
- `services/partnerships/googleSheets.js`
