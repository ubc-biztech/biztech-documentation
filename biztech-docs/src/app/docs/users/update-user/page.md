---
title: Update User API
nextjs:
  metadata:
    title: Update User API Documentation
    description: Detailed documentation for the update user API.
---

The `update` API endpoint allows you to update the information of an existing user in the system based on their email address. This endpoint validates input data, ensures certain immutable properties are not updated, and stores the updated user information in the database. {% .lead %}

---

## Endpoint

The `update` API endpoint is used to update a user's information.

```
PUT /update/{email}
```

## HTTP Method

The API uses the `PUT` method to send updated data to the server.

## Request Parameters

The request must contain the following parameter in the URL path:

- `email` (string, required): The email address of the user to update.

The request body must contain a JSON object with the following properties:

- Any updatable user fields (e.g., `education`, `fname`, `lname`, etc.).

## Validation

The API performs several validations on the input data:

- **Email Validation**: The email must be in a valid email format.
- **Immutable Properties**: Certain properties cannot be updated (e.g., `id`).

## Request Example

Here is an example of a valid request to the `update` API:

```
PUT /update/user@example.com
```

```json
{
  "education": "UBC",
  "fname": "Dennis",
  "lname": "Xu",
  "faculty": "Science",
  "major": "Computer Science",
  "year": 4,
  "gender": "Male",
  "diet": "None",
  "isMember": true
}
```

## Response Example

### Success Response

On successful update of the user, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": {
    "message": "Updated user with email user@example.com!",
    "response": {
      // Response data from the database update operation
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

### Immutable Property Update Attempt

If an attempt is made to update an immutable property, the API returns a 400 status code with the following response:

```json
{
  "statusCode": 400,
  "body": {
    "error": "Cannot update id, createdAt, or admin"
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

Here is a detailed breakdown of the steps performed by the `update` function:

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

3. **Retrieve Existing User from Database**:

   - The existing user is retrieved from the database using the provided email address.
   - Example: `const existingUser = await db.getOne(email, USERS_TABLE);`

4. **Check if User Exists**:

   - The function checks if the retrieved user is empty and throws an error if the user does not exist.
   - Example:
     ```javascript
     if (isEmpty(existingUser)) throw helpers.notFoundResponse('user', email)
     ```

5. **Parse Request Body**:

   - The input data is parsed from the request body.
   - Example: `const data = JSON.parse(event.body);`

6. **Check for Immutable Properties**:

   - The function checks if any immutable properties are being updated and throws an error if so.
   - Example:
     ```javascript
     const invalidUpdates = Object.keys(data).filter((prop) =>
       IMMUTABLE_USER_PROPS.includes(prop),
     )
     if (invalidUpdates.length > 0)
       throw helpers.inputError(`Cannot update ${invalidUpdates.join(', ')}`)
     ```

7. **Update User in Database**:

   - The user is updated in the database with the provided data.
   - Example:
     ```javascript
     const res = await db.updateDB(email, data, USERS_TABLE)
     const response = helpers.createResponse(200, {
       message: `Updated user with email ${email}!`,
       response: res,
     })
     callback(null, response)
     ```

8. **Error Handling**:

   - If an error occurs during the process, the function catches the error and returns an appropriate response.
   - Example:
     ```javascript
     catch (err) {
       console.error(err);
       callback(null, err);
     }
     ```
