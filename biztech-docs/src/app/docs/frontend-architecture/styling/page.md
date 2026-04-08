---
title: Styling & Configuration
nextjs:
  metadata:
    title: Styling & Configuration
    description: Tailwind theme, brand colors, breakpoints, key directories, the companion system, and environment configuration.
---

How styling works in the BizTech frontend: our Tailwind theme, color system, responsive breakpoints, and how the companion system plugs event-specific UIs into the app. {% .lead %}

---

## Styling System

### Tailwind Configuration

Our custom Tailwind config (`tailwind.config.ts`) defines:

**Brand Colors:**

- `bt-blue-0` through `bt-blue-700`: Blues from light (#BDC8E3) to dark (#0B111E)
- `bt-green-0` through `bt-green-900`: Greens from light (#C6F4B4) to dark (#408F20)
- `bt-red-0` through `bt-red-600`: Reds for errors and destructive actions
- `bt-pink`: Accent pink (#FF9AF8)

**Custom Breakpoints:**

- `xxs: 360px`, `xs: 412px`, `mxs: 445px` for fine-grained mobile control
- Standard Tailwind breakpoints (sm, md, lg, xl, 2xl) also available

**Custom Fonts:**

- `font-urbanist`: Primary UI font
- `font-redhat`: Monospace accent font
- `font-bricolage` / `font-instrument`: Used in companion UIs

### shadcn/ui Components

We use [shadcn/ui](https://ui.shadcn.com/) for pre-built accessible components. These live in `src/components/ui/` and include: Button, Dialog, Select, Tabs, Toast, Table, Form, Input, Dropdown Menu, and more.

To add a new shadcn component:

```bash
npx shadcn-ui@latest add [component-name]
```

---

## Key Directories Explained

### `src/components/` (~180 files)

Organized by feature area:

| Directory            | What's Inside                                                |
| -------------------- | ------------------------------------------------------------ |
| `ui/`                | shadcn/ui primitives + custom UI atoms                       |
| `Common/`            | Shared components (SearchBar, Pagination, GenericCard)       |
| `NavBar/`            | Sidebar navigation and mobile drawer                         |
| `EventCard/`         | Event cards for the browsing page                            |
| `Events/`            | Event registration forms and editing                         |
| `EventsDashboard/`   | Admin event dashboard tabs (registrations, teams, analytics) |
| `RegistrationTable/` | Full-featured data table for event registrations             |
| `Companion/`         | Companion app shell and sub-page components                  |
| `Connections/`       | Connection history and statistics                            |
| `LiveWall/`          | 2D/3D real-time connection walls                             |
| `SignUpForm/`        | Membership signup form                                       |
| `QrScanner/`         | QR code scanning UI                                          |
| `NFCWrite/`          | NFC tag writing for admin                                    |

### `src/features/`

Event-specific feature modules that are loaded dynamically per event:

| Feature           | Events                                                      |
| ----------------- | ----------------------------------------------------------- |
| `blueprint/2025/` | Blueprint 2025 companion                                    |
| `blueprint/2026/` | Blueprint 2026 companion (profiles, quests, MBTI, partners) |
| `kickstart/2025/` | Kickstart 2025 (BTX exchange, teams, overview)              |
| `productX/2025/`  | ProductX 2025 companion                                     |

### `src/constants/`

Application-wide configuration:

| File               | What It Configures                              |
| ------------------ | ----------------------------------------------- |
| `companions.ts`    | Companion app routing, event-specific UI config |
| `navigation.ts`    | Sidebar navigation tabs                         |
| `registrations.ts` | Registration status labels and colors           |
| `breakpoints.ts`   | Responsive breakpoints                          |
| `companion.ts`     | Companion styles and localStorage keys          |

### `src/lib/`

Core business logic:

| File                    | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `db.ts`                 | API client (client-side + server-side)               |
| `config.ts`             | Environment URLs                                     |
| `utils.ts`              | Tailwind `cn()` helper, date formatting              |
| `registrations.ts`      | Registration helpers (fetch, update, status mapping) |
| `registrationStatus.ts` | Status colors, labels, and sorting config            |
| `companion.ts`          | Companion event validation and routing               |
| `queryProvider.tsx`     | React Query setup                                    |
| `recommendations.ts`    | Profile recommendation API calls                     |
| `registrationStrategy/` | Strategy pattern for different registration flows    |

---

## The Companion System

The companion is a mobile-first in-event experience that loads different UI per event. Here's how it works:

1. User visits `/companion` → middleware finds their latest registered event
2. Redirected to `/companion/[eventId]/[year]`
3. The companion config in `src/constants/companions.ts` maps each event to its feature module
4. Sub-pages (quests, connections, etc.) are loaded from the `pageMap` in the config

Each companion config defines:

- `eventID` and `year` to identify which event this is for
- `component` for the React component to render
- `pageMap` with URL slugs mapped to sub-page components
- `theme` with colors, logos, fonts, schedule data

{% callout title="Adding a New Companion" %}
To create a companion for a new event: (1) create a feature module in `src/features/`, (2) add a config entry in `src/constants/companions.ts` with the component and page map, (3) the routing handles the rest automatically.
{% /callout %}

---

## Environment Configuration

| Variable                      | Where        | Values                                                                |
| ----------------------------- | ------------ | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_REACT_APP_STAGE` | `.env.local` | `local` (local dev), `production` (prod), anything else → dev/staging |

This single variable controls:

- Which backend URL to call
- Which WebSocket URL to connect to
- Cookie domain settings
- Amplify configuration behavior

The mapping is defined in `src/lib/dbconfig.ts`:

```
local   → http://localhost:4000 (backend), http://localhost:3000 (frontend)
dev     → https://api-dev.ubcbiztech.com
staging → https://api-dev.ubcbiztech.com
prod    → https://api.ubcbiztech.com
```
