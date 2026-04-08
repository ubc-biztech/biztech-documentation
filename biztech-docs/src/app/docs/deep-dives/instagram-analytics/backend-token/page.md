---
title: 'Instagram Analytics: Backend & Token Operations'
nextjs:
  metadata:
    title: 'Instagram Analytics Backend and Token Ops'
    description: 'Service endpoints, computed analytics payload, token storage, and scheduled refresh behavior.'
---

This page covers the Instagram service implementation, API contract, and token lifecycle.

---

## Service Endpoints

| Method     | Path                       | Auth     | Purpose                           |
| ---------- | -------------------------- | -------- | --------------------------------- |
| `GET`      | `/instagram/analytics`     | 🔓       | Return computed analytics payload |
| `POST`     | `/instagram/token/refresh` | 🔓       | Manual long-lived token refresh   |
| `GET`      | `/instagram/token/status`  | 🔓       | Token source + expiry status      |
| `schedule` | `rate(1 day)`              | Internal | Automatic refresh check           |

`/instagram/analytics` supports optional query params:

- `since` (`YYYY-MM-DD`)
- `until` (`YYYY-MM-DD`)

---

## Environment Variables

| Variable                | Default                             | Description                                        |
| ----------------------- | ----------------------------------- | -------------------------------------------------- |
| `IG_ACCESS_TOKEN`       | `""`                                | Primary fallback token source                      |
| `IG_DEFAULT_START_DATE` | `2025-08-01`                        | Default `since` when omitted                       |
| `IG_REFRESH_LEAD_DAYS`  | `10`                                | Days-before-expiry threshold for scheduled refresh |
| `INSTAGRAM_GRAPH_BASE`  | `https://graph.instagram.com/v25.0` | Graph API base override                            |

> **Note:** `INSTAGRAM_GRAPH_BASE` is not configured in `serverless.yml` by default — the handler falls back to `https://graph.instagram.com/v25.0` if this variable is not set.

---

## Token Source Precedence

When handling requests, the service resolves token in this order:

1. `biztechInstagramAuth{ENV}` table (`id = primary`)
2. environment token (`IG_ACCESS_TOKEN` / `INSTAGRAM_ACCESS_TOKEN`)
3. missing token -> `500` with clear message

---

## Auto-Refresh Logic

Scheduled function runs daily and:

1. checks current token source + stored expiry
2. skips refresh if token is not near expiry
3. refreshes with `refresh_access_token` when due
4. stores updated token + `expiresAt` + `refreshedAt` in DynamoDB
5. clears in-memory analytics cache

Manual refresh endpoint follows the same refresh+store path.

---

## Analytics Payload (High Level)

`GET /instagram/analytics` returns:

- account metadata
- selected `since` / `until`
- `totals` object (posts, likes, views, rates, averages)
- account insight series (`reach`, `follower_count`)
- `monthly` rollups
- `mediaTypeBreakdown`, `weekdayBreakdown`, `hourBreakdown`
- `topPosts` grouped by ranking metric
- full `posts` list with raw + derived metrics

In-memory cache:

- TTL: 5 minutes
- keyed by `since:until`

---

## DynamoDB Table

Table: `biztechInstagramAuth{ENVIRONMENT}`

Stored token record fields:

- `id` (`primary`)
- `accessToken`
- `expiresIn`
- `expiresAt`
- `refreshedAt`
- `source`
