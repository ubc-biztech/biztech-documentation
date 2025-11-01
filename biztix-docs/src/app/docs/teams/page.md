---
title: Teams API
nextjs:
  metadata:
    title: Teams API
    description: Explanation of teams API used for
---

# Teams API Documentation

This document describes the **Teams API** endpoints defined in the provided `serverless.yml` configuration, including example requests and responses.

---

## Endpoints

### 1. Update Team Points
- **Method**: `PUT`
- **Path**: `/team/points`

#### Request
```json
{
  "teamID": "team123",
  "points": 50
}
```

#### Response
```json
{
  "success": true,
  "message": "Team points updated successfully",
  "teamID": "team123",
  "newPoints": 50
}
```

---

### 2. Add Multiple QR Scans
- **Method**: `PUT`
- **Path**: `/team/addQuestions`

#### Request
```json
{
  "teamID": "team123",
  "questions": ["Q1", "Q2", "Q3"]
}
```

#### Response
```json
{
  "success": true,
  "message": "Questions added successfully",
  "teamID": "team123",
  "added": 3
}
```

---

### 3. Make Team
- **Method**: `POST`
- **Path**: `/team/make`

#### Request
```json
{
  "eventID": "hackathon2025",
  "year": 2025,
  "teamName": "Innovators",
  "members": ["user1", "user2"]
}
```

#### Response
```json
{
  "success": true,
  "message": "Team created successfully",
  "team": {
    "teamID": "team123",
    "eventID": "hackathon2025",
    "year": 2025,
    "teamName": "Innovators",
    "members": ["user1", "user2"]
  }
}
```

---

### 4. Get Team From User ID
- **Method**: `POST`
- **Path**: `/team/getTeamFromUserID`

#### Request
```json
{
  "userID": "user1"
}
```

#### Response
```json
{
  "success": true,
  "team": {
    "teamID": "team123",
    "teamName": "Innovators",
    "eventID": "hackathon2025",
    "year": 2025
  }
}
```

---

### 5. Get All Teams for Event/Year
- **Method**: `GET`
- **Path**: `/team/{eventID}/{year}`

#### Example Request
```
GET /team/hackathon2025/2025
```

#### Response
```json
{
  "success": true,
  "teams": [
    {
      "teamID": "team123",
      "teamName": "Innovators",
      "members": ["user1", "user2"]
    },
    {
      "teamID": "team456",
      "teamName": "Builders",
      "members": ["user3", "user4"]
    }
  ]
}
```

---

### 6. Change Team Name
- **Method**: `POST`
- **Path**: `/team/changeTeamName`

#### Request
```json
{
  "teamID": "team123",
  "newName": "Visionaries"
}
```

#### Response
```json
{
  "success": true,
  "message": "Team name updated successfully",
  "teamID": "team123",
  "newName": "Visionaries"
}
```

---

### 7. Get Normalized Round Scores
- **Method**: `GET`
- **Path**: `/team/scores-all`

#### Response
```json
{
  "success": true,
  "scores": [
    {
      "teamID": "team123",
      "normalizedScore": 92.5
    },
    {
      "teamID": "team456",
      "normalizedScore": 88.1
    }
  ]
}
```

---

### 8. Get Team Feedback Score
- **Method**: `GET`
- **Path**: `/team/feedback/{teamID}`

#### Example Request
```
GET /team/feedback/team123
```

#### Response
```json
{
  "success": true,
  "teamID": "team123",
  "feedbackScore": 4.7
}
```

---

### 9. Get Judge Current Team
- **Method**: `GET`
- **Path**: `/team/judge/currentTeamID/{judgeID}`

#### Example Request
```
GET /team/judge/currentTeamID/judge42
```

#### Response
```json
{
  "success": true,
  "judgeID": "judge42",
  "currentTeamID": "team123"
}
```

---

### 10. Get Judge Submissions
- **Method**: `GET`
- **Path**: `/team/judge/feedback/{judgeID}`

#### Example Request
```
GET /team/judge/feedback/judge42
```

#### Response
```json
{
  "success": true,
  "judgeID": "judge42",
  "submissions": [
    {
      "teamID": "team123",
      "score": 85,
      "comments": "Great presentation"
    }
  ]
}
```

---

### 11. Create Judge Submission
- **Method**: `POST`
- **Path**: `/team/judge/feedback`

#### Request
```json
{
  "judgeID": "judge42",
  "teamID": "team123",
  "score": 90,
  "comments": "Excellent innovation"
}
```

#### Response
```json
{
  "success": true,
  "message": "Submission created successfully"
}
```

---

### 12. Update Judge Submission
- **Method**: `PUT`
- **Path**: `/team/judge/feedback`

#### Request
```json
{
  "judgeID": "judge42",
  "teamID": "team123",
  "score": 95,
  "comments": "Improved after Q&A"
}
```

#### Response
```json
{
  "success": true,
  "message": "Submission updated successfully"
}
```

---

### 13. Update Current Team for Judge
- **Method**: `PUT`
- **Path**: `/team/judge/currentTeam/{teamID}`

#### Example Request
```
PUT /team/judge/currentTeam/team123
```

#### Request Body
```json
{
  "judgeID": "judge42"
}
```

#### Response
```json
{
  "success": true,
  "message": "Judge current team updated successfully",
  "judgeID": "judge42",
  "teamID": "team123"
}
```

---

### 14. Get Current Round
- **Method**: `GET`
- **Path**: `/team/round`

#### Response
```json
{
  "success": true,
  "currentRound": 2
}
```

---

### 15. Set Current Round
- **Method**: `PUT`
- **Path**: `/team/round/{round}`

#### Example Request
```
PUT /team/round/3
```

#### Response
```json
{
  "success": true,
  "message": "Current round updated",
  "newRound": 3
}
```

---

### 16. Join a Team
- **Method**: `POST`
- **Path**: `/team/join`

#### Request
```json
{
  "eventID": "kickstart",
  "year": 2025,
  "memberID": "isaac@ubcbiztech.com",
  "teamID": "206abfa6-4b56-4316-af59-9cc3c1b0863c"
}
```

#### Response
```json
{
  "message": "Successfully joined team.",
  "response": {
    "eventID": "kickstart",
    "year": 2025,
    "memberID": "isaac@ubcbiztech.com",
    "teamID": "206abfa6-4b56-4316-af59-9cc3c1b0863c"
  }
}
```

---

### 17. Leave a Team
- **Method**: `POST`
- **Path**: `/team/leave`

#### Request
```json
{
  "eventID": "kickstart",
  "year": 2025,
  "memberID": "isaac@ubcbiztech.com"
}
```

#### Response
```json
{
  "message": "Successfully left team.",
  "response": {
    "eventID": "kickstart",
    "year": 2025,
    "memberID": "isaac@ubcbiztech.com"
  }
}
```


