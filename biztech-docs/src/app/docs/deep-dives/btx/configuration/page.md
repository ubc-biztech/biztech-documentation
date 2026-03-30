---
title: 'BTX: Configuration & Development'
nextjs:
  metadata:
    title: 'BTX: Configuration & Development'
    description: 'Configuration constants, local development setup, common tasks, and tips for the BTX Stock Exchange.'
---


This page covers the configuration constants, local development setup, common admin tasks, and tips for working with BTX.

---

## Configuration Reference

All tunables are in `constants.js`:

| Constant | Value | Description |
|----------|-------|-------------|
| `INITIAL_CASH_BALANCE` | 2500 | Starting virtual cash |
| `MIN_PRICE` | 0.10 | Absolute minimum price |
| `DEFAULT_BASE_PRICE` | 1.00 | Base price without seed |
| `PRICE_SENSITIVITY_PER_SHARE` | 0.02 | Price move per net share |
| `TRANSACTION_FEE_BPS` | 200 | 2% transaction fee |
| `SEED_TO_PRICE_FACTOR` | 0.1 | Seed to base price conversion |
| `INVESTMENT_TO_SEED_FACTOR` | 0.0001 | Investment to seed conversion |
| `DRIFT_MAX_PCT_PER_TICK` | 0.015 | Max random price change per tick |
| `DRIFT_MEAN_REVERSION` | 0.12 | How quickly prices revert to equilibrium |

---

## Local Development

To run BTX locally:

```bash
cd serverless-biztechapp-1/services/btx
npx serverless offline --stage dev
```

This starts:
- HTTP API on port **4017**
- WebSocket on port **3005**
- DynamoDB Local on port **8000**

{% callout title="Dev mode" %}
When `IS_OFFLINE=true`, the service skips Cognito authentication and uses `local-user@btx` as the user ID. It also uses individual DynamoDB operations instead of transactions (for compatibility).
{% /callout %}

---

## Common Tasks

### Adding a New Project

Send a POST to the admin endpoint:

```json
POST /btx/admin/project
{
  "projectId": "team-alpha",
  "eventId": "kickstart",
  "ticker": "ALPHA",
  "name": "Team Alpha",
  "description": "A revolutionary fintech startup",
  "seedAmount": 5
}
```

### Applying a Phase Bump

```json
POST /btx/admin/phase-bump
{
  "projectId": "team-alpha",
  "bumpType": "MVP_SHIPPED"
}
```

### Checking a User's Portfolio

```
GET /btx/portfolio?eventId=kickstart
Authorization: (Cognito token)
```

---

## Tips for New Developers

- **Start with `constants.js`** and understand the tunables before diving into the logic
- **The `executeTrade` function** in `helpers.js` is the heart of the system, so read it carefully.
- **Price history** gets recorded for every price change, so charts always have data points even from drift
- **The frontend is a single large page** (`btx.tsx`), so use search (Ctrl+F) to find sections
- **WebSocket broadcasts** happen asynchronously after trades and use `.catch()` to avoid blocking the trade response
