---
title: Check User Membership API
nextjs:
  metadata:
    title: Check User Membership API Documentation
    description: Detailed documentation for the check user membership API.
---

The `checkUserMembership` API endpoint allows you to check if a user is a member in the system based on their email address. This endpoint verifies the membership status of the user and returns a boolean indicating whether the user is a member. {% .lead %}

---

## Endpoint

The `checkUserMembership` API endpoint is used to check if a user is a member.

```
GET /checkUserMembership/{email}
```

## HTTP Method

The API uses the `GET` method to retrieve data from the server.

## Request Parameters

The request must contain the following parameter in the URL path:

- `email` (string, required): The email address of the user to check.

## Validation

The API performs the following validation on the input data:

- **Email Validation**: The email must be in a valid email format.

## Request Example

Here is an example of a valid request to the `checkUserMembership` API:

```
GET /checkUserMembership/user@example.com

```

## Response Example

### Success Response

If the user exists and is a member, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": true
}
```

If the user exists but is not a member, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": false
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

Here is a detailed breakdown of the steps performed by the `checkUserMembership` function:

1. **Extract Email from Path Parameters**:

   - The email address is extracted from the path parameters.
   - Example: `const email = event.pathParameters.email;`

2. **Retrieve User from Database**:

   - The user is retrieved from the database using the provided email address.
   - Example: `const user = await db.getOne(email, USERS_TABLE);`

3. **Check Membership Status**:

   - The function checks if the retrieved user is empty and returns the membership status.
   - Example:
     ```javascript
     if (isEmpty(user)) {
       callback(null, helpers.createResponse(200, false))
     } else {
       callback(null, helpers.createResponse(200, user.isMember))
     }
     ```

4. **Error Handling**:

   - If an error occurs during the process, the function catches the error and returns an appropriate response.
   - Example:
     ```javascript
     catch (err) {
       callback(null, helpers.createResponse(400, err));
     }
     ```
