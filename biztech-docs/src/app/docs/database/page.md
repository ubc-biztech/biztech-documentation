---
title: Database Guide
nextjs:
  metadata:
    title: Database Guide
    description: DynamoDB overview, environment suffix system, and table reference.
---

Everything you need to know about our DynamoDB tables: how they're structured and how the environment suffix system works. {% .lead %}

---

## Overview

BizTech uses **Amazon DynamoDB** as its primary database. DynamoDB is a NoSQL key-value and document database, so there are no SQL queries, joins, or migrations. Data is organized into tables with primary keys and optional sort keys.

{% callout title="Key Concept for Newcomers" %}
DynamoDB is fundamentally different from relational databases (PostgreSQL, MySQL). There are no tables with columns. Instead, each item is a JSON document with a primary key. You can store different shapes of data in the same table. Think of it as a giant, fast key-value store.
{% /callout %}

---

## Environment Suffix System

All table names automatically get the `ENVIRONMENT` variable appended at runtime. This is handled by `lib/db.js`, so you never need to add the suffix manually.

| Environment | Suffix | Example Table Name |
| --- | --- | --- |
| Dev | `""` (empty) | `biztechEvents` |
| Staging | `""` (empty) | `biztechEvents` |
| Production | `"PROD"` | `biztechEventsPROD` |

{% callout type="warning" title="Dev and Staging Share Tables" %}
Because both dev and staging have an empty suffix, they read from the same tables. Be careful with destructive operations in staging since they affect dev too.
{% /callout %}

---

## Table Reference

### Core Tables

| Table | Primary Key (PK) | Sort Key (SK) | Description |
| --- | --- | --- | --- |
| `biztechEvents` | `id` (string) | `year` (number) | All events |
| `biztechUsers` | `id` (string = email) | - | User accounts |
| `biztechRegistrations` | `id` (string = email) | `eventID;year` (string) | Event registrations |
| `biztechMembers2026` | `id` (string = email) | - | Club members |
| `biztechProfiles` | `id` (string) | `eventID;year` (string) | Profiles + connections |
| `biztechTeams` | `eventID;year` (string) | `id` (string) | Teams per event |
| `biztechQRs` | `eventID;year` (string) | `id` (string) | QR codes per event |
| `biztechQuests` | `id` (string = email) | `eventID;year` (string) | Quest progress |
| `biztechQuizzes` | `id` (string) | `eventID;year` (string) | Quiz results |
| `biztechPrizes` | `id` (string) | - | Prize catalog |
| `biztechTransactions` | `id` (string = UUID) | - | Point transactions |
| `biztechInvestments` | `id` (string = UUID) | `eventID;year` (string) | Kickstart investments |
| `biztechEventFeedback` | `id` (string = UUID) | - | Event attendee/partner feedback submissions |
| `biztechInstagramAuth` | `id` (string) | - | Stored Instagram access token state |

### Connection & Real-Time Tables

| Table | Description |
| --- | --- |
| `bizConnections` | Connection records between profiles |
| `bizWallSockets` | WebSocket connections for the live connection wall |
| `bizLiveConnections` | Recent connections for wall animation (with TTL) |
| `bizSockets` | WebSocket connections for the sticker/voting system |
| `bizStickers` | Sticker votes |
| `bizScores` | Scoring data |
| `bizFeedback` | Judge feedback |
| `bizJudge` | Judge assignment tracking |

### BTX (Stock Exchange) Tables

| Table | Description |
| --- | --- |
| `bizBtxProjects` | Projects/companies in the exchange |
| `bizBtxAccounts` | User trading accounts (balance, portfolio value) |
| `bizBtxHoldings` | User share holdings |
| `bizBtxTrades` | Trade history |
| `bizBtxSockets` | WebSocket connections for real-time prices |
| `bizBtxPrices` | Price history snapshots |

---

## Next Steps

- [Schemas & Access Patterns](/docs/database/schemas): Detailed table schemas, Global Secondary Indexes, common access patterns, and how to use the db module
