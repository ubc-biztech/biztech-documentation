---
title: Get User API
nextjs:
  metadata:
    title: Get User API Documentation
    description: Detailed documentation for the get user API.
---

The `get` API endpoint allows you to retrieve detailed information about a user based on their email address. This endpoint returns the user's profile if they exist in the system. {% .lead %}

---

## Endpoint

The `get` API endpoint is used to retrieve a user's information.

```
GET /get/{email}
```

## HTTP Method

The API uses the `GET` method to retrieve data from the server.

## Request Parameters

The request must contain the following parameter in the URL path:

- `email` (string, required): The email address of the user to retrieve.

## Validation

The API performs the following validation on the input data:

- **Email Validation**: The email must be in a valid email format.

## Request Example

Here is an example of a valid request to the `get` API:

```
GET /get/user@example.com
```

## Response Example

### Success Response

If the user exists, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": {
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
  }
}
```

## Error Handling

### Invalid Email

If the email provided is not valid, the API returns a 400 status code with the following response:

```json
{
  "statusCode": 400,
  "body": {
    "error": "Invalid email",
    "email": "invalid-email"
  }
}
```

### User Not Found

If the user with the provided email does not exist, the API returns a 404 status code with the following response:

```json
{
  "statusCode": 404,
  "body": {
    "error": "User not found",
    "email": "user@example.com"
  }
}
```

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

Here is a detailed breakdown of the steps performed by the `get` function:

1. **Validate Path Parameters**:

   - The function checks if the `email` parameter is provided in the path.
   - Example:
     ```javascript
     if (!event.pathParameters || !event.pathParameters.email)
       throw helpers.missingIdQueryResponse('email')
     ```

2. **Validate Email Format**:

   - The email is validated to ensure it is in a proper format.
   - Example:
     ```javascript
     const email = event.pathParameters.email
     if (!isValidEmail(email)) throw helpers.inputError('Invalid email', email)
     ```

3. **Retrieve User from Database**:

   - The user is retrieved from the database using the provided email address.
   - Example: `const user = await db.getOne(email, USERS_TABLE);`

4. **Check if User Exists**:

   - The function checks if the retrieved user is empty and throws an error if the user does not exist.
   - Example:
     ```javascript
     if (isEmpty(user)) throw helpers.notFoundResponse('user', email)
     ```

5. **Return User Information**:

   - If the user exists, the function returns the user's information.
   - Example:
     ```javascript
     const response = helpers.createResponse(200, user)
     callback(null, response)
     ```

6. **Error Handling**:

   - If an error occurs during the process, the function catches the error and returns an appropriate response.
   - Example:
     ```javascript
     catch (err) {
       console.error(err);
       callback(null, err);
     }
     ```
