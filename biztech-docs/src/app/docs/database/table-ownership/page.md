---
title: Table Ownership Map
nextjs:
  metadata:
    title: Table Ownership Map
    description: Which backend services own, read, and write each DynamoDB table.
---

A map of every DynamoDB table to the services that create, read, and write records in it. Use this to trace data flow when debugging or planning changes. {% .lead %}

---

## Core Tables

### biztechUsers

User accounts. Primary key: `id` (email).

| Service       | Access       | Notes                                                           |
| ------------- | ------------ | --------------------------------------------------------------- |
| **users**     | Read + Write | Owner. CRUD for user records                                    |
| payments      | Read + Write | Reads `isMember` for pricing tier; writes on membership payment |
| registrations | Read         | Reads user data for email sending                               |
| members       | Write        | `grantMembership` sets `isMember: true`                         |
| transactions  | Read         | Validates user existence before creating transaction            |

### biztechEvents

Events. Primary key: `id` + `year`.

| Service       | Access       | Notes                                            |
| ------------- | ------------ | ------------------------------------------------ |
| **events**    | Read + Write | Owner. CRUD, feedback config                     |
| registrations | Read         | Reads event for capacity check and email details |
| payments      | Read         | Reads `pricing` for checkout session             |
| users         | Read         | Reads for favourite event validation             |
| partnerships  | Read         | Reads event names for link hydration             |
| interactions  | Read         | Reads event dates for connection filtering       |

### biztechRegistrations

Event registrations. Primary key: `id` (email) + `eventID;year`.

| Service           | Access       | Notes                                                            |
| ----------------- | ------------ | ---------------------------------------------------------------- |
| **registrations** | Read + Write | Owner. Create, update, delete registrations                      |
| payments          | Read + Write | Reads for event payment; writes `registrationStatus` via webhook |
| events            | Read         | Counts registrations via GSI `event-query`                       |
| profiles          | Read + Write | `syncPartnerData` reads/writes registration data                 |

### biztechMembers2026

Club members. Primary key: `id` (email).

| Service      | Access       | Notes                                                 |
| ------------ | ------------ | ----------------------------------------------------- |
| **members**  | Read + Write | Owner. CRUD for member records                        |
| payments     | Write        | Creates member record on membership payment           |
| profiles     | Read + Write | Reads member for profile creation; writes `profileID` |
| interactions | Read         | Looks up `profileID` for connection handling          |
| bots         | Read + Write | Discord mapping reads member, writes `discordId`      |

### biztechProfiles

Profiles and connections. Primary key: `id` (`PROFILE#<id>`) + `eventID;year`.

| Service      | Access           | Notes                                                       |
| ------------ | ---------------- | ----------------------------------------------------------- |
| **profiles** | Read + Write     | Owner. Profile CRUD, company profiles                       |
| interactions | Read + Write     | Reads profiles for validation; writes `CONNECTION#` rows    |
| members      | Write (indirect) | `grantMembership` calls `createProfile()` which writes here |
| payments     | Write (indirect) | Webhook calls `createProfile()` which writes here           |

---

## Companion & Gamification Tables

### biztechTeams

Teams per event. Primary key: `eventID;year` + `id`.

| Service                  | Access       | Notes                                           |
| ------------------------ | ------------ | ----------------------------------------------- |
| **teams** (interactions) | Read + Write | Team CRUD                                       |
| btx                      | Read         | Maps `teamId → projectId` for investment impact |

### biztechQRs

QR codes per event. Primary key: `eventID;year` + `id`.

| Service               | Access       | Notes                                                   |
| --------------------- | ------------ | ------------------------------------------------------- |
| **qr** (interactions) | Read + Write | QR code CRUD                                            |
| profiles              | Write        | Creates QR entry when creating partner/company profiles |

### biztechQuests

Quest progress. Primary key: `id` (email) + `eventID;year`.

| Service                   | Access       | Notes                     |
| ------------------------- | ------------ | ------------------------- |
| **quests** (interactions) | Read + Write | Quest completion tracking |

### biztechQuizzes

Quiz results. Primary key: `id` + `eventID;year`.

| Service                    | Access       | Notes                       |
| -------------------------- | ------------ | --------------------------- |
| **quizzes** (interactions) | Read + Write | Quiz submission and results |

### biztechInvestments

Kickstart investments. Primary key: `id` (UUID) + `eventID;year`.

| Service                        | Access       | Notes               |
| ------------------------------ | ------------ | ------------------- |
| **investments** (interactions) | Read + Write | Investment tracking |

### biztechPrizes

Prize catalog. Primary key: `id`.

| Service    | Access       | Notes      |
| ---------- | ------------ | ---------- |
| **prizes** | Read + Write | Prize CRUD |

### biztechTransactions

Credit ledger. Primary key: `id` (UUID).

| Service          | Access       | Notes                               |
| ---------------- | ------------ | ----------------------------------- |
| **transactions** | Read + Write | Transaction create, balance queries |

---

## Event Feedback Table

### biztechEventFeedback

Feedback submissions. Primary key: `id` (UUID).

| Service    | Access       | Notes                                                |
| ---------- | ------------ | ---------------------------------------------------- |
| **events** | Read + Write | Submit and query feedback via GSI `event-form-query` |

---

## Connection & Real-Time Tables

### bizConnections

Legacy connection records.

| Service                        | Access       | Notes                  |
| ------------------------------ | ------------ | ---------------------- |
| **connections** (interactions) | Read + Write | Legacy connection CRUD |

### bizWallSockets

WebSocket connections for the live connection wall.

| Service          | Access       | Notes                     |
| ---------------- | ------------ | ------------------------- |
| **interactions** | Read + Write | Wall WebSocket management |

### bizLiveConnections

Recent connections for wall animation (with TTL).

| Service          | Access       | Notes                                                  |
| ---------------- | ------------ | ------------------------------------------------------ |
| **interactions** | Read + Write | Logged on each new connection, queried for wall replay |

### bizSockets / bizStickers / bizScores / bizFeedback / bizJudge

Judging and voting system tables.

| Service          | Access       | Notes                             |
| ---------------- | ------------ | --------------------------------- |
| **interactions** | Read + Write | Judging portal real-time features |

---

## BTX Tables

bizBtxProjects, bizBtxAccounts, bizBtxHoldings, bizBtxTrades, bizBtxPrices

All owned by the **btx** service. See [BTX Database & API](/docs/deep-dives/btx/database-api) for details.

### bizBtxSockets

WebSocket connections for real-time price updates. Owned by **btx**.

---

## Partnerships Tables

biztechPartners, biztechPartnerEventLinks, biztechPartnershipEvents, biztechPartnerDocuments, biztechPartnerCommunications, biztechPartnershipsMeta

All owned by the **partnerships** service. See [Partnerships Data Model](/docs/deep-dives/partnerships-crm/data-model) for details.

---

## Instagram Table

### biztechInstagramAuth

Single-record table storing the Instagram access token.

| Service       | Access       | Notes                     |
| ------------- | ------------ | ------------------------- |
| **instagram** | Read + Write | Token storage and refresh |

---

## Environment Suffix Reminder

All table names get the `ENVIRONMENT` suffix appended at runtime by `lib/db.js`. Production tables end with `PROD` (e.g., `biztechUsersPROD`). Dev and staging share the same tables (empty suffix).

---

## Related Pages

- [Database Guide](/docs/database) — table overview and suffix system
- [Schemas & Access Patterns](/docs/database/schemas) — detailed schemas, GSIs, and access patterns
- [DynamoDB Access Layer](/docs/backend-architecture/dynamodb) — how `lib/db.js` works
