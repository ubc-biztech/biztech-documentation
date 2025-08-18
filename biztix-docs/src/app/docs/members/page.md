---
title: Members API
nextjs:
  metadata:
    title: Members API
    description: This service is responsible for managing BizTech members, including creating, retrieving, updating, and deleting member records stored in DynamoDB.
---

# Members API
*This service is responsible for managing BizTech members, including creating, retrieving, updating, and deleting member records stored in DynamoDB.*

---

## Authentication & Authorization
- All endpoints (except `POST /members`) require **Cognito authentication**.
- Only users with `@ubcbiztech.com` emails are authorized to call this service.
- Unauthorized users will receive a `403 Unauthorized` response.

---

## POST /members/
Creates a new member record.

**Request**

| Headers       | Type         | Required? |
| ------------- | ------------ | --------- |
| Authorization | Bearer Token | Y         |

| Body Property      | Description                   | Required? |
| ------------------ | ----------------------------- | --------- |
| email              | Email address (unique ID)     | Y         |
| first_name         | First name                    | Y         |
| last_name          | Last name                     | Y         |
| pronouns           | Pronouns                      | N         |
| student_number     | Student number                | N         |
| faculty            | Faculty name                  | N         |
| year               | Year of study                 | N         |
| major              | Major/Program                 | N         |
| prev_member        | Whether user is a returning member (boolean) | N |
| international      | International student (boolean) | N       |
| education          | Current education status      | N         |
| topics             | Interests/topics array        | N         |
| heard_from         | How they heard of BizTech     | N         |
| heardFromSpecify   | Freeform detail on source     | N         |
| diet               | Dietary restrictions          | N         |
| university         | University name               | N         |
| high_school        | High school name              | N         |
| admin              | Admin flag (boolean)          | N         |

**Example Request**
```javascript
{
  "email": "student@example.com",
  "first_name": "Alice",
  "last_name": "Wong",
  "faculty": "Commerce",
  "year": "3",
  "major": "Accounting",
  "prev_member": false,
  "international": true,
  "topics": ["Finance", "Tech"],
  "heard_from": "Friend"
}
```

**Response**
```javascript
{
  "message": "Created!",
  "params": {
    "id": "student@example.com",
    "firstName": "Alice",
    "lastName": "Wong",
    "faculty": "Commerce",
    "year": "3",
    "major": "Accounting",
    "international": true,
    "topics": ["Finance", "Tech"],
    "createdAt": 1755702100000,
    "updatedAt": 1755702100000
  }
}
```

**Errors**
- `403` Unauthorized if caller is not `@ubcbiztech.com`.
- `400` Invalid email format.
- `409` Email already exists.
- `502` Internal server error.

---

## GET /members/{id}
Fetch a single member by email.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Path Param | Description     |
| ---------- | --------------- |
| id         | Member’s email  |

**Example Request**
```
GET /members/student@example.com
```

**Response**
```javascript
{
  "id": "student@example.com",
  "firstName": "Alice",
  "lastName": "Wong",
  "faculty": "Commerce",
  "year": "3",
  "major": "Accounting",
  "international": true,
  "topics": ["Finance", "Tech"],
  "createdAt": 1755702100000,
  "updatedAt": 1755702100000
}
```

**Errors**
- `403` Unauthorized
- `400` Invalid email
- `404` Member not found

---

## GET /members/
Fetch all members.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

**Response**
```javascript
{
  "message": "success",
  "data": [
    {
      "id": "student@example.com",
      "firstName": "Alice",
      "lastName": "Wong",
      "year": "3",
      "major": "Accounting",
      "createdAt": 1755702100000,
      "updatedAt": 1755702100000
    },
    {
      "id": "bob@example.com",
      "firstName": "Bob",
      "lastName": "Li",
      "year": "4",
      "major": "Finance"
    }
  ]
}
```

---

## PATCH /members/{id}
Update an existing member by email.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Path Param | Description     |
| ---------- | --------------- |
| id         | Member’s email  |

**Body**
- Accepts any subset of the fields from `POST /members/`.

**Example Request**
```javascript
{
  "major": "Business Technology Management",
  "year": "4",
  "topics": ["Consulting", "AI"]
}
```

**Response**
```javascript
{
  "message": "Updated member with email student@example.com!",
  "response": {
    "Attributes": {
      "major": "Business Technology Management",
      "year": "4",
      "topics": ["Consulting", "AI"],
      "updatedAt": 1755703100000
    }
  }
}
```

**Errors**
- `403` Unauthorized
- `400` Invalid email
- `404` Member not found

---

## DELETE /members/{id}
Delete a member by email.

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Path Param | Description     |
| ---------- | --------------- |
| id         | Member’s email  |

**Example Request**
```
DELETE /members/student@example.com
```

**Response**
```javascript
{
  "message": "Member deleted!",
  "response": {
    "id": "student@example.com"
  }
}
```

**Errors**
- `403` Unauthorized
- `400` Invalid email
- `404` Member not found
