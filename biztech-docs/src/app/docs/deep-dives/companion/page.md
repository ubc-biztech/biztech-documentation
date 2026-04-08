---
title: Companion App
nextjs:
  metadata:
    title: Companion App
    description: Mobile-first event experience app for attendees — quests, connections, partner directory, and schedule.
---

# Companion App

The Companion is a **mobile-first, dark-themed event app** that attendees use during BizTech events (Blueprint, Kickstart, ProductX). It provides profile pages, quests, NFC-based networking, partner directories, schedules, and post-event recaps.

---

## Architecture

```
Attendee (mobile browser)
    │
    ▼
/companion/[event]/[year]
    │
    ├── CompanionLayout       ← dark theme, email gate, header/nav
    │     └── ChildComponent  ← event-specific feature module
    │
    ├── Backend APIs
    │     ├── /interactions/   ← connections, booth visits, search
    │     ├── /quests/         ← quest progress tracking
    │     ├── /registrations/  ← user registration lookup
    │     └── /profiles/       ← attendee profiles
    │
    └── DynamoDB
          ├── biztechRegistrations
          ├── biztechProfiles
          ├── bizConnections
          ├── biztechNFCScans
          └── bizQuests
```

---

## Routing

All companion routes live under `/companion`:

| Route                                 | File                                               | Purpose                                                            |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `/companion`                          | `src/pages/companion/index.tsx`                    | Entry point — redirects to latest registered event                 |
| `/companion/[event]/[year]`           | `src/pages/companion/[event]/[year]/index.tsx`     | Main companion home for a specific event                           |
| `/companion/[event]/[year]/[...slug]` | `src/pages/companion/[event]/[year]/[...slug].tsx` | Dynamic sub-pages (quests, profile, companies, etc.)               |
| `/companion/scan/[qrId]`              | `src/pages/companion/scan/[qrId]/index.tsx`        | QR/NFC scan handler — records connections, booth visits, workshops |
| `/companion/redirect/[data]`          | `src/pages/companion/redirect/[data]/index.tsx`    | Judge assignment redirect (base64-encoded data)                    |
| `/companion/reset`                    | `src/pages/companion/reset.tsx`                    | Clears localStorage companion data                                 |

The entry page calls `getLatestRegisteredEvent()` to auto-redirect returning attendees.

---

## Event Registry

Each companion-enabled event is defined in `src/constants/companion-events.ts`:

```ts
const events: Event[] = [
  {
    id: 'blueprint',
    year: 2026,
    ChildComponent: BlueprintCompanion,
    subPages: ['profile', 'quests', 'companies', 'connections', 'discover'],
    options: { logo, colors, dates, headerStyle },
    activeUntil: new Date('2026-02-15'),
  },
  // ...
]
```

Each entry defines:

- **`ChildComponent`** — the React component for the event's home page (from `src/features/`)
- **`subPages`** — available sub-routes within the companion
- **`options`** — branding, colors, logos, date range
- **`activeUntil`** — when the companion expires

---

## Layout & Components

### CompanionLayout

**File:** `src/components/Companion/CompanionLayout.tsx`

Wraps all companion pages. Responsibilities:

- Dark theme styling
- Email input gate (if user not authenticated via Cognito, prompts for email)
- Stores email in localStorage (`COMPANION_EMAIL_KEY`)
- Renders header, nav, and schedule
- Provides `UserRegistrationContext` to children

### Shared Components (`src/components/Companion/`)

| Component           | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `CompanionHome.tsx` | Main home screen with animated stats counter     |
| `Schedule.tsx`      | Event schedule display                           |
| `Filter.tsx`        | Pill-style tag filter bar                        |
| `FeedbackForm.tsx`  | Embedded iframe for event feedback               |
| `SearchBar.tsx`     | Text search input                                |
| `LogoutButton.tsx`  | Clear companion session                          |
| `PageError.tsx`     | Error fallback display                           |
| `navigation/`       | `NavBarContainer`, popup menu, side nav, top nav |

---

## Event-Specific Feature Modules

Each major event has its own feature folder under `src/features/`:

| Event                   | Features                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Blueprint 2025/2026** | Profile, Quests, Companies, Connections, MBTI Quiz, Discover (personality matching) |
| **Kickstart 2025**      | Teams (create/join), Invest                                                         |
| **ProductX 2025**       | Custom companion UI                                                                 |

These modules render as the `ChildComponent` inside `CompanionLayout` and define the sub-page content for each event.

---

## Backend Services

The companion has no dedicated backend service. It relies on:

### Interactions Service (`services/interactions/`)

