---
title: Users Service Overview
nextjs:
  metadata:
    title: Users Service Overview
    description: Overview of the Users service API endpoints.
---

The Users service handles all user-related operations, including creating, updating, retrieving, and deleting user data. This overview provides a summary of the available API endpoints, their purposes, and usage. {% .lead %}

---

## API Endpoints

The Users service provides several API endpoints to manage user data. Below is a summary of each endpoint:

### 1. Create User

**Endpoint:** `POST /create`

This endpoint creates a new user in the system. It validates the input data, checks for duplicates, and stores the user information in the database.

### 2. Check User Existence

**Endpoint:** `GET /checkUser/{email}`

This endpoint checks if a user exists in the database based on the provided email address.

### 3. Check User Membership

**Endpoint:** `GET /checkUserMembership/{email}`

This endpoint checks if a user is a member based on their email address.

### 4. Retrieve User

**Endpoint:** `GET /get/{email}`

This endpoint retrieves detailed information about a user based on their email address.

### 5. Update User

**Endpoint:** `PUT /update/{email}`

This endpoint updates an existing user's information. It ensures that certain immutable properties cannot be changed.

### 6. Retrieve All Users

**Endpoint:** `GET /getAll`

This endpoint retrieves information about all users in the system.

### 7. Favourite Event

**Endpoint:** `POST /favouriteEvent/{email}`

This endpoint allows a user to favourite or unfavourite an event. It validates the input data and updates the user's favourite events list.

### 8. Delete User

**Endpoint:** `DELETE /delete/{email}`

This endpoint deletes a user from the system based on their email address.

## Common Request and Response Structure

### Request Structure

All endpoints accept requests in JSON format. Below is an example of a request to create a new user:

```json
{
  "email": "user@example.com",
  "education": "Bachelor's",
  "studentId": 123456,
  "fname": "John",
  "lname": "Doe",
  "faculty": "Engineering",
  "major": "Computer Science",
  "year": 3,
  "gender": "Male",
  "diet": "Vegetarian",
  "isMember": true,
  "favedEventsArray": ["event1;2021", "event2;2022"]
}
```

### Response Structure

Responses are also in JSON format and typically include a status code and a message or data payload. Below is an example of a successful response for creating a user:

```json
{
  "statusCode": 201,
  "body": {
    "message": "Created!",
    "params": {
      "Item": {
        "id": "user@example.com",
        "education": "Bachelor's",
        "studentId": 123456,
        "fname": "John",
        "lname": "Doe",
        "faculty": "Engineering",
        "major": "Computer Science",
        "year": 3,
        "gender": "Male",
        "diet": "Vegetarian",
        "isMember": true,
        "createdAt": 1625140800000,
        "updatedAt": 1625140800000,
        "admin": false,
        "favedEventsID;year": ["event1;2021", "event2;2022"]
      },
      "TableName": "USERS_TABLE"
    }
  }
}
```
