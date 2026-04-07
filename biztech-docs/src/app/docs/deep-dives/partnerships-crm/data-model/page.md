---
title: 'Partnerships CRM: Data Model'
nextjs:
  metadata:
    title: 'Partnerships CRM Data Model'
    description: 'DynamoDB tables, indexes, record shapes, and relationship rules for Partnerships CRM.'
---

This page documents how CRM data is stored and how records connect.

---

## Dynamo Tables

| Table | Purpose |
| --- | --- |
| `biztechPartners{ENV}` | Partner profile records |
| `biztechPartnershipEvents{ENV}` | Partnerships-only event records |
| `biztechPartnerEventLinks{ENV}` | Partner-event involvement records |
| `biztechPartnerDocuments{ENV}` | Link-based document records |
| `biztechPartnerCommunications{ENV}` | Communication timeline entries |
| `biztechPartnershipsMeta{ENV}` | Integration status rows and email templates |

All resources are defined in `services/partnerships/serverless.yml`.

---

## Indexes

| Table | Index | Access pattern |
| --- | --- | --- |
| `biztechPartnerEventLinks` | `partner-query` | fetch all involvements for one partner |
| `biztechPartnerEventLinks` | `event-query` | fetch all involvements for one event-year |
| `biztechPartnerDocuments` | `partner-query` | fetch docs for one partner |
| `biztechPartnerCommunications` | `partner-query` | fetch comm timeline for one partner |

---

## Partner Record

Stored in `biztechPartners{ENV}`.

Core fields:

- `id` (uuid)
- `company` (required)
- `contactName`
- `email`
- `phone`
- `contactRole`
- `tier` (optional partner-level tier)
- `linkedin`
- `notes`
- `tags` (string array)
- `archived` (boolean)
- `createdAt`, `updatedAt`

Alumni behavior:

- alumni is represented by `alumni-partner` tag
- helper utilities keep this tag consistent when toggled

---

## Partnerships Event Record

Stored in `biztechPartnershipEvents{ENV}`.

Core fields:

- `id` (uuid)
- `name` (required)
- `year` (required)
- `outreachStartDate`, `startDate`, `endDate` (`YYYY-MM-DD`)
- `sponsorshipGoal` (number or null)
- `tierConfigs` (array of tier presets)
- `notes`
- `archived`
- `linkedMainEventId`, `linkedMainEventYear` (optional future bridge fields)
- `createdAt`, `updatedAt`

Tier config row shape:

- `tierKey` (normalized slug)
- `tierLabel` (display name)
- `defaultAmount` (optional)

---

## Partner-Event Link Record

Stored in `biztechPartnerEventLinks{ENV}`.

Core fields:

- `id` = `"{partnerId}::{eventId}"`
- `partnerId`
- `eventId`
- `eventYear`
- `eventIdYear` = `"{eventId};{eventYear}"`
- `status`
- `packageTier`
- `role`
- `amount`
- `followUpDate`
- `notes`
- `createdAt`, `updatedAt`

This record is the center of CRM tracking. Revenue, pipeline, and follow-up queue all read from here.

---

## Partner Document Record

Stored in `biztechPartnerDocuments{ENV}`.

Core fields:

- `id` (uuid)
- `partnerId`
- `eventId` (optional)
- `title`
- `type` (`general` default)
- `status` (`draft` default)
- `url`
- `fileName`
- `notes`
- `createdAt`, `updatedAt`

Current behavior:

- documents are references/links
- file binaries are not uploaded by this service

---

## Partner Communication Record

Stored in `biztechPartnerCommunications{ENV}`.

Core fields:

- `id` (uuid or deterministic sync id)
- `partnerId`
- `eventId` (optional)
- `subject`
- `summary`
- `channel`
- `direction` (`inbound` or `outbound`)
- `occurredAt`
- `followUpDate`
- `source` (`manual` or `email_sync`)
- `sourceProvider` (for sync provider, currently `gmail`)
- `externalMessageId`, `externalThreadId`
- `createdAt`, `updatedAt`

Email sync uses external ids to avoid duplicate inserts.

---

## Meta Table Rows

Stored in `biztechPartnershipsMeta{ENV}`.

Current row groups:

- Google Sheets sync status (`id=google_sheets_sync_status`)
- Email sync status (`id=partnerships_email_sync_status`)
- Email template rows (`entityType=partnerships_mass_email_template`)

---

## Status And Tier Normalization

Status rules:

- known aliases map to canonical keys
- custom statuses are allowed and normalized
- UI still shows readable labels for custom slugs

Tier rules:

- tiers normalize to slug keys
- event-level tier presets can define default amounts
- link-level tier can be preset or custom

---

## Relationship Rules And Guardrails

- One partner can link to many events.
- One event can link to many partners.
- One partner-event pair can exist only once.
- Event delete is blocked if link records exist.
- Archive is preferred over delete for active/history records.

---

## Reporting Inputs

Dashboard calculations read mainly from:

- partner table (active vs archived counts)
- event table (goals and event metadata)
- link table (pipeline/revenue/follow-up)
- communication table (action queue and timeline context)

Aggregation is implemented in `services/partnerships/dashboardReport.js`.
