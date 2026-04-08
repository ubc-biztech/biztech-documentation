---
title: Events and Registrations
nextjs:
  metadata:
    title: Events and Registrations
    description: How registrations depend on events — capacity enforcement, waitlisting, dynamic questions, status flow, and the key construction.
---

Every registration is tied to an event. The event record controls capacity, waitlisting, pricing, registration questions, and email content. {% .lead %}

---

## How Registrations Link to Events

A registration is stored in `biztechRegistrations` with:

- **Partition key:** `id` = user email (e.g., `"alice@student.ubc.ca"`)
- **Sort key:** `eventID;year` = semicolon-joined string (e.g., `"blueprint;2026"`)

This means one user can have one registration per event, and all registrations for an event share the same sort key prefix.

```
biztechRegistrations
│
├─ PK: alice@student.ubc.ca  SK: blueprint;2026   → { registrationStatus: "registered" }
├─ PK: alice@student.ubc.ca  SK: kickstart;2025   → { registrationStatus: "checkedIn" }
├─ PK: bob@student.ubc.ca    SK: blueprint;2026   → { registrationStatus: "waitlist" }
└─ ...
```

The `event-query` GSI reverses this, indexing by `eventID;year` as the partition key to efficiently list all registrations for one event.

---

## What the Registration Handler Reads from the Event

When `updateHelper()` processes a registration, the first thing it does is fetch the event:

```js
const existingEvent = await db.getOne(eventID, EVENTS_TABLE, { year })
if (isEmpty(existingEvent))
  throw helpers.notFoundResponse('Event', eventID, year)
```

Then it uses these fields:

| Event Field                                        | How It's Used                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `capac`                                            | Compared with `registeredCount` to determine if the event is full   |
| `registrationQuestions`                            | Questions with `participantCap` have per-choice capacity tracked    |
| `pricing.members`                                  | Member price determines if the event is free or paid                |
| `pricing.nonMembers`                               | Non-member price for non-BizTech users                              |
| `ename`                                            | Used in email templates (confirmation, waitlist, acceptance emails) |
| `startDate`, `endDate`, `elocation`, `description` | Included in email templates and calendar invite generation          |
| `imageUrl`                                         | Used as Stripe product image for paid events                        |

---

## Capacity and Waitlisting

The capacity check happens inside `updateHelper()` in `services/registrations/handler.js`:

```
1. Fetch event → get event.capac
2. Call getEventCounts(eventID, year) → count registrations
3. If registeredCount >= event.capac → set status to "waitlist"
```

### How getEventCounts() Works

**File:** `services/registrations/helpers.js`

1. Queries the `biztechRegistrations` table using the `event-query` GSI with `eventID;year`
2. Iterates all registrations, counting by status (excludes partners):
   - `registeredCount` — status is `"registered"`
   - `checkedInCount` — status is `"checkedIn"`
   - `waitlistCount` — status is `"waitlist"`
3. Returns the counts

{% callout title="Only attendees count toward capacity" %}
Partner registrations (`isPartner: true`) are excluded from the capacity count. They do not count toward `capac` and are never waitlisted.
{% /callout %}

### Dynamic Workshop Caps

If an event's `registrationQuestions` include questions with a `participantCap` field, `getEventCounts()` also tallies how many registrants selected each option. This enables per-workshop capacity tracking — though the backend enforcement is currently commented out in `updateHelper`.

---

## Registration Status Flow

| Status             | When It's Set                                   | Meaning                                      |
| ------------------ | ----------------------------------------------- | -------------------------------------------- |
| `registered`       | Default on successful creation                  | User is confirmed for the event              |
| `waitlist`         | When `registeredCount >= capac`                 | Event is full, user is on waitlist           |
| `incomplete`       | After Stripe session created but before payment | User has a checkout link but hasn't paid     |
| `checkedIn`        | Admin marks attendance (QR scan or manual)      | User arrived at the event                    |
| `cancelled`        | Admin cancels the registration                  | Registration is cancelled                    |
| `accepted`         | Application-based events: admin approves        | User is accepted (paid event: needs payment) |
| `acceptedPending`  | Application-based events: accepted + free event | Accepted, no payment needed                  |
| `acceptedComplete` | Stripe webhook after accepted user pays         | Accepted and payment confirmed               |
| `rejected`         | Application-based events: admin rejects         | Not accepted                                 |

