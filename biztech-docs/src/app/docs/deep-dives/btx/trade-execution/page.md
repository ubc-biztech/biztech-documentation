---
title: 'BTX: Trade Execution & Frontend'
nextjs:
  metadata:
    title: 'BTX: Trade Execution & Frontend'
    description: 'How trades are executed atomically, frontend components, and the WebSocket hook for the BTX Stock Exchange.'
---


This page covers the core trade execution logic, the frontend components that make up the exchange UI, and the WebSocket hook that keeps everything in sync.

---

## Trade Execution (How a Buy/Sell Works)

This is the most important function in the entire service. Here's what happens when a user buys shares:

```
1. Validate inputs (positive shares, valid project)
2. Fetch project + ensure user account exists (creates one with $2,500 if new)
3. Get current holding (if any)
4. Calculate price impact:
   - startPrice = current price
   - endPrice = price after adding shares to netShares
   - executionPrice = average of start and end
5. Calculate cost: executionPrice × shares × (1 + 2% fee)
6. Check if user has enough cash
7. Execute atomically using DynamoDB TransactWriteItems:
   - Update project (new price, net shares, volume, trade count)
   - Update account (deduct cash)
   - Create trade record
   - Update holding (add shares, recalculate avg price)
8. Broadcast price update via WebSocket
9. Return trade details + updated portfolio
```

{% callout type="warning" title="Atomicity" %}
The trade uses `TransactWriteItems` to ensure all-or-nothing execution. If any part fails (e.g., insufficient cash), the entire trade rolls back. This prevents data inconsistencies like having shares without paying for them.

In **offline/dev mode**, individual operations are used instead (DynamoDB Local doesn't always support transactions), so be aware of this difference.
{% /callout %}

---

## Frontend Components

### Main Page (`btx.tsx`)

The BTX page is a full stock exchange interface with:

- **Market Overview**: Cards for each project showing price, change %, market cap
- **Price Charts**: Interactive Recharts line charts with gradient fills
- **Trading Panel**: Buy/sell interface with share quantity input
- **Portfolio View**: Your holdings, P&L, and cash balance
- **Leaderboard**: Top traders ranked by total portfolio value
- **Search**: Filter projects by name or ticker

### Price Chart Component

`BtxStockChart.tsx` is a reusable chart that takes an array of trades and renders a line chart:

```tsx
<BtxStockChart trades={recentTrades} ticker="ALPHA" />
```

It uses Recharts with:
- Gradient fill under the line (`linearGradient`)
- Auto-scaling Y axis with padding
- Time-formatted X axis
- Empty state message when no trades exist

### WebSocket Hook

The `useBtxExchange` hook handles:
- Fetching initial market data
- Opening/maintaining WebSocket connection
- Updating prices in real-time when `priceUpdate` messages arrive
- Providing `buy()` and `sell()` functions for trading

---

## Architecture Diagram

```
┌──────────────────────────────────────────────┐
│              Frontend (btx.tsx)                │
│                                                │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐ │
│  │ Market    │  │ Trading   │  │ Portfolio  │ │
│  │ Overview  │  │ Panel     │  │ View       │ │
│  └──────────┘  └───────────┘  └────────────┘ │
│       ↑              │              ↑         │
│       │         POST /buy or /sell  │         │
│       │              ↓              │         │
│  GET /market/   ┌─────────┐  GET /portfolio  │
│  snapshot       │ useBtx  │                   │
│       ↑         │Exchange │         ↑         │
│       │         │ (hook)  │         │         │
│       │         └────┬────┘         │         │
│       │              │ WebSocket    │         │
│       │              ↓              │         │
└───────┼──────────────┼──────────────┼─────────┘
        │              │              │
   ┌────┴──────────────┴──────────────┴────┐
   │          API Gateway (REST + WS)       │
   └────────────────────┬──────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │      BTX Service          │
          │                           │
          │  executeTrade()           │
          │  ├─ Calculate prices      │
          │  ├─ TransactWriteItems    │
          │  └─ broadcastPriceUpdate  │
          │                           │
          │  applyRandomDrift()       │
          │  applyPhaseBump()         │
          │  applySeedUpdate()        │
          └─────────────┬─────────────┘
                        │
               ┌────────┴────────┐
               │    DynamoDB     │
               │  ┌────────────┐ │
               │  │ Projects   │ │
               │  │ Accounts   │ │
               │  │ Holdings   │ │
               │  │ Trades     │ │
               │  │ Prices     │ │
               │  │ Sockets    │ │
               │  └────────────┘ │
               └─────────────────┘
```
