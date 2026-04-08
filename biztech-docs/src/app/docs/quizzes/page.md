---
title: Quizzes API
nextjs:
  metadata:
    title: Quizzes API
    description: The Quizzes service handles the Tech Style Quiz, calculating MBTI-like types from personality scores and generating aggregate statistics.
---

This service handles the **Tech Style Quiz** — a personality-style quiz used at Blueprint events. It calculates MBTI-like types from domain/mode/environment/focus scores, stores results, and generates aggregate statistics.

## DynamoDB Table

Table: `biztechQuizzes` (constant `QUIZZES_TABLE`). PK: `id` (user ID), SK: `event` (defaults to `blueprint;2026`).

Handler: `services/quizzes/handler.js`

All endpoints return JSON and support CORS.

---

## Upload quiz results

- **Method**: POST
- **Path**: `/quizzes/upload`
- **Purpose**: Store a user's quiz results. Calculates domain averages and MBTI, upserts into the database.

### Request body

```json
{
  "id": "user-uuid-or-id",
  "domain": { "q1": 3, "q2": 5, "q3": 2 },
  "mode": { "q1": 4, "q2": 2, "q3": 5 },
  "environment": { "q1": 1, "q2": 3, "q3": 4 },
  "focus": { "q1": 5, "q2": 4, "q3": 3 }
}
```

- **id**: string, required
- **domain/mode/environment/focus**: object of question scores; validated and averaged server-side

### Successful response

```json
{
  "message": "Upload successful"
}
```

### Error responses

- 400 with `{ "message": "Invalid scores" }` when score objects are invalid.

---

## Get a user's report

- **Method**: GET
- **Path**: `/quizzes/report/`
- **Purpose**: Retrieve a single user's computed report (averages and MBTI) for the current event year.

### Required

- Authorized call, the id will be read from the user's email

### Successful response

```json
{
  "message": "Report found",
  "data": {
    "id": "user-123",
    "eventID;year": "blueprint;2026",
    "domainAvg": 3.67,
    "modeAvg": 3.67,
    "environmentAvg": 2.67,
    "focusAvg": 4.0,
    "mbti": "INTJ"
  }
}
```

### Error responses

- 400 with `{ "message": "Quiz report not found" }` when no report exists for the id.

---

## List all quiz reports (by event)

- **Method**: GET
- **Path**: `/quizzes/{event}`
- **Purpose**: Return all quiz reports for a given `eventID;year` composite key.

### Path parameters

- **event**: string, required (format: `eventID;year`, e.g., `blueprint;2026`).
  - If omitted (via internal defaults), the server uses `blueprint;2026`.

### Successful response

Returns an array of quiz report items:

```json
[
  {
    "id": "user-123",
    "eventID;year": "blueprint;2026",
    "domainAvg": 3.67,
    "modeAvg": 3.67,
    "environmentAvg": 2.67,
    "focusAvg": 4.0,
    "mbti": "INTJ"
  },
  {
    "id": "user-456",
    "eventID;year": "blueprint;2026",
    "domainAvg": 3.1,
    "modeAvg": 2.9,
    "environmentAvg": 3.4,
    "focusAvg": 3.8,
    "mbti": "ENFP"
  }
]
```

### Error responses

- 500 with `{ "message": "Internal Server Error" }` on unexpected failures.

---

## Aggregate stats (by event)

- **Method**: GET
- **Path**: `/quizzes/aggregate/{event}`
- **Purpose**: Compute average scores across all users and count MBTI distribution for an event.

### Path parameters

- **event**: string, required (format: `eventID;year`, e.g., `blueprint;2026`).
  - If omitted (via internal defaults), the server uses `blueprint;2026`.

### Successful response

```json
{
  "message": "Aggregate report generated",
  "data": {
    "totalResponses": 123,
    "averages": {
      "domainAvg": 3.42,
      "modeAvg": 3.27,
      "environmentAvg": 3.11,
      "focusAvg": 3.78
    },
    "mbtiCount": {
      "INTJ": 10,
      "ENFP": 15
    }
  }
}
```

If there are no quiz records:

```json
{
  "message": "No quiz data found",
  "data": {
    "totalResponses": 0,
    "averages": null,
    "mbtiCount": {}
  }
}
```

### Error responses

- 500 with `{ "message": "Internal Server Error" }` on unexpected failures.

---

## MBTI wrapped stats

- **Method**: POST
- **Path**: `/quizzes/wrapped`
- **Purpose**: Get counts for a specific MBTI within the current event year.

### Request body

```json
{ "mbti": "INTJ" }
```

- **mbti**: string, required

### Successful response

```json
{
  "totalResponses": 123,
  "totalWithMbtiCount": 10
}
```

### Error responses

- 500 with `{ "message": "Internal Server Error" }` on unexpected failures.

---

## Notes

- Default event scope is `blueprint;2026` unless an endpoint explicitly includes an `{event}` path parameter.
- Averages and MBTI are computed server-side during upload; subsequent reads return stored values.
