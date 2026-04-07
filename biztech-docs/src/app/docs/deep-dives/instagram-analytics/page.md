---
title: 'Instagram Analytics Dashboard'
nextjs:
  metadata:
    title: 'Instagram Analytics Dashboard'
    description: 'Overview of the admin Instagram analytics page, metrics, backend flow, and token lifecycle.'
---

The Instagram Analytics dashboard gives execs a single admin view of account growth, post performance, and posting-time patterns.

---

## Where It Lives

- Admin route: `/admin/instagram-analytics`
- Sidebar label: **Instagram Analytics**
- Data source: backend endpoint `GET /instagram/analytics`

---

## What It Covers

- date-range filtering (`since`, `until`, presets)
- high-level summary cards (posts, followers, likes, views, reach, engagement)
- monthly rollups and trend lines
- top-performing post lists
- breakdowns by media type, weekday, and posting hour
- paginated post-level analytics table/cards

---

## Data Flow

1. Frontend page requests `/instagram/analytics` with optional date range.
2. Instagram service fetches profile/account/media insight data from Meta Graph API.
3. Service computes rollups, rates, top posts, and breakdowns.
4. Response is cached briefly in-memory and returned to frontend.
5. Dashboard renders cards/charts/tables with shared admin UI components.

---

## Key Files

| File | What it does |
| --- | --- |
| `bt-web-v2/src/pages/admin/instagram-analytics.tsx` | Full dashboard UI, filters, charts, top posts, and post-level table |
| `bt-web-v2/src/constants/tabs.ts` | Admin sidebar registration for the page |
| `serverless-biztechapp-1/services/instagram/handler.js` | Data fetching, aggregation, caching, token refresh/status logic |
| `serverless-biztechapp-1/services/instagram/serverless.yml` | Routes, schedule trigger, env vars, DynamoDB auth table |

---

## In This Section

{% quick-links %}

{% quick-link title="Dashboard Guide" icon="presets" href="/docs/deep-dives/instagram-analytics/dashboard/" description="Card/chart/table structure, metric definitions, and responsive layout behavior." /%}

{% quick-link title="Backend & Token Ops" icon="plugins" href="/docs/deep-dives/instagram-analytics/backend-token/" description="Endpoints, env vars, token storage precedence, and auto-refresh behavior." /%}

{% quick-link title="Troubleshooting" icon="warning" href="/docs/deep-dives/instagram-analytics/troubleshooting/" description="Common failures, quick checks, and smoke-test steps before deployment." /%}

{% /quick-links %}
