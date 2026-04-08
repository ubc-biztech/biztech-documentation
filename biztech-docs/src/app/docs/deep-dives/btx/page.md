---
title: 'BTX Stock Exchange'
nextjs:
  metadata:
    title: 'BTX Stock Exchange'
    description: 'In-depth guide to the BizTech Stock Exchange, a simulated stock market for Kickstart projects.'
---

**BTX** (BizTech Exchange) is a simulated stock market where event attendees trade virtual shares of Kickstart startup projects. Think of it like a mini stock exchange where each project is a "stock" with a ticker symbol, and attendees start with virtual cash to buy and sell shares.

Prices move based on supply and demand (how many people buy vs. sell), and there's even random "drift" to make the charts look realistic. It's a fun, gamified way to get attendees engaged with Kickstart projects.

---

## How It Works (The Big Picture)

1. **Admin creates projects** → Each Kickstart team becomes a "stock" with a ticker symbol (e.g., `$TEAM1`)
2. **Attendees get virtual cash** → Everyone starts with $2,500 in virtual money
3. **Attendees buy/sell shares** → Prices move based on net demand
4. **Real-world events affect prices** → Judges can trigger "phase bumps" (e.g., "MVP shipped" → price jumps 30%)
5. **Investments affect prices** → When real investment money flows to a team, their stock price rises
6. **Leaderboard** → Top traders are ranked by portfolio value

```
Admin creates projects → Attendees trade → Prices move → WebSocket broadcasts updates → Charts update live
```

---

## Key Files

### Backend (`services/btx/`)

| File             | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| `handler.js`     | All HTTP + WebSocket endpoint handlers                                       |
| `helpers.js`     | Core business logic: trade execution, price calculation, drift, broadcasting |
| `constants.js`   | Configuration: initial cash, price sensitivity, phase bumps, drift settings  |
| `serverless.yml` | API routes, DynamoDB table definitions, IAM permissions                      |

### Frontend

| File                              | What it does                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/pages/btx.tsx`               | Main exchange page (~2900 lines) with market view, trading UI, charts, portfolio               |
| `src/components/ui/btx-chart.tsx` | ShadCN-style Recharts wrapper (`ChartContainer`, `ChartTooltip`) used by the main page         |
| `src/pages/admin/btx.tsx`         | Admin panel for creating projects, applying phase bumps, seed updates                          |
| `src/lib/db-btx.ts`               | Frontend API client — all BTX fetch functions (`btxFetchMarketSnapshot`, `btxBuyShares`, etc.) |
| `src/hooks/useBtxExchange.ts`     | Custom hook for market data, WebSocket connection, trading actions                             |

---

## What's Covered in This Section

{% quick-links %}

{% quick-link title="Price Mechanics" icon="presets" href="/docs/deep-dives/btx/price-mechanics/" description="How prices work: base price, supply & demand, drift, phase bumps, and investment impact." /%}

{% quick-link title="Database & API" icon="plugins" href="/docs/deep-dives/btx/database-api/" description="All 6 DynamoDB tables, REST API endpoints, and WebSocket routes." /%}

{% quick-link title="Trade Execution & Frontend" icon="installation" href="/docs/deep-dives/btx/trade-execution/" description="Atomic trade flow, frontend components, price charts, and WebSocket hook." /%}

{% quick-link title="Configuration & Development" icon="theming" href="/docs/deep-dives/btx/configuration/" description="Tunable constants, local dev setup, common admin tasks, and tips." /%}

{% /quick-links %}
