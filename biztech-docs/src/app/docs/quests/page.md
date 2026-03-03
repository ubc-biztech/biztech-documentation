---
title: Quests API
nextjs:
  metadata:
    title: Quests Service Documentation
    description: Documentation for the Quests service
    url: https://github.com/ubc-biztech/serverless-biztechapp/blob/master/services/quests/handler.js
---

# Quests API

This page documents the quests endpoints for retrieving user quest progress, handling quest events, and managing gamification features. The service tracks user progress across various quest types including connections and company interactions.

All endpoints return JSON and support CORS. Authentication is required for all endpoints using JWT tokens.

## Supported Quest Types

### Quest Types
- **COUNTER**: Incremental counting quests that track progress toward a numeric target
- **UNIQUE_SET**: Quests that track unique items (e.g., companies) with a numeric target

### Event Types
- **NEW_CONNECTION**: Triggered when a user makes a new connection
- **RECOMMENDED_CONNECTION**: Triggered when a user connects with a recommended person
- **COMPANY_TALK**: Triggered when a user interacts with a company representative

### Active Quests
- **new_connections_5**: Make 5 new connections (COUNTER type, target: 5)
- **new_connections_10**: Make 10 new connections (COUNTER type, target: 10)
- **new_connections_20**: Make 20 new connections (COUNTER type, target: 20)
- **recommended_connections**: Connect with 3 recommended people (COUNTER type, target: 3)
- **unique_companies_talked_to**: Talk to 6 unique companies (UNIQUE_SET type, target: 6)

---

## Update Quest Progress

```
Method: PATCH
Path: /quests/{event_id}/{year}
```

Update quest progress for the authenticated user based on an event type and parameters.

### Authentication
Required: JWT token with email claim

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| event_id | string | Yes | Event identifier (e.g., "blueprint") |
| year | number | Yes | Event year (e.g., 2026) |

### Request Body
```json
{
  "type": "connection" | "company",
  "argument": {
    // For "connection" type:
    "recommended": true | false,
    "profileId": "string"

    // For "company" type:
    "company": "Microsoft"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Event type ("connection" or "company") |
| argument | object/string | Yes | Event-specific parameters |

#### Connection event argument
| Field | Type | Description |
|-------|------|-------------|
| recommended | boolean | Whether the connection was recommended (optional) |
| profileId | string | Profile ID of the connected user (optional) |

#### Company event argument
| Field | Type | Description |
|-------|------|-------------|
| company | string | Company name for unique tracking |

### Successful Response
```json
{
  "quests": {
    "new_connections_5": {
      "progress": 4,
      "target": 5,
      "startedAt": 1736880000000,
      "completedAt": null,
      "description": "Make 5 new connections"
    },
    "new_connections_10": {
      "progress": 4,
      "target": 10,
      "startedAt": 1736880000000,
      "completedAt": null,
      "description": "Make 10 new connections"
    },
    "unique_companies_talked_to": {
      "progress": 3,
      "target": 6,
      "startedAt": 1736880000000,
      "completedAt": null,
      "description": "Talk to unique companies",
      "items": ["Microsoft", "Google", "Apple"]
    }
  }
}
```

### Error Responses
| Status | Response | Description |
|--------|----------|-------------|
| 400 | `{ "message": "Missing required field: type..." }` | Invalid or missing request body |
| 500 | `{ "message": "Internal server error" }` | Database or processing failure |

---

## Get User's Quest Progress

```
Method: GET
Path: /quests/{event_id}/{year}
```

Retrieve quest progress for the authenticated user for a specific event.

### Authentication
Required: JWT token with email claim

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| event_id | string | Yes | Event identifier |
| year | number | Yes | Event year |

### Successful Response
```json
{
  "quests": {
    "new_connections_5": {
      "progress": 3,
      "target": 5,
      "startedAt": 1736880000000,
      "completedAt": null,
      "description": "Make 5 new connections"
    },
    "unique_companies_talked_to": {
      "progress": 2,
      "target": 6,
      "startedAt": 1736880000000,
      "completedAt": null,
      "description": "Talk to unique companies",
      "items": ["Microsoft", "Google"]
    }
  }
}
```

If no quest data exists for this event/year:
```json
{
  "quests": {}
}
```

### Error Responses
| Status | Response | Description |
|--------|----------|-------------|
| 400 | `{ "message": "missing path parameters" }` | Missing event_id or year |
| 500 | `{ "message": "Internal server error" }` | Database failure |

---

## Get All Users' Quest Progress for Event

```
Method: GET
Path: /quests/event/{event_id}/{year}
```

Retrieve all users' quest progress for a specific event. This endpoint is useful for event organizers to view aggregated quest data.

### Authentication
Required: JWT token with email claim (admin access recommended)

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| event_id | string | Yes | Event identifier |
| year | number | Yes | Event year |

### Successful Response
```json
{
  "quests": [
    {
      "userId": "user1@example.com",
      "quests": {
        "new_connections_5": {
          "progress": 5,
          "target": 5,
          "startedAt": 1736880000000,
          "completedAt": 1736966400000,
          "description": "Make 5 new connections"
        }
      }
    },
    {
      "userId": "user2@example.com",
      "quests": {
        "new_connections_5": {
          "progress": 3,
          "target": 5,
          "startedAt": 1736880000000,
          "completedAt": null,
          "description": "Make 5 new connections"
        }
      }
    }
  ]
}
```

### Error Responses
| Status | Response | Description |
|--------|----------|-------------|
| 400 | `{ "message": "missing path parameters" }` | Missing event_id or year |
| 500 | `{ "message": "Internal server error" }` | Database failure |

---

## Quest Progress Data Model

### Progress Object Structure
```json
{
  "progress": number,         // Current progress count
  "target": number,           // Target count (6 for company quest)
  "startedAt": number,        // Unix timestamp when quest started
  "completedAt": number|null, // Unix timestamp when completed (null if incomplete)
  "description": string,      // Human-readable quest description
  "items": string[]           // Array of unique items (UNIQUE_SET quests only)
}
```

### Database Storage
```json
{
  "id": "user@example.com",       // User email (partition key)
  "eventID#year": "blueprint#2026", // Event ID and year (sort key)
  "quests": {
    "quest_id": {
      "progress": number,
      "target": number,
      "startedAt": number,
      "completedAt": number|null,
      "description": string,
      "items": string[]            // UNIQUE_SET quests only
    }
  }
}
```

---

## Notes

- All endpoints require authentication via JWT token. User email is extracted from token claims.
- Quest progress is automatically updated when events are processed via `PATCH /quests/{event_id}/{year}`.
- COUNTER quests increment progress by 1 and cap at the target value.
- UNIQUE_SET quests track unique items in an array to prevent duplicates (case-insensitive).
- Quest completion is automatically detected and marked with `completedAt` timestamp.
- The service uses DynamoDB with user email as partition key and `eventID#year` as sort key.
