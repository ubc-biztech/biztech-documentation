---
title: 'BTX: Price Mechanics'
nextjs:
  metadata:
    title: 'BTX: Price Mechanics'
    description: 'How prices work in the BTX Stock Exchange: base price, supply & demand, drift, phase bumps, and more.'
---


Understanding how prices work is key to understanding BTX. There are several forces that affect a project's price.

---

## 1. Base Price (from Seed Funding)

Every project starts with a base price calculated from its seed amount:

```
basePrice = max(0.10, 1.00 + seedAmount × 0.1)
```

So if a project has a seed of $5, its base price is $1.50.

---

## 2. Supply & Demand (Net Shares)

When people buy, the price goes up. When people sell, it goes down. The price formula is:

```
currentPrice = basePrice + netShares × PRICE_SENSITIVITY_PER_SHARE
```

Where:
- `netShares` = total bought minus total sold (can be negative)
- `PRICE_SENSITIVITY_PER_SHARE` = 0.02 (each net share moves the price by $0.02)

---

## 3. Trade Execution Price

Trades don't execute at the current price. Instead, they execute at the **average** of the price before and after the trade. This prevents large trades from getting unrealistically good prices:

```
executionPrice = (priceBefore + priceAfter) / 2
```

---

## 4. Transaction Fees

Every trade has a 2% fee (`TRANSACTION_FEE_BPS = 200` basis points):

- **Buying**: cost = executionPrice × shares × 1.02
- **Selling**: revenue = executionPrice × shares × 0.98

---

## 5. Random Drift

To make the charts look realistic (not just flat lines), BTX applies a random walk with mean reversion:

```javascript
// Random noise
const randomMove = price * (randomFactor * DRIFT_MAX_PCT_PER_TICK);

// Pull toward equilibrium (prevents runaway prices)
const meanReversionMove = -distance × DRIFT_MEAN_REVERSION;

newPrice = price + randomMove + meanReversionMove;
```

The "equilibrium price" is based on both the base price and net shares, so prices naturally settle around a fair value but still fluctuate.

{% callout title="Why drift?" %}
Without drift, the chart would only move when someone trades. Drift makes the experience feel more like a real stock market, with constant small price movements. It also means the market snapshot endpoint triggers price updates whenever it's called.
{% /callout %}

---

## 6. Phase Bumps

Admins can trigger **phase bumps** that instantly move a project's price. These simulate real-world events during Kickstart:

| Bump Type | Price Change |
|-----------|-------------|
| `KICKOFF_HYPE` | +15% |
| `VALIDATION_GOOD` | +10% |
| `VALIDATION_BAD` | -5% |
| `MVP_SHIPPED` | +30% |
| `USER_FEEDBACK_GOOD` | +10% |
| `USER_FEEDBACK_BAD` | -10% |
| `DEMO_QUALIFIER` | +50% |
| `DEMO_WINNER` | +100% |

Admins can also apply custom multipliers (`MULTIPLY`) or flat additions (`ADD`).

---

## 7. Investment Impact

When real investment money flows to a Kickstart team (via the investments feature), it also affects the BTX price:

```
seedDelta = investmentAmount × 0.0001  (INVESTMENT_TO_SEED_FACTOR)
```

This is a small effect, but it creates a nice link between the real funding and the simulated market.
