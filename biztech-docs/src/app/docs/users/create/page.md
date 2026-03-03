---
title: Create User API
nextjs:
  metadata:
    title: Create User API Documentation
    description: Detailed documentation for the create user API.
---

The `create` API endpoint allows you to create a new user. This endpoint validates input data, checks for duplicate entries, and stores the user information in the database. {% .lead %}

---

## Endpoint

The `create` API endpoint is used to create a new user.

```
POST /create

```

## HTTP Method

The API uses the `POST` method to send data to the server.

## Request Parameters

The request body must contain a JSON object with the following properties:

- `email` (string, required): The email address of the user.
- `education` (string, optional): The education of the user.
- `studentId` (number, optional): The student ID of the user.
- `fname` (string, required): The first name of the user.
- `lname` (string, required): The last name of the user.
- `faculty` (string, optional): The faculty of the user.
- `major` (string, optional): The major of the user.
- `year` (number, optional): The academic year of the user.
- `gender` (string, optional): The gender of the user.
- `diet` (string, optional): The dietary preferences of the user.
- `isMember` (boolean, optional): Whether the user is a member.
- `favedEventsArray` (array of strings, optional): An array of favorite events.

## Validation

The API performs several validations on the input data:

- **Email Validation**: The email must be a valid email format.
- **Faved Events Array**: If provided, the array must:
  - Not be empty.
  - Contain only string elements.
  - Have unique elements.

## Request Example

Here is an example of a valid request to the `create` API:

```json
{
  "email": "user@example.com",
  "education": "UBC",
  "studentId": 12345678,
  "fname": "John",
  "lname": "Doe",
  "faculty": "Science",
  "major": "Computer Science",
  "year": 3,
  "gender": "Male",
  "diet": "Vegetarian",
  "isMember": true,
  "favedEventsArray": ["event1;2021", "event2;2022"]
}
```

## Response Example

### Success Response

On successful creation of the user, the API returns a 201 status code with the following response:

```json
{
  "statusCode": 201,
  "body": {
    "message": "Created!",
    "params": {
      "Item": {
        "id": "user@example.com",
        "education": "UBC",
        "studentId": 12345678,
        "fname": "John",
        "lname": "Doe",
        "faculty": "Science",
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

### Duplicate User

If a user with the provided email already exists, the API returns a 409 status code with the following response:

```json
{
  "statusCode": 409,
  "body": {
    "error": "User could not be created because email already exists"
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

Here is a detailed breakdown of the steps performed by the `create` function:

1. **Parse Request Body**:

   - The input data is parsed from the request body.
   - Example: `const data = JSON.parse(event.body);`

2. **Email Validation**:

   - The email is validated to ensure it is in a proper format.
   - Example: `if (!isValidEmail(data.email)) return helpers.inputError("Invalid email", data.email);`

3. **Check Biztech Admin**:

   - If the email domain is `ubcbiztech.com`, the user is marked as a Biztech admin.
   - Example:
     ```javascript
     if (
       email.substring(email.indexOf('@') + 1, email.length) ===
       'ubcbiztech.com'
     ) {
       isBiztechAdmin = true
     }
     ```

4. **Prepare User Parameters**:

   - User parameters are prepared for insertion into the database.
   - Example:
     ```javascript
     const userParams = {
       Item: {
         id: data.email,
         education: data.education,
         studentId: data.studentId || 0,
         fname: data.fname,
         lname: data.lname,
         faculty: data.faculty,
         major: data.major,
         year: data.year,
         gender: data.gender,
         diet: data.diet,
         isMember: data.isMember,
         createdAt: timestamp,
         updatedAt: timestamp,
         admin: isBiztechAdmin,
       },
       TableName:
         USERS_TABLE + (process.env.ENVIRONMENT ? process.env.ENVIRONMENT : ''),
       ConditionExpression: 'attribute_not_exists(id)',
     }
     ```

5. **Faved Events Array Validation**:

   - If `favedEventsArray` is provided, it is validated to ensure it meets requirements.
   - Example:
     ```javascript
     if (
       data.hasOwnProperty('favedEventsArray') &&
       Array.isArray(data.favedEventsArray)
     ) {
       let favedEventsArray = data.favedEventsArray
       if (!favedEventsArray.length === 0) {
         callback(
           null,
           helpers.inputError('the favedEventsArray is empty', data),
         )
       }
       if (
         !favedEventsArray.every(
           (eventIDAndYear) => typeof eventIDAndYear === 'string',
         )
       ) {
         callback(
           null,
           helpers.inputError(
             'the favedEventsArray contains non-string element(s)',
             data,
           ),
         )
       }
       if (favedEventsArray.length !== new Set(favedEventsArray).size) {
         callback(
           null,
           helpers.inputError(
             'the favedEventsArray contains duplicate elements',
             data,
           ),
         )
       }
       userParams.Item['favedEventsID;year'] =
         docClient.createSet(favedEventsArray)
     }
     ```

6. **Insert User into Database**:
   - The user is inserted into the database.
   - Example:
     ```javascript
     await docClient
       .put(userParams)
       .promise()
       .then(() => {
         const response = helpers.createResponse(201, {
           message: 'Created!',
           params: userParams,
         })
         callback(null, response)
       })
       .catch((error) => {
         let response
         if (error.code === 'ConditionalCheckFailedException') {
           response = helpers.createResponse(
             409,
             'User could not be created because email already exists',
           )
         } else {
           response = helpers.createResponse(
             502,
             'Internal Server Error occurred',
           )
         }
         callback(null, response)
       })
     ```
