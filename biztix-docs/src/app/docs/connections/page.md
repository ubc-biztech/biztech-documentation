---
title: Connections API
nextjs:
  metadata:
    title: Connections API
    description: This service is responsible for creating bidirectional edges to connect users, and to fetch all relevant connections for any single user.
---

These endpoints are responsible for creating bidirectional edges to connect users, and to fetch all relevant connections for any single user.

## POST /interactions
*this endpoint is used to create an interaction between two users, resulting in two rows that are bi-directional edges*

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |


| Body       | Description                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventType  | eventType refers to the type of interaction that is being posted to the database. since rewriting the profiles service, quests and workshops have been deprecated. For our purposes, this should only be set to "CONNECTION" for now. |
| eventParam | eventParam is the generic argument to be passed for each event (typically an ID). For a connection, it will be the profile ID (not an email, a humanID) to form a connection with someone                                             |
*example request*
```javascript
{
    "eventType": "CONNECTION",
    "eventParam": "SixVansSort"
}
```

**Response**

*the response is intended for debugging purposes, as it does not hold meaningful information that isn't communicated in the response status*

example response
```javascript
{
    "message": "Connection created with firstname",
    "name": "firstname lastname"
}
```



## GET /interactions/journal
*this endpoint is used to fetch all connections for a single user. A connection "journal".*

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

**Response**

*All connections will include the fields in the following response. Note that by default, all connections will be sorted from most to least recent in the response*

example response
```javascript
{
    "message": "all connections for kevin.xiao27@gmail.com",
    "data": [
        {
            "compositeID": "PROFILE#SillyPandasDeny", // this profileID belongs to the user making the request
            "fname": "firstname",
            "pronouns": "",
            "year": "Not Applicable",
            "createdAt": 1754717442711,
            "connectionID": "SixVansSort",
            "major": "Awesome",
            "lname": "lastname",
            "type": "CONNECTION#SixVansSort" // this profileID belongs to a connection
        }
    ]
}
```

## GET /interactions/journal/{id}
*this endpoint is used to check if the authenticated user is connected with a profile of a specific ID*

**Request**


| Path Variables | Type   | Description         |
| -------------- | ------ | ------------------- |
| {id}           | string | profileID of a user |

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

**Response**
*The response will return a boolean field, connection. This will indicate if two users are connected. There are some specific behaviours which may also have an additional message field which is typically used for debugging.*

Some behaviour to note is that this endpoint will return false if a user checks their own profile, they aren't a member, or the profile requested doesn't exist. Some of this is based on vacuous logic (i.e. if a user isn't a member, by definition they can't be connected), but may need explicit handling in the frontend.

**Example Response**
```javascript
{
    "message": "No profile associated with kevin@ubcbiztech.com",
    "connected": false
}
```

**Errors**
- 400 means that the user has attempted to check if they have a connection with themselves



## GET /interactions/quests 🚧
{% callout type="warning" title="Deprecated" %}
*currently deprecated... more infrastructure of new profiles needs to be built to support quests and badges at the moment*
{% /callout %}