| Method | Path                         | Auth      | Purpose                                                  |
| ------ | ---------------------------- | --------- | -------------------------------------------------------- |
| `POST` | `/interactions/`             | Cognito   | Record a connection, booth visit, or workshop attendance |
| `POST` | `/interactions/search`       | Cognito   | OpenSearch-powered attendee/company search               |
| `GET`  | `/interactions/journal/{id}` | Cognito   | Check if a specific connection exists                    |
| `GET`  | `/interactions/journal/`     | Cognito   | Get all connections for current user                     |
| `GET`  | `/interactions/wall`         | WebSocket | Live Wall snapshot data                                  |

DynamoDB tables: `bizConnections`, `biztechNFCScans`, `biztechProfiles`, `bizLiveConnections`, `bizWallSockets`

### Quests Service (`services/quests/`)

| Method  | Path                                          | Auth    | Purpose                          |
| ------- | --------------------------------------------- | ------- | -------------------------------- |
| `PATCH` | `/quests/{event_id}/{year}`                   | Cognito | Update quest progress            |
| `GET`   | `/quests/{event_id}/{year}`                   | Cognito | Get user's quests for an event   |
| `GET`   | `/quests/event/{event_id}/{year}`             | Cognito | Get all quests for event (admin) |
| `GET`   | `/quests/kiosk/{event_id}/{year}/{profileId}` | Cognito | Kiosk-mode quest view            |

DynamoDB table: `biztechQuests`

---

## Data Flow: QR/NFC Scan

When an attendee scans a QR code or taps an NFC card:

1. Mobile browser opens `/companion/scan/[qrId]`
2. Page parses `qrId` to determine scan type (`CONNECTION_EVENT`, `BOOTH_EVENT`, `WORKSHOP_EVENT`)
3. POSTs to `/interactions/` with the scan data
4. Backend creates a connection record in `bizConnections`
5. If quest tracking is enabled, also updates `biztechQuests` progress
6. If the Live Wall is active, the new connection appears in real time via WebSocket

---

## Context & State

**UserRegistrationContext** (`src/contexts/companion/UserRegistrationContext.tsx`):

- Provides `userRegistration` data to all companion components
- Populated by `CompanionLayout` on mount via `/registrations?email=...`
- Used by quests, profile, and access-gating logic

**localStorage keys** (from `src/constants/companion.ts`):

- `COMPANION_EMAIL_KEY` — attendee's email
- `COMPANION_PROFILE_ID_KEY` — attendee's profile ID

---

## Helpers

**File:** `src/lib/companionHelpers.ts`

| Function                      | Purpose                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `getCompanionByEventIdYear()` | Lookup companion config from the event registry                                         |
| `checkUserRegistration()`     | Validate user has a registration with valid status                                      |
| `hasValidCompanionAccess()`   | Check registration status (`REGISTERED`, `ACCEPTED_COMPLETE`, `CHECKED_IN`, `ACCEPTED`) |
| `getLatestRegisteredEvent()`  | Find user's most recent companion-enabled event for auto-redirect                       |

---

## Key Files

| File                                                 | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `src/constants/companion-events.ts`                  | Central event registry — all companion-enabled events    |
| `src/constants/companion.ts`                         | Style constants, localStorage keys, event type constants |
| `src/components/Companion/CompanionLayout.tsx`       | Layout wrapper with auth gate                            |
| `src/components/Companion/CompanionHome.tsx`         | Home screen with stats                                   |
| `src/lib/companionHelpers.ts`                        | Access validation and event lookup                       |
| `src/contexts/companion/UserRegistrationContext.tsx` | Registration data context                                |
| `src/pages/companion/index.tsx`                      | Entry redirect page                                      |
| `src/pages/companion/[event]/[year]/index.tsx`       | Main event companion page                                |
| `src/pages/companion/scan/[qrId]/index.tsx`          | QR/NFC scan handler                                      |
| `src/features/blueprint/`                            | Blueprint event feature module                           |
| `src/features/kickstart/`                            | Kickstart event feature module                           |
| `services/interactions/handler.js`                   | Connection + search endpoints                            |
| `services/quests/handler.js`                         | Quest tracking endpoints                                 |

---

## Related Pages

- [NFC & QR Overview](/docs/deep-dives/nfc-cards) — NFC card writing and connections
- [Live Wall](/docs/deep-dives/live-wall) — real-time visualization fed by companion connections
- [Event Lifecycle](/docs/flows/event-lifecycle) — where the companion fits in the event flow
- [Registration](/docs/systems/registration) — registration status that gates companion access
