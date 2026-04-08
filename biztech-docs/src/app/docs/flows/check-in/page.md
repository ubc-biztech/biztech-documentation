---
title: Event Check-In
nextjs:
  metadata:
    title: Event Check-In
    description: How attendees are checked in at BizTech events — QR scanning, manual check-in, and the backend update flow.
---

How attendees get checked in at events, what happens in the backend, and the admin tools involved. {% .lead %}

---

## Check-In Methods

There are two ways to check someone in:

### QR Code Scan

Each registered attendee receives a QR code in their confirmation email. At the event, an admin scans this QR using the scanner at `/admin/event/[eventId]/[year]` (the QR Scanner tab in the event dashboard).

The QR code encodes the attendee's email and event identifiers. When scanned, the frontend calls:

```
PUT /registrations/{email}/{fname}
{
  "eventID": "blueprint",
  "year": 2026,
  "registrationStatus": "checkedIn",
  "isPartner": false
}
```

### Manual Check-In

Admins can also click on an attendee row in the Data Table tab of the event dashboard and change their status to "checkedIn" directly. This calls the same `PUT` endpoint.

---

## Backend: updateRegistration()

**Handler:** `services/registrations/handler.js` → `updateRegistration`

When a check-in request arrives:

1. Receives `{ eventID, year, registrationStatus, ...otherFields }` in the body
2. Email comes from the path parameter
3. Calls `updateHelper()` with the update payload

### The updateHelper() Function

This is the core registration update function used by check-in, registration, and mass-update operations.

For a check-in specifically, `updateHelper()`:

1. Queries the event from `biztechEvents` to get capacity (`capac`) and event details
2. Counts current registrations via GSI `event-query`
3. Skips email sending for `checkedIn` status (emails are only sent for `registered` and `waitlist` statuses)
4. Writes the status update to `biztechRegistrations` using `db.updateDB()`

The capacity check still runs during check-in even though it's not relevant — the function is shared across all registration status changes.

---

## Registration Status Values

| Status             | Meaning                                        |
| ------------------ | ---------------------------------------------- |
| `incomplete`       | Started registration but hasn't paid yet       |
| `registered`       | Confirmed registration                         |
| `waitlist`         | Event at capacity, user is waitlisted          |
| `checkedIn`        | Checked in at the event                        |
| `cancelled`        | Registration cancelled                         |
| `accepted`         | Application accepted (application events only) |
| `acceptedPending`  | Accepted, free event, awaiting check-in        |
| `acceptedComplete` | Accepted + paid (application events only)      |
| `rejected`         | Application rejected                           |

Check-in changes the status from `registered` (or `accepted`/`acceptedComplete`) to `checkedIn`.

---

## What Happens After Check-In

Once checked in, the attendee can:

1. **Access the Companion App** — at `/companion/{eventId}/{year}`, which shows their profile, quests, and connections
2. **Use NFC tapping** — if the event has NFC cards, tapping another attendee's card triggers a connection via the interactions service
3. **Complete quests** — gamified tasks tracked in `biztechQuests`

---

## QR Code Generation

The QR code is generated and emailed during the initial registration, not at check-in. The flow:

1. User registers → `POST /registrations/` or `PUT /registrations/{email}/{fname}`
2. `updateHelper()` calls `SESEmailService.sendDynamicQR()` which generates an inline QR code image
3. The same email also includes a `.ics` calendar invite attachment via `sendCalendarInvite()`

QR emails are **not sent** for these statuses: `incomplete`, `rejected`, `accepted`, `checkedIn`, or partner registrations (`isPartner: true`).

---

## Admin Dashboard: Event Day View

The admin event dashboard at `/admin/event/[eventId]/[year]` has several tabs relevant to check-in:

| Tab        | Purpose                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| Data Table | Shows all registrations with real-time status, filtering, sorting, CSV export |
| QR Scanner | Camera-based QR scanner for rapid check-in                                    |
| Teams      | Team assignments (for events with team activities)                            |
| Analytics  | Registration timeline, capacity usage, demographic breakdowns                 |

The Data Table updates in real time as attendees are checked in, showing the current count of checked-in vs registered attendees.

---

## Key Files

| File                                                       | What it does                                         |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `services/registrations/handler.js` → `updateRegistration` | Backend check-in handler                             |
| `services/registrations/handler.js` → `updateHelper`       | Core update logic (capacity, emails, DynamoDB write) |
| `services/registrations/helpers/SESEmailService.js`        | QR code email generation                             |
| `src/components/QrScanner/`                                | Frontend QR scanner component                        |
| `src/pages/admin/event/[eventId]/[year]/index.tsx`         | Admin event dashboard                                |

---

## Related Pages

- [Registration System](/docs/systems/registration) — full registration lifecycle
- [Event Lifecycle](/docs/flows/event-lifecycle) — where check-in fits in the broader event flow
- [QR Code Check-In](/docs/deep-dives/nfc-cards/qr-checkin) — deeper QR implementation details
- [Companion System](/docs/deep-dives/companion) — what attendees use after check-in
