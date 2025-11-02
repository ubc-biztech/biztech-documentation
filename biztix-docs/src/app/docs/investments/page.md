---
title: Investments API
nextjs:
  metadata:
    title: Investments API
    description: API endpoints for handling investments in teams during the event
---

This page describes the **Investments API** endpoints used for managing investments in teams during the event, including making investments and checking investment statuses.

---

## Endpoints

### 1. Make an Investment
- **Method**: `POST`
- **Path**: `/invest`

#### Request
```json
{
  "investorId": "user123",
  "teamId": "team456",
  "amount": 1000,
  "comment": "Great pitch! Looking forward to your progress."
}
```

#### Response
```json
{
  "message": "Investment successful"
}
```

#### Error Responses
- **400 Bad Request**: If investor or team not found, or insufficient balance
- **500 Internal Server Error**: If there's an issue updating the database

---

### 2. Get Team Funding Status
- **Method**: `GET`
- **Path**: `investments/teamStatus/{teamId}`

#### Request
| Path Param | Description     |
| ---------- | --------------- |
| teamId     | Team’s ID       |

**Example Request**
```
GET /investments/teamStatus/team456
```

#### Response
```json
{
  "funding": 40600,
  "investments": [
    {
      "isPartner": false,
      "eventID;year": "kickstart;2025",
      "amount": 10000,
      "teamId": "team456",
      "investorId": "benny@ubcbiztech.com",
      "investorName": "Benny",
      "comment": "Wonderful",
      "id": "5f41605b-2c3f-4c94-b730-18e6f126cfc3"
    },
    {
      "teamName": "test",
      "isPartner": false,
      "eventID;year": "kickstart;2025",
      "amount": 10000,
      "teamId": "team456",
      "investorId": "benny@ubcbiztech.com",
      "investorName": "Benny",
      "comment": "Wonderful",
      "id": "6da2470c-cad5-4df6-a822-ff04c962363f"
    }
  ]
}
```
