---
title: Profiles API
nextjs:
  metadata:
    title: Profiles API
    description: Detailed explanation of the profile's endpoints and purposes
---



*This service is responsible for creating user/attendee profiles, allowing users to view/update their own profile, and providing a public endpoint to view what a user has allowed to be viewable*

___

## POST /profiles
this endpoint creates a profile based on the email provided by the authorization token. in general this should not be used (but may be necessary for execs to set up profiles for execs... in the current state of the registration flow \[only attendee payments will automatically create a profile for them])

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |
*no body required*

**Response**

```json
{
	message: "Created profile for [email]"
	profile: {
		... // entire user profile. see GET /profiles/user to see what this returns
	}
}
```

___
## GET /profiles/profile/{profileID}
*this endpoint is used to display public information about profiles depending on what the original user has inputted. ProfileID is not a userID, it will look like a HumanID (e.g. SillyPandasDeny) instead of an email

**Request**

*no body or headers required*


**Response**

| Properties        | Description                                                        | Required? |
| ----------------- | ------------------------------------------------------------------ | --------- |
| profileType       | EXEC \|\| ATTENDEE                                                 | Y         |
| fname             | first name                                                         | Y         |
| lname             | last name                                                          | Y         |
| pronouns          | e.g. "He/Him"                                                      | Y         |
| year              | string, not int                                                    | Y         |
| major             | string                                                             | Y         |
| hobby1            |                                                                    | N         |
| hobby2            |                                                                    | N         |
| funQuestion1      | question is not provided. <br>may need to be hardcoded on frontend | N         |
| funQuestion2      | ditto                                                              | N         |
| linkedin          | linkedin url                                                       | N         |
| profilePictureURL |                                                                    | N         |
| additionalLink    | any link                                                           | N         |
| description       |                                                                    | N         |


Example Response
GET /profiles/profile/BENNYchin
```json
{
    "profileType": "EXEC",
    "lname": "Chinvanich",
    "fname": "Benny",
    "pronouns": "",
    "year": "5th Year",
    "major": "BUCS"
}
```

___

## GET /profiles/user/
*this endpoint returns all available information, including whether a user has opted to display something as visible or not. viewableMap has some attributes that will never change regardless of what is sent in an update.*

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |
*no body required*

**Response**

| Properties        | Description                                                                                                     | Required? |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | --------- |
| profileType       | EXEC \|\| ATTENDEE                                                                                              | Y         |
| fname             | first name                                                                                                      | Y         |
| lname             | last name                                                                                                       | Y         |
| pronouns          | e.g. "He/Him"                                                                                                   | Y         |
| year              | string, not int                                                                                                 | Y         |
| major             | string                                                                                                          | Y         |
| viewableMap       | {\[string]: boolean}<br>map of keys to whether<br>they will be returned in<br>GET /profiles/profile/{profileID} | Y         |
| hobby1            |                                                                                                                 | N         |
| hobby2            |                                                                                                                 | N         |
| funQuestion1      | question is not provided. <br>may need to be hardcoded on frontend                                              | N         |
| funQuestion2      | ditto                                                                                                           | N         |
| linkedin          | linkedin url                                                                                                    | N         |
| profilePictureURL |                                                                                                                 | N         |
| additionalLink    | any link                                                                                                        | N         |
| description       |                                                                                                                 | N         |
```json
{
    "viewableMap": {
        "profilePictureURL": false,
        "fname": true,
        "hobby2": false,
        "year": true,
        "description": false,
        "linkedIn": false,
        "additionalLink": false,
        "lname": true,
        "major": true,
        "pronouns": true,
        "hobby1": false,
        "funQuestion2": false,
        "funQuestion1": false
    },
    "linkedIn": "",
    "additionalLink": "",
    "hobby1": "",
    "createdAt": 1754072664036,
    "hobby2": "",
    "profileType": "ATTENDEE",
    "lname": "Xiao",
    "compositeID": "PROFILE#SillyPandasDeny",
    "profilePictureURL": "",
    "fname": "Kevin",
    "updatedAt": 1754072664036,
    "pronouns": "He/Him",
    "funQuestion2": "",
    "year": "3rd Year",
    "major": "BUCS",
    "funQuestion1": "",
    "description": "",
    "type": "PROFILE"
}
```

___
## PATCH /profiles/user/

**Request**

**Headers**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

**Body**

| Properties        | Description                                                                                                                                                                                       | Required? |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| viewableMap       | {\[string]: boolean}<br>only changing the boolean for<br>attributes listed below will<br>change visibility.<br>However, sending at least an<br>empty object to indicate no<br>updates is required | Y         |
| hobby1            | accepts string                                                                                                                                                                                    | N         |
| hobby2            | accepts string                                                                                                                                                                                    | N         |
| funQuestion1      | accepts string                                                                                                                                                                                    | N         |
| funQuestion2      | accepts string                                                                                                                                                                                    | N         |
| linkedin          | accepts string                                                                                                                                                                                    | N         |
| profilePictureURL | accepts string                                                                                                                                                                                    | N         |
| additionalLink    | accepts string                                                                                                                                                                                    | N         |
| description       | accepts string                                                                                                                                                                                    | N         |

**Example Request**
```json
{
    "viewableMap": {
        "description": true
    },
    "description": "testing description"
}
```

**Response**

Generally the response to this api is not useful except for the status code of the request.
However, if for whatever reason you are curious, this is what would be returned from the previous request

```json
{
    "message": "successfully updated profile: kevin.xiao27@gmail.com",
    "data": {
        "$metadata": {
            "httpStatusCode": 200,
            "requestId": "0MV421CSR3HGPRGMHMN9H34V8JVV4KQNSO5AEMVJF66Q9ASUAAJG",
            "attempts": 1,
            "totalRetryDelay": 0
        },
        "Attributes": {
            "description": "testing description",
            "updatedAt": 1754641371934,
            "viewableMap": {
                "profilePictureURL": false,
                "fname": true,
                "hobby2": false,
                "year": true,
                "description": true,
                "linkedIn": false,
                "additionalLink": false,
                "lname": true,
                "major": true,
                "pronouns": true,
                "hobby1": false,
                "funQuestion2": false,
                "funQuestion1": false
            }
        }
    }
}
```
