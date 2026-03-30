---
title: 'Live Wall: Backend & WebSocket'
nextjs:
  metadata:
    title: 'Live Wall: Backend & WebSocket'
    description: 'Interactions service, database tables, connection flow, and WebSocket protocol for the Live Connection Wall.'
---


This page covers the backend that powers the Live Wall, including the interactions service, database tables, connection flow, and WebSocket protocol.

---

## Interactions Service

The backend lives in `services/interactions/` and handles:

1. **Creating connections** (`POST /interactions`)
2. **Serving wall snapshots** (`GET /interactions/wall`)
3. **WebSocket lifecycle** (connect, disconnect, subscribe)

---

## Database Tables

| Table | Key | Purpose |
|-------|-----|---------|
| `bizProfiles{ENV}` | `compositeID` (PK), `type` (SK) | Stores connection records between profiles |
| `bizLiveConnections{ENV}` | `eventId` (PK), `sk` (SK) | Live log for wall replay/hydration |
| `bizWallSockets{ENV}` | `connectionId` (PK) | Active WebSocket connections |

---

## Connection Flow (Backend)

When `POST /interactions` is called:

```
1. Look up the user's profile by email → get their profileID
2. Verify both profiles exist
3. Check for duplicate (already connected)
4. Save bidirectional connection records to profiles table
5. Broadcast "connection" event via WebSocket to all wall clients
6. Log to live connections table (for snapshot replay)
```

The connection is **bidirectional**. If Alice connects with Bob, two records are created:
- `PROFILE#alice → CONNECTION#bob`
- `PROFILE#bob → CONNECTION#alice`

---

## WebSocket Protocol

The WebSocket uses AWS API Gateway WebSocket APIs:

| Route | Handler | Description |
|-------|---------|-------------|
| `$connect` | `wsConnect` | Saves connection ID to DynamoDB |
| `$disconnect` | `wsDisconnect` | Removes connection ID from DynamoDB |
| `subscribe` | `wsSubscribe` | Updates the connection's event ID |

### Messages from Server to Client

**Snapshot** (sent on initial load via HTTP, not WS):

```json
{
  "type": "snapshot",
  "nodes": [{ "id": "...", "name": "...", "avatar": "..." }],
  "links": [{ "source": "...", "target": "...", "createdAt": 123 }]
}
```

**New connection:**

```json
{
  "type": "connection",
  "createdAt": 1234567890,
  "from": { "id": "...", "name": "Elijah Zhou", "avatar": "...", "major": "CS" },
  "to": { "id": "...", "name": "Aurora Cheng", "avatar": "...", "major": "BUCS" }
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Profile Page    │  │  ConnectionWall.tsx       │ │
│  │  (NFC tap opens) │  │  ┌───────────────────┐  │ │
│  │                  │  │  │ react-force-graph  │  │ │
│  │  POST /interact  │  │  │ (D3 force layout)  │  │ │
│  │  ───────────────→│  │  └───────────────────┘  │ │
│  └─────────────────┘  │  ↑ WebSocket messages    │ │
│                        └──┼──────────────────────┘ │
└────────────────────────────┼────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  API Gateway    │
                    │  (REST + WS)    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │    interactions service      │
              │                              │
              │  handleConnection()          │
              │  ├─ Save to Profiles table   │
              │  ├─ Log to LiveConnections   │
              │  └─ Broadcast via WebSocket  │
              │                              │
              │  getWallSnapshot()           │
              │  └─ Query LiveConnections    │
              └──────────────┬──────────────┘
                             │
                    ┌────────┴────────┐
                    │    DynamoDB     │
                    │  ┌────────────┐ │
                    │  │ Profiles   │ │
                    │  │ LiveConns  │ │
                    │  │ WallSocks  │ │
                    │  └────────────┘ │
                    └─────────────────┘
```
