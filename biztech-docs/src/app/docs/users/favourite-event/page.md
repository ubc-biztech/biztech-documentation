---
title: Favourite Event API
nextjs:
  metadata:
    title: Favourite Event API Documentation
    description: Detailed documentation for the favourite event API.
---

The `favouriteEvent` API endpoint allows you to mark an event as a favourite or remove it from favourites for a user based on their email address. This endpoint validates input data and updates the user's favourite events list in the database. {% .lead %}

---

## Endpoint

The `favouriteEvent` API endpoint is used to manage a user's favourite events.

```
POST /favouriteEvent/{email}
```

## HTTP Method

The API uses the `POST` method to send data to the server.

## Request Parameters

The request must contain the following parameter in the URL path:

- `email` (string, required): The email address of the user.

The request body must contain a JSON object with the following properties:

- `eventID` (string, required): The ID of the event.
- `year` (number, required): The year of the event.
- `isFavourite` (boolean, required): Whether the event should be marked as favourite (`true`) or removed from favourites (`false`).

## Validation

The API performs several validations on the input data:

- **Email Validation**: The email must be in a valid email format.
- **Event Validation**: The event must exist in the EVENTS_TABLE for the specified year.
- **User Validation**: The user must exist in the USERS_TABLE.

## Request Example

Here is an example of a valid request to the `favouriteEvent` API:

```
POST /favouriteEvent/user@example.com
```

```json
{
  "eventID": "event1",
  "year": 2021,
  "isFavourite": true
}
```

## Response Example

### Success Response

On successful marking or unmarking of the event as favourite, the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": {
    "message": "Favourited event with eventID event1 for the year 2021",
    "response": {
      // Response data from the database update operation
    }
  }
}
```

### Already Favourited/Unfavourited

If the event is already in the desired state (favourited/unfavourited), the API returns a 200 status code with the following response:

```json
{
  "statusCode": 200,
  "body": {
    "message": "Already favourited event with eventID event1 for the year 2021"
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

### Event Not Found

If the event with the provided ID and year does not exist, the API returns a 404 status code with the following response:

```json
{
  "statusCode": 404,
  "body": {
    "error": "Event not found",
    "eventID": "event1",
    "year": 2021
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

Here is a detailed breakdown of the steps performed by the `favouriteEvent` function:

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

3. **Parse Request Body**:

   - The input data is parsed from the request body.
   - Example: `const data = JSON.parse(event.body);`

4. **Validate Payload Properties**:

   - The function checks if the required properties (`eventID`, `year`, `isFavourite`) are present and valid.
   - Example:
     ```javascript
     helpers.checkPayloadProps(data, {
       eventID: {
         required: true,
         type: 'string',
       },
       year: {
         required: true,
         type: 'number',
       },
       isFavourite: {
         required: true,
         type: 'boolean',
       },
     })
     ```

5. **Retrieve Event and User from Database**:

   - The event and user are retrieved from the database to ensure they exist.
   - Example:

     ```javascript
     const existingEvent = await db.getOne(data.eventID, EVENTS_TABLE, {
       year: data.year,
     })
     if (isEmpty(existingEvent))
       throw helpers.notFoundResponse('event', data.eventID, data.year)

     const existingUser = await db.getOne(email, USERS_TABLE)
     if (isEmpty(existingUser)) throw helpers.notFoundResponse('user', email)
     ```

6. **Update Favourite Events List**:

   - The function updates the user's favourite events list based on the `isFavourite` flag.
   - Example:
     ```javascript
     let updateExpression = ''
     let conditionExpression = ''
     if (
       isFavourite &&
       (!favedEventsList || !favedEventsList.includes(eventIDAndYear))
     ) {
       updateExpression = 'add #favedEvents :eventsIDAndYear'
       conditionExpression =
         'attribute_exists(id) and (not contains(#favedEvents, :eventIDAndYear))'
     } else if (
       !isFavourite &&
       favedEventsList &&
       favedEventsList.includes(eventIDAndYear)
     ) {
       updateExpression = 'delete #favedEvents :eventsIDAndYear'
       conditionExpression =
         'attribute_exists(id) and contains(#favedEvents, :eventIDAndYear)'
     } else {
       let successMsg =
         'Already ' + (isFavourite ? 'favourited' : 'unfavourited')
       successMsg += ` event with eventID ${eventID} for the year ${year}`
       callback(null, helpers.createResponse(200, { message: successMsg }))
       return null
     }
     ```

7. **Return Success Response**:

   - The function returns a success response if the event was successfully marked or unmarked as favourite.
   - Example:
     ```javascript
     const res = await docClient.update(params).promise()
     let successMsg = isFavourite ? 'Favourited' : 'Unfavourited'
     successMsg += ` event with eventID ${eventID} for the year ${year}`
     callback(
       null,
       helpers.createResponse(200, { message: successMsg, response: res }),
     )
     ```

8. **Error Handling**:

   - If an error occurs during the process, the function catches the error and returns an appropriate response.
   - Example:
     ```javascript
     catch (err) {
       console.error(err);
       const response = helpers.createResponse(err.statusCode || 500, err);
       callback(null, response);
     }
     ```
