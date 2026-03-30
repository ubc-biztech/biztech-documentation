---
title: Frontend Architecture
nextjs:
  metadata:
    title: Frontend Architecture
    description: Overview of the bt-web-v2 Next.js frontend, covering the tech stack, project structure, Pages Router, and layout system.
---

A high-level overview of how the BizTech frontend is structured and the key architectural decisions behind it. {% .lead %}

---

## Tech Stack Overview

| Layer | Technology | Why We Use It |
| --- | --- | --- |
| **Framework** | Next.js 14 (Pages Router) | Server-side rendering, file-based routing, API routes |
| **Language** | TypeScript 5.5 | Type safety across the codebase |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS, fast prototyping, consistent design |
| **UI Components** | shadcn/ui + Radix UI | Accessible, composable primitives (dialog, select, tabs, etc.) |
| **Auth** | AWS Amplify Gen 2 (Cognito) | User authentication with email/password and Google OAuth |
| **State Management** | TanStack React Query v5 | Server state caching, automatic refetching, optimistic updates |
| **Forms** | react-hook-form + Zod | Performant forms with schema validation |
| **Charts** | Recharts | Responsive SVG charts for dashboards |
| **Animation** | Framer Motion | Page transitions, layout animations |
| **Icons** | Lucide React | Consistent icon set |
| **Hosting** | Vercel | Automatic deployments from Git |

---

## Project Structure

```
bt-web-v2/
├── amplify/                 # AWS Amplify Gen 2 config (auth + data)
├── public/                  # Static assets (images, fonts, videos, favicon)
├── src/
│   ├── components/          # Reusable React components (~180 files)
│   ├── constants/           # App-wide constants and config
│   ├── contexts/            # React Context providers
│   ├── features/            # Event-specific feature modules
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Core libraries (API client, utils, strategies)
│   ├── pages/               # Next.js pages (file-based routing)
│   ├── queries/             # TanStack React Query hooks
│   ├── styles/              # Global CSS
│   ├── types/               # Additional TypeScript type definitions
│   ├── util/                # Utility functions
│   ├── middleware.ts         # Auth middleware (runs on every request)
│   └── types.ts             # Core type definitions
├── tailwind.config.ts       # Tailwind theme (colors, fonts, breakpoints)
├── next.config.mjs          # Next.js configuration
├── components.json          # shadcn/ui configuration
└── amplify_outputs.json     # Generated Amplify config (Cognito pool IDs, etc.)
```

---

## Pages Router

We use Next.js **Pages Router** (`src/pages/`), not the newer App Router. This means:

- Each file in `src/pages/` becomes a route (e.g., `pages/login.tsx` → `/login`)
- Dynamic routes use brackets: `pages/admin/event/[eventId]/[year]/index.tsx` → `/admin/event/blueprint/2026`
- `_app.tsx` wraps every page (global providers, layout logic)
- `_document.tsx` customizes the HTML shell (fonts, metadata)

{% callout title="Why Pages Router?" %}
The project was started before App Router was stable. Pages Router is well-understood and works perfectly for our needs. A migration to App Router is not planned.
{% /callout %}

---

## Layout System

The layout is defined in `src/pages/layout.tsx` and applied conditionally in `_app.tsx`.

### Three Layout Modes

**1. No Layout** (full-screen pages with no sidebar):
- `/login`, `/signup`, `/membership`, `/verify`, `/forgot-password`
- `/btx` (full trading UI)
- Landing page

**2. Companion Layout** (dark theme, event-specific branding):
- `/companion/*` pages
- Uses event-specific fonts and colors from the companion config

**3. Standard Layout** (sidebar navigation + content area):
- Everything else (home, events, admin, profile, connections)
- Desktop: 250px sidebar on the left, content with responsive padding
- Mobile: Sidebar becomes a hamburger drawer

The standard layout includes:
- `ConfigureAmplify` which initializes AWS Amplify on the client
- `NavBar` with sidebar, user avatar, navigation tabs, logout
- Responsive padding: `pt-24` on mobile (for mobile header), `md:pl-[250px]` for sidebar offset

---

## Next Steps

- [Routing & Data Fetching](/docs/frontend-architecture/routing): Full routing map, data fetching patterns, API client, middleware, and state management
- [Styling & Configuration](/docs/frontend-architecture/styling): Tailwind setup, brand colors, breakpoints, key directories, the companion system, and environment config