### Application-Based Event Flow

When `event.isApplicationBased` is `true`, the registration flow changes:

```
Register → "registered" (pending review)
   │
   ├─ Admin accepts + event is free → "acceptedPending"
   ├─ Admin accepts + event is paid → "accepted" → user pays → "acceptedComplete"
   └─ Admin rejects → "rejected"
```

The acceptance logic checks pricing:

```js
const pricing = isMember
  ? eventExists.pricing?.members ?? 0
  : eventExists.pricing?.nonMembers ?? 0

if (pricing === 0) {
  data.registrationStatus = 'acceptedPending'
}
```

---

## Registration Data Structure

Each registration record includes:

| Field                | Type    | Source                                                          |
| -------------------- | ------- | --------------------------------------------------------------- |
| `id`                 | String  | User email (PK)                                                 |
| `eventID;year`       | String  | Event key (SK)                                                  |
| `registrationStatus` | String  | One of the statuses above                                       |
| `isPartner`          | Boolean | `true` for partner registrations                                |
| `dynamicResponses`   | Object  | Answers to event `registrationQuestions`, keyed by `questionId` |
| `points`             | Number  | Points earned at the event                                      |
| `checkoutLink`       | String  | Stripe checkout URL (paid events, pre-payment)                  |
| `createdAt`          | Number  | Registration timestamp                                          |

### Dynamic Responses

When a user fills out the registration form, their answers to `registrationQuestions` are stored in `dynamicResponses`:

```json
{
  "dynamicResponses": {
    "q-why-attend": "I want to learn about product design",
    "q-workshop": "UX Research"
  }
}
```

The keys match the `questionId` values from `event.registrationQuestions`.

---

## Frontend Registration Form

**Attendees:** `src/components/Events/AttendeeEventRegistrationForm.tsx`
**Partners:** `src/components/Events/PartnerEventRegistrationForm.tsx`
**Page:** `src/pages/event/[eventId]/[year]/register/index.tsx`

The registration form is built from two sources:

1. **Standard fields** (hardcoded): email, first name, last name, year level, faculty, major, pronouns, dietary restrictions, "how did you hear about us"
2. **Dynamic fields** (from `event.registrationQuestions`): rendered based on question `type` — `TEXT`, `SELECT`, `CHECKBOX`, `UPLOAD`, `WORKSHOP_SELECTION`, `SKILLS`

### Registration Strategy

The registration page uses a strategy pattern (`RegistrationStateOld`) to handle different event states (upcoming, current, past, sold out) with different UI states.

---

## Admin Dashboard: Viewing Registrations

**Endpoint:** `GET /events/{id}/{year}?users=true`
**Handler:** `services/events/handler.js` → `get`

When the admin dashboard fetches event data with `?users=true`:

1. Scans all registrations for the event via the `event-query` GSI
2. Collects all unique user emails
3. Batch-gets user records from `biztechUsers` (up to 100 per batch)
4. Merges each user record with their `registrationStatus`
5. Returns the enriched list in the response

This powers the Data Table tab in the admin event dashboard, showing all registrants with their profile data and registration status.

---

## Key Files

| File                                                          | Purpose                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| `services/registrations/handler.js`                           | Registration CRUD, `updateHelper()` with capacity check |
| `services/registrations/helpers.js`                           | `getEventCounts()`                                      |
| `services/events/handler.js` → `get`                          | `?users=true` for admin dashboard                       |
| `src/pages/event/[eventId]/[year]/register/index.tsx`         | Attendee registration page                              |
| `src/pages/event/[eventId]/[year]/register/partner/index.tsx` | Partner registration page                               |
| `src/components/Events/AttendeeEventRegistrationForm.tsx`     | Attendee registration form                              |
| `src/components/Events/PartnerEventRegistrationForm.tsx`      | Partner registration form                               |
| `src/queries/registrations.ts`                                | Registration fetch hooks                                |

---

## Related Pages

- [Events System Overview](/docs/events) — event architecture
- [Event Data Model](/docs/events/data-model) — `capac`, `registrationQuestions`, `pricing` fields
- [Event Pricing and Payments](/docs/events/pricing-payments) — how pricing connects to Stripe
- [Event Check-In](/docs/flows/check-in) — how check-in updates registration status
- [Registration System](/docs/systems/registration) — detailed registration system docs
