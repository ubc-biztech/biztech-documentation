---
title: Check User Existence API
nextjs:
  metadata:
    title: Check User Existence API Documentation
    description: Detailed documentation for the check user existence API.
---

The `checkUser` API endpoint allows you to check if a user exists in the system based on their email address. This endpoint verifies the presence of the user and returns a boolean indicating whether the user exists. {% .lead %}

---

## Endpoint

The `checkUser` API endpoint is used to check if a user exists.

```
GET /checkUser/{email}
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

Here is an example of a valid request to the `checkUser` API:

```
GET /checkUser/user@example.com
```

## Response Example

### Success Response

If the user exists, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": true
}
```

If the user does not exist, the API returns a 200 status code with the following response:

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

Here is a detailed breakdown of the steps performed by the `checkUser` function:

1. **Extract Email from Path Parameters**:

   - The email address is extracted from the path parameters.
   - Example: `const email = event.pathParameters.email;`

2. **Retrieve User from Database**:

   - The user is retrieved from the database using the provided email address.
   - Example: `const user = await db.getOne(email, USERS_TABLE);`

3. **Check if User Exists**:

   - The function checks if the retrieved user is empty.
   - Example:
     ```javascript
     if (isEmpty(user)) {
       callback(null, helpers.createResponse(200, false))
     } else {
       callback(null, helpers.createResponse(200, true))
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
