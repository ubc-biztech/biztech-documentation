---
title: Prizes & Transactions
nextjs:
  metadata:
    title: Prizes & Transactions
    description: The prize catalog and credit transaction ledger services in the BizTech backend.
---

Two small backend services that support the companion app's gamification system: a prize catalog and a credit transaction ledger. {% .lead %}

---

## Prizes Service

A CRUD service for managing prizes that attendees can redeem with points earned through quests and interactions.

**Service:** `services/prizes/` (`biztechApi-prizes`)

### Endpoints

All endpoints require Cognito authentication:

| Method   | Path           | Handler  | Description     |
| -------- | -------------- | -------- | --------------- |
| `GET`    | `/prizes/`     | `getAll` | List all prizes |
| `POST`   | `/prizes/`     | `create` | Create a prize  |
| `PATCH`  | `/prizes/{id}` | `update` | Update a prize  |
| `DELETE` | `/prizes/{id}` | `del`    | Delete a prize  |

### Prize Data Model

Table: `biztechPrizes` (primary key: `id`)

| Field       | Type   | Required | Notes             |
| ----------- | ------ | -------- | ----------------- |
| `id`        | String | Yes      | Unique identifier |
| `name`      | String | Yes      | Display name      |
| `price`     | Number | Yes      | Cost in credits   |
| `imageHash` | String | No       | Image reference   |
| `links`     | List   | No       | Related links     |
| `createdAt` | Number | Auto     | Timestamp         |
| `updatedAt` | Number | Auto     | Timestamp         |

### How It Works

- `create` validates required fields (`id`, `name`, `price`), checks for duplicate `id`, and inserts with `createdAt`/`updatedAt` timestamps
- `update` validates the prize exists, then applies a partial update (only fields present in the body)
- `del` validates the prize exists, then deletes it
- `getAll` does a full table scan — there's no pagination since the prize catalog is always small

---

## Transactions Service

A credit transaction ledger that tracks points earned and spent through companion app activities.

**Service:** `services/transactions/` (`biztechApi-transactions`)

### Endpoints

Both endpoints require Cognito authentication:

| Method | Path             | Handler  | Description                            |
| ------ | ---------------- | -------- | -------------------------------------- |
| `GET`  | `/transactions/` | `getAll` | List transactions (optionally by user) |
| `POST` | `/transactions/` | `create` | Record a new transaction               |

### Transaction Data Model

Table: `biztechTransactions` (primary key: `id`)

| Field     | Type   | Required | Notes                                        |
| --------- | ------ | -------- | -------------------------------------------- |
| `id`      | String | Auto     | UUID (auto-generated)                        |
| `userId`  | Number | Yes      | User identifier                              |
| `reason`  | String | Yes      | Description of what earned/spent the credits |
| `credits` | Number | Yes      | Positive = earned, negative = spent          |

### How It Works

**Creating a transaction:**

1. Validates required fields (`userId`, `reason`, `credits`)
2. Checks the user exists in `biztechUsers` — returns 404 if not found
3. Generates a UUID (retries until unique — collision check against existing records)
4. If `credits < 0` (spending): checks the user has sufficient balance by scanning all their transactions and summing credits. Returns 202 (insufficient funds) if balance would go negative
5. Inserts the transaction record

**Querying transactions:**

- Without `userId` query param: full table scan, returns raw array
- With `?userId=`: filters transactions for that user, returns `{ count, transactions, totalCredits }` where `totalCredits` is the sum of all credit values

{% callout type="warning" title="Balance Is Computed, Not Stored" %}
There is no cached balance field. Every balance check scans all of a user's transactions and sums the `credits` values at query time. This works for the current scale but would need optimization for high-volume usage.
{% /callout %}

---

## How These Fit Into the Companion App

The prize and transaction services support the companion app's gamification loop:

```
Attend event → Check in → Complete quests → Earn credits → Browse prizes → Redeem
                                │                                    │
                                ▼                                    ▼
                    POST /transactions/              GET /prizes/
                    { credits: +100,                 (browse catalog)
                      reason: "quest-x" }
                                                     POST /transactions/
                                                     { credits: -500,
                                                       reason: "prize-y" }
```

Credits are earned through:

- Quest completion (scanning QR codes at booths, attending talks)
- Making connections (NFC taps)
- Other companion app activities

Credits are spent on prizes from the catalog.

---

## DynamoDB Tables

| Table                 | Service                  | Primary Key  | Notes                |
| --------------------- | ------------------------ | ------------ | -------------------- |
| `biztechPrizes`       | Prizes                   | `id`         | Prize catalog        |
| `biztechTransactions` | Transactions             | `id` (UUID)  | Credit ledger        |
| `biztechUsers`        | Transactions (read-only) | `id` (email) | User existence check |

---

## Key Files

| File                                   | Purpose                          |
| -------------------------------------- | -------------------------------- |
| `services/prizes/handler.js`           | Prize CRUD handlers              |
| `services/transactions/handler.js`     | Transaction create/list handlers |
| `services/prizes/serverless.yml`       | Prize service config             |
| `services/transactions/serverless.yml` | Transaction service config       |

---

## Related Pages

- [Companion System](/docs/deep-dives/companion) — where prizes and transactions are used
- [Quests](/docs/quests) — quest completion triggers credit transactions
- [Database Guide](/docs/database) — table reference
