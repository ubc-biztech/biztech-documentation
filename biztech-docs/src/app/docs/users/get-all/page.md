---
title: Get All Users API
nextjs:
  metadata:
    title: Get All Users API Documentation
    description: Detailed documentation for the get all users API.
---

The `getAll` API endpoint allows you to retrieve a list of all users in the system. This endpoint returns all user profiles that exist in the database. {% .lead %}

---

## Endpoint

The `getAll` API endpoint is used to retrieve all users.

```
GET /getAll
```

## HTTP Method

The API uses the `GET` method to retrieve data from the server.

## Request Parameters

This endpoint does not require any parameters in the URL path or request body.

## Validation

There are no specific validation requirements for this endpoint as it retrieves all user data.

## Request Example

Here is an example of a valid request to the `getAll` API:

```
GET /getAll
```

## Response Example

### Success Response

If users exist in the system, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": [
    {
      "id": "user1@example.com",
      "education": "UBC",
      "studentId": 12345678,
      "fname": "John",
      "lname": "Doe",
      "faculty": "Science",
      "major": "Computer Science",
      "year": 3,
      "gender": "Male",
      "diet": "Halal",
      "isMember": true,
      "createdAt": 1625140800000,
      "updatedAt": 1625140800000,
      "admin": false,
      "favedEventsID;year": ["event1;2021", "event2;2022"]
    },
    {
      "id": "user2@example.com",
      "education": "UBC",
      "studentId": 78901212,
      "fname": "Jane",
      "lname": "Smith",
      "faculty": "Science",
      "major": "Biology",
      "year": 2,
      "gender": "Female",
      "diet": "Vegan",
      "isMember": false,
      "createdAt": 1625140800000,
      "updatedAt": 1625140800000,
      "admin": false,
      "favedEventsID;year": ["event3;2021", "event4;2022"]
    }
    // More user objects...
  ]
}
```

## Error Handling

### Internal Server Error

If there is an internal server error, the API returns a 502 status code with the following response:

```json
{
  "statusCode": 502,
  "body": {
    "error": "Internal Server Error occurred"
  }
}
```

## Detailed Steps

Here is a detailed breakdown of the steps performed by the `getAll` function:

1. **Retrieve All Users from Database**:

   - The function retrieves all user profiles from the database.
   - Example: `const users = await db.scan(USERS_TABLE);`

2. **Return Users Information**:

   - The function returns the list of all users.
   - Example:
     ```javascript
     const response = helpers.createResponse(200, users)
     callback(null, response)
     ```

3. **Error Handling**:

   - If an error occurs during the process, the function catches the error and returns an appropriate response.
   - Example:
     ```javascript
     catch (err) {
       console.error(err);
       callback(null, helpers.createResponse(502, err));
     }
     ```
