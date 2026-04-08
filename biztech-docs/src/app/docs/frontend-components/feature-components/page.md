---
title: Feature Components
nextjs:
  metadata:
    title: Feature Components
    description: Key feature components including NavBar, EventsDashboard, RegistrationTable, Event Forms, Companion, and LiveWall.
---

A walkthrough of the major feature components that make up the BizTech app, covering admin dashboards, event registration, the companion system, and more. {% .lead %}

---

## NavBar (src/components/NavBar/)

The main navigation component. Handles two modes:

- **Desktop:** Fixed 250px sidebar on the left with logo, nav tabs, user avatar, and logout button
- **Mobile:** Hamburger menu that opens a full-screen drawer

Navigation tabs are configured in `src/constants/navigation.ts` with two sets:
- **Admin tabs:** Manage Events, New Event, Manage Members, Statistics, Edit Companion, Emails
- **User tabs:** Home, Event Dashboard, Profile, Connections, Companion

The NavBar shows admin tabs only when the user has an `@ubcbiztech.com` email.

---

## EventsDashboard (src/components/EventsDashboard/)

The admin event dashboard at `/admin/event/[eventId]/[year]` uses a tab system:

| Component | Tab | Description |
| --- | --- | --- |
| `Tabs.tsx` | - | Dynamic tab switcher with Framer Motion animations |
| `DataTab.tsx` | Data Table | Full registration table with filtering, sorting, search |
| `TeamsTab.tsx` | Teams | Team management (create, reassign, view members) |
| `AnalyticsTab.tsx` | Analytics | Registration analytics with charts and timeline |

The `DataTab` wraps the `RegistrationTable` component which is a feature-rich data table with:
- Column sorting, filtering, and search
- Inline cell editing
- Mass status updates
- CSV export and email copying
- Expandable row details

---

## Registration Table (src/components/RegistrationTable/)

This is one of the most complex components. Key pieces:

| File | Purpose |
| --- | --- |
| `Table.tsx` | Main table component using TanStack Table |
| `TableHeader.tsx` | Header with search, filters, bulk actions, export |
| `Columns.tsx` | Column definitions with custom cell renderers |
| `Filters.tsx` | Filter dropdowns for registration status |
| `editCellPopUp/` | Inline editing popups for cells |
| `hooks/useRegistrationTable.ts` | Table state management hook |

---

## Event Forms (src/components/Events/)

The event creation and editing forms:

| Component | Purpose |
| --- | --- |
| `CreateEvent.tsx` | Full event creation form with dynamic registration questions |
| `EditEvent.tsx` | Edit existing event |
| `EventForm.tsx` | Shared form logic |
| `FormComponents/` | Reusable form fields (text, number, date, image upload, etc.) |
| `QuestionBuilder.tsx` | Dynamic registration question builder |

---

## Companion (src/components/Companion/)

The companion app shell:

| Component | Purpose |
| --- | --- |
| `CompanionHome.tsx` | Main companion layout with navigation |
| `QuestPage.tsx` | Quest progress tracking |
| `ConnectionsPage.tsx` | NFC-based connection scanning |
| `PartnerDatabase.tsx` | Browse partner/sponsor profiles |
| `BizCardComponents/` | Digital business card components |

---

## LiveWall (src/components/LiveWall/)

Real-time connection visualization:

| Component | Technology | Description |
| --- | --- | --- |
| `ConnectionWall.tsx` | react-force-graph-2d | 2D force-directed graph of connections |
| `3DConnectionWall.tsx` | Three.js / react-force-graph-3d | 3D immersive connection visualization |

Both connect via WebSocket to receive new connections in real-time and animate them onto the graph.

---

## Feature Modules (src/features/)

Feature modules are event-specific UIs that plug into the companion system. Each follows this pattern:

```
src/features/[event-name]/[year]/
├── index.tsx              ← Main companion component
├── assets/                ← Event-specific images/icons
├── components/            ← Event-specific components
│   ├── Profile.tsx
│   ├── Quests.tsx
│   ├── Connections.tsx
│   └── ...
└── ui/                    ← Event-specific UI primitives
```

The companion config in `src/constants/companions.ts` wires each feature module to its event:

```typescript
{
  eventID: "blueprint",
  year: 2026,
  component: Blueprint2026,           // The main component
  pageMap: {
    "profile": ProfilePage,           // /companion/blueprint/2026/profile
    "quests": QuestsPage,             // /companion/blueprint/2026/quests
    "connections": ConnectionsPage,    // /companion/blueprint/2026/connections
    "companies": CompaniesPage,        // /companion/blueprint/2026/companies
  },
  theme: {
    logo: "/assets/blueprint/logo.svg",
    primaryColor: "#75D450",
    // ...
  }
}
```
