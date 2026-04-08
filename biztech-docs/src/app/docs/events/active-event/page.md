---
title: Active Event Detection
nextjs:
  metadata:
    title: Active Event Detection
    description: How the BizTech app determines which event is currently active — the getActiveEvent endpoint, its implementation, and where it's used.
---

The active event is the event happening right now. The `getActiveEvent` endpoint lets the companion app and other features automatically discover it without requiring the user to select an event. {% .lead %}

---

## How Is the Active Event Determined?

**Endpoint:** `GET /events/getActiveEvent`
**Auth:** Public (no authentication required)
**Handler:** `services/events/handler.js` → `export const getActiveEvent`

The handler:

1. Generates the current time as an ISO 8601 string: `new Date().toISOString()`
2. Scans the `biztechEvents` table using the `event-overview` GSI with a DynamoDB `FilterExpression`:
   ```
   startDate <= :now AND endDate >= :now
   ```
3. Sorts matched events by `startDate` (using `dateComparer`)
4. Returns the first (earliest-starting) active event, or `null` if none match

```js
const nowISO = new Date().toISOString()
const filters = {
  FilterExpression: 'startDate <= :now AND endDate >= :now',
  ExpressionAttributeValues: {
    ':now': nowISO,
  },
}
let events = await db.scan(EVENTS_TABLE, filters, 'event-overview')
events.sort(dateComparer('startDate'))
const activeEvent = events.length > 0 ? events[0] : null
```

{% callout title="ISO string comparison" %}
The filter compares `startDate` and `endDate` as ISO 8601 strings against the current time. This works because ISO 8601 strings sort lexicographically in chronological order. Event `startDate` and `endDate` must be stored as ISO strings (not Unix timestamps) for this comparison to work correctly.
{% /callout %}

---

## Response

When an event is active:

```json
{
  "id": "blueprint",
  "year": 2026,
  "ename": "Blueprint 2026",
  "startDate": "2026-01-25T09:00:00.000Z",
  "endDate": "2026-01-25T18:00:00.000Z",
  ...full event record...
}
```

When no event is active:

```json
null
```

The endpoint always returns 200 — even when no event is active (returns `null`, not 404).

---

## Where It's Used

### Companion App

The companion app at `/companion/{event}/{year}` uses the active event to drive event-day features. The companion configuration in `src/constants/companion-events.ts` maps events to their layouts, colors, logos, and sub-pages.

### Profile Page

The profile page at `/profile/{id}` calls `getActiveEvent` to provide event context when viewing a user's profile during a live event:

```ts
// src/pages/profile/[id]/index.tsx
endpoint: '/events/getActiveEvent'
```

---

## Edge Cases

| Scenario                                        | Result                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| No events in the table                          | Returns `null`                                                      |
| All events have ended                           | Returns `null`                                                      |
| One event is active                             | Returns that event                                                  |
| Multiple events overlap in time                 | Returns the one with the earliest `startDate`                       |
| Event with `isPublished: false` but valid dates | Still returned — `getActiveEvent` does not filter by publish status |

{% callout type="warning" title="Unpublished events can be active" %}
The `getActiveEvent` endpoint does not check `isPublished`. If an unpublished event has dates that bracket the current time, it will be returned as the active event. This means an event could show up in the companion app before it's visible on the public events page.
{% /callout %}

---

## Performance Note

The handler scans the entire `biztechEvents` table (via the `event-overview` GSI) and applies the date filter. With a small number of events this is fine, but the scan is O(n) on total events. The DynamoDB `FilterExpression` does not reduce the read capacity consumed — all events are read and then filtered server-side.

---

## Key Files

| File                                                     | What it does                                             |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `services/events/handler.js` → `getActiveEvent`          | The handler implementation                               |
| `services/events/serverless.yml` → `eventGetActiveEvent` | Route definition (`events/getActiveEvent`, GET, no auth) |
| `src/pages/profile/[id]/index.tsx`                       | Frontend consumer of getActiveEvent                      |
| `src/constants/companion-events.ts`                      | Per-event companion configuration                        |
| `src/lib/companionHelpers.ts`                            | `getCompanionByEventIdYear()` — lookups companion config |

---

## Related Pages

- [Events System Overview](/docs/events) — event architecture and system dependencies
- [Events Service](/docs/services/events) — all event endpoints
- [Companion App](/docs/deep-dives/companion) — the companion experience
