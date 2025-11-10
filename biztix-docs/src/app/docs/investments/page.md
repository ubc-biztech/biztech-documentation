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

**Description**

Makes an investment in a team. Increments team's funding, decrements investor's balance, and creates a new investment record.

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

**Description**

Returns the funding status of a team, including the total funding received and a list of investments. Note that the investments here are NOT sorted.

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
      "createdAt": 1754717442711,
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
      "createdAt": 1754717442715,
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

---

### 3. Get All Investments
- **Method**: `GET`
- **Path**: `investments`

#### Request
| Query Param | Description     |
| ----------- | --------------- |
| limit | Number of most recent investments to return |

**Description**

Returns a list of all investments, sorted by most recent.
Specifying an optional *limit* query parameter will limit the number of investments returned.

**Example Request**
```
GET /investments?limit=2
GET /investments
```
#### Response
```json
[
  {
    "isPartner": false,
    "createdAt": "1729021722333",
    "eventID;year": "kickstart;2025",
    "amount": 20000,
    "teamId": "206abfa6-4b56-4316-af59-9cc3c1b0863c",
    "investorId": "benny@ubcbiztech.com",
    "investorName": "Benny",
    "comment": "SUPERB!!!",
    "id": "e0131a38-cedd-4ddd-a296-dcee3f31c7e6"
  },
  {
    "isPartner": false,
    "createdAt": "1729021722332",
    "eventID;year": "kickstart;2025",
    "amount": 500,
    "teamId": "206abfa6-4b56-4316-af59-9cc3c1b0863c",
    "investorId": "benny@ubcbiztech.com",
    "investorName": "Benny",
    "comment": "Fantastic",
    "id": "a7a4e318-0fd2-46fc-b48a-cdd970cccace"
  }
]

