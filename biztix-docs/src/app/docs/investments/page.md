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

### 2. Get User Investment Status
- **Method**: `POST`
- **Path**: `/user/status`

#### Request
```json
{
  "userId": "user123"
}
```

#### Response
```json
{
  "balance": 5000,
  "stakes": {
    "team456": 1000,
    "team789": 2000
  }
}
```

#### Error Responses
- **400 Bad Request**: If user is not found or not registered for the event

---

### 3. Get Team Investment Status
- **Method**: `POST`
- **Path**: `/team/status`

#### Request
```json
{
  "teamId": "team456"
}
```

#### Response
```json
{
  "funding": 5000,
  "investments": [
    {
      "id": "inv123",
      "investorId": "user123",
      "investorName": "John Doe",
      "amount": 1000,
      "comment": "Great pitch!",
      "createdAt": "2025-10-18T21:30:00Z"
    },
    {
      "id": "inv124",
      "investorId": "user456",
      "investorName": "Jane Smith",
      "amount": 2000,
      "comment": "Love the idea!",
      "createdAt": "2025-10-18T22:15:00Z"
    }
  ]
}
```

#### Error Responses
- **400 Bad Request**: If team is not found for the event
