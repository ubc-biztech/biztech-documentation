---
title: 'BTX: Database & API'
nextjs:
  metadata:
    title: 'BTX: Database & API'
    description: 'DynamoDB tables, API endpoints, and WebSocket routes for the BTX Stock Exchange.'
---


This page covers the database schema and API surface for BTX.

---

## Database Schema

BTX uses **6 DynamoDB tables**:

### `bizBtxProjects{ENV}`

Stores each tradeable project.

| Field | Type | Description |
|-------|------|-------------|
| `projectId` (PK) | String | Unique ID (usually = team ID) |
| `eventId` | String | Which event (e.g., "kickstart") |
| `ticker` | String | Stock ticker symbol (e.g., "TEAM1") |
| `name` | String | Display name |
| `basePrice` | Number | Base price from seed |
| `currentPrice` | Number | Current market price |
| `netShares` | Number | Total bought minus total sold |
| `seedAmount` | Number | Funding seed amount |
| `totalVolume` | Number | Total shares ever traded |
| `totalTrades` | Number | Number of trades |
| `isActive` | Boolean | Whether trading is open |

**GSI**: `byEvent` lets you query all projects for an event.

### `bizBtxAccounts{ENV}`

Virtual cash balances for each trader.

| Field | Type | Description |
|-------|------|-------------|
| `userId` (PK) | String | User's email |
| `cashBalance` | Number | Current cash (starts at $2,500) |
| `initialBalance` | Number | Starting amount (for P&L calculation) |

### `bizBtxHoldings{ENV}`

Current share holdings per user per project.

| Field | Type | Description |
|-------|------|-------------|
| `userId` (PK) | String | User's email |
| `projectId` (SK) | String | Which project |
| `shares` | Number | How many shares held |
| `avgPrice` | Number | Average purchase price |

**GSI**: `byProject` lets you query all holders of a project.

### `bizBtxTrades{ENV}`

Trade history log.

| Field | Type | Description |
|-------|------|-------------|
| `projectId` (PK) | String | Which project |
| `tradeId` (SK) | String | `ts#timestamp#uuid` |
| `userId` | String | Who traded |
| `side` | String | `"BUY"` or `"SELL"` |
| `shares` | Number | How many shares |
| `price` | Number | Execution price |
| `cashDelta` | Number | Cash change (negative for buys) |

### `bizBtxPrices{ENV}`

Price history for charts.

| Field | Type | Description |
|-------|------|-------------|
| `projectId` (PK) | String | Which project |
| `ts` (SK) | Number | Timestamp |
| `price` | Number | Price at this moment |
| `source` | String | What caused the change: `"TRADE"`, `"DRIFT"`, `"SEED_UPDATE"`, `"PHASE_BUMP"`, `"PROJECT_CREATE"` |

### `bizBtxSockets{ENV}`

Active WebSocket connections (same pattern as the Live Wall).

| Field | Type | Description |
|-------|------|-------------|
| `connectionId` (PK) | String | WS connection ID |
| `eventId` | String | Subscribed event |

---

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/btx/projects` | List all projects for an event |
| `GET` | `/btx/market/snapshot` | Get all projects with current prices (triggers drift) |
| `GET` | `/btx/trades?projectId=X` | Recent trades for a project |
| `GET` | `/btx/price-history?projectId=X` | Price history for charts |
| `GET` | `/btx/leaderboard` | Top and bottom traders |

### Authenticated Endpoints (Cognito)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/btx/market/buy` | Buy shares - body: `{ projectId, shares }` |
| `POST` | `/btx/market/sell` | Sell shares - body: `{ projectId, shares }` |
| `GET` | `/btx/portfolio` | Get current user's portfolio |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/btx/admin/project` | Create or update a project |
| `POST` | `/btx/admin/seed` | Update a project's seed amount |
| `POST` | `/btx/admin/phase-bump` | Apply a phase bump to a project |
| `POST` | `/btx/admin/investment-impact` | Apply investment impact to a project |

### WebSocket Routes

| Route | Handler | Description |
|-------|---------|-------------|
| `$connect` | `wsConnect` | Register connection |
| `$disconnect` | `wsDisconnect` | Clean up connection |
| `subscribe` | `wsSubscribe` | Subscribe to an event's updates |

**WebSocket messages (server → client):**

```json
{
  "type": "priceUpdate",
  "projectId": "team-alpha",
  "ticker": "ALPHA",
  "currentPrice": 2.45,
  "basePrice": 1.50,
  "netShares": 47,
  "marketCap": 115.15,
  "source": "TRADE",
  "updatedAt": 1234567890
}
```
