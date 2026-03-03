---
title: Delete User API
nextjs:
  metadata:
    title: Delete User API Documentation
    description: Detailed documentation for the delete user API.
---

The `del` API endpoint allows you to delete a user based on their email address. This endpoint validates the email address and checks if the user exists in the database before performing the deletion. {% .lead %}

---

## Endpoint

The `del` API endpoint is used to delete a user.

```
DELETE /del/{email}
```

## HTTP Method

The API uses the `DELETE` method to remove data from the server.

## Request Parameters

The request must contain the following parameter in the URL path:

- `email` (string, required): The email address of the user to be deleted.

## Validation

The API performs several validations on the input data:

- **Email Validation**: The email must be in a valid email format.
- **User Existence**: The user must exist in the USERS_TABLE.

## Request Example

Here is an example of a valid request to the `del` API:

```
DELETE /del/user@example.com
```

## Response Example

### Success Response

On successful deletion of the user, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": {
    "message": "User deleted!",
    "response": {
      // Response data from the database deletion operation
    }
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

Here is a detailed breakdown of the steps performed by the `del` function:

1. **Validate Path Parameters**:

   - The function checks if the `email` parameter is provided in the path.
   - Example:
     ```javascript
     if (!event.pathParameters || !event.pathParameters.email)
       throw helpers.missingIdQueryResponse('event')
     ```

2. **Validate Email Format**:

   - The email is validated to ensure it is in a proper format.
   - Example:
     ```javascript
     const email = event.pathParameters.email
     if (!isValidEmail(email)) throw helpers.inputError('Invalid email', email)
     ```

3. **Check User Existence**:

   - The function checks if the user exists in the USERS_TABLE.
   - Example:
     ```javascript
     const existingUser = await db.getOne(email, USERS_TABLE)
     if (isEmpty(existingUser)) throw helpers.notFoundResponse('User', email)
     ```

4. **Delete User from Database**:

   - The function deletes the user from the database.
   - Example:
     ```javascript
     const res = await db.deleteOne(email, USERS_TABLE)
     const response = helpers.createResponse(200, {
       message: 'User deleted!',
       response: res,
     })
     callback(null, response)
     ```

5. **Error Handling**:

   - If an error occurs during the process, the function catches the error and returns an appropriate response.
   - Example:
     ```javascript
     catch (err) {
       callback(null, err);
       return null;
     }
     ```
