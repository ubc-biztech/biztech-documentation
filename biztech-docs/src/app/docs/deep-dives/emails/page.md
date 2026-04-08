---
title: Email Service
nextjs:
  metadata:
    title: Email Service
    description: How BizTech manages SES email templates and sends transactional emails.
---

BizTech uses Amazon SES for all transactional email — registration confirmations, QR codes, calendar invites, and admin-managed templates. {% .lead %}

---

## Two Email Systems

BizTech has two distinct email paths:

### 1. Transactional Emails (Registration Flow)

Sent automatically during event registration. These are **not** managed through the email templates service — they are hardcoded in the registration pipeline.

**Sent by:** `services/registrations/handler.js` → `updateHelper()` → `SESEmailService`

| Email type      | Sent when                                                              | Contents                             |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| QR code email   | Registration status is `registered`, `waitlist`, or `acceptedComplete` | Inline QR code image + event details |
| Calendar invite | Same as above                                                          | `.ics` file attachment for the event |

**Not sent for:** `incomplete`, `rejected`, `accepted`, `checkedIn`, or partner registrations (`isPartner: true`).

The `SESEmailService` class in `services/registrations/helpers/SESEmailService.js` has two methods:

- `sendDynamicQR(registrationData)` — generates a QR code containing the attendee's email and event ID, embeds it as an inline image
- `sendCalendarInvite(registrationData)` — builds an `.ics` calendar file with the event's start/end times, attaches it to the email

### 2. Email Templates (Admin CRUD)

A separate service for managing reusable SES email templates. Admins can create, edit, and list templates for ad-hoc email campaigns.

**Handler:** `services/emails/handler.js`
**Auth:** All endpoints require Cognito (admin-only — `@ubcbiztech.com` email check)

| Method   | Path                    | Handler               | Description                        |
| -------- | ----------------------- | --------------------- | ---------------------------------- |
| `GET`    | `/email/`               | `getEmailTemplate`    | Get a single template by name      |
| `GET`    | `/email/list`           | `listEmailTemplates`  | List all SES templates (paginated) |
| `POST`   | `/email/`               | `createEmailTemplate` | Create a new SES template          |
| `PATCH`  | `/email/{templateName}` | `updateEmailTemplate` | Update an existing template        |
| `DELETE` | `/email/{templateName}` | `deleteEmailTemplate` | Delete a template                  |

These endpoints are thin wrappers around the AWS SES API:

- `createEmailTemplate` → `ses.createTemplate()`
- `updateEmailTemplate` → `ses.updateTemplate()`
- `deleteEmailTemplate` → `ses.deleteTemplate()`
- `getEmailTemplate` → `ses.getTemplate()`
- `listEmailTemplates` → `ses.listTemplates()` with optional `NextToken` for pagination

No DynamoDB tables are involved — templates are stored entirely in SES.

---

## Partnerships Mass Email

The partnerships CRM has its own email system for sending bulk emails to sponsor contacts. This is separate from both the registration emails and the email template service.

**Handler:** `services/partnerships/handler.js`
**Endpoints:**

| Method   | Path                                         | Description                       |
| -------- | -------------------------------------------- | --------------------------------- |
| `GET`    | `/partnerships/email/config`                 | Get email configuration           |
| `GET`    | `/partnerships/email/templates`              | List partnership email templates  |
| `POST`   | `/partnerships/email/templates`              | Create partnership email template |
| `PATCH`  | `/partnerships/email/templates/{templateId}` | Update template                   |
| `DELETE` | `/partnerships/email/templates/{templateId}` | Delete template                   |
| `POST`   | `/partnerships/email/send`                   | Send bulk emails (120s timeout)   |

Partnership email templates support variable substitution (e.g., `{{companyName}}`, `{{contactName}}`).

---

## SNS Notifications

Besides email, the registration flow also publishes notifications to SNS, which are delivered to Slack:

```js
// services/registrations/handler.js → updateHelper()
await snsHelper.publish(message, topicArn)
```

This sends a Slack notification to organizers whenever someone registers or gets waitlisted.

---

## SES Configuration

SES email sending is configured in the service's `serverless.yml` IAM permissions:

```yaml
iamRoleStatements:
  - Effect: Allow
    Action:
      - ses:SendEmail
      - ses:SendRawEmail
    Resource: 'arn:aws:ses:us-west-2:*:identity/*'
```

The `ses:SendRawEmail` permission is needed for the calendar invite attachment (raw MIME email).

---

## Key Files

| File                                                | Purpose                                 |
| --------------------------------------------------- | --------------------------------------- |
| `services/emails/handler.js`                        | Email template CRUD endpoints           |
| `services/registrations/helpers/SESEmailService.js` | QR code + calendar invite email sending |
| `lib/sesHelper.js`                                  | SES client wrapper                      |
| `lib/sesV2Client.js`                                | SES v2 client initialization            |
| `lib/snsHelper.js`                                  | SNS notification publishing             |
| `services/partnerships/handler.js`                  | Partnership mass email endpoints        |

---

## Related Pages

- [Registration System](/docs/systems/registration) — where transactional emails are triggered
- [Event Check-In](/docs/flows/check-in) — QR codes from registration emails
- [Partnerships CRM: Email Ops](/docs/deep-dives/partnerships-crm/email-ops) — partnership email details
