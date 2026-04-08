---
title: Connections API
nextjs:
  metadata:
    title: Connections API
    description: This service is responsible for creating bidirectional edges to connect users, and to fetch all relevant connections for any single user.
---

These endpoints are responsible for creating bidirectional edges to connect users, and to fetch all relevant connections for any single user.

## Where Connections Are Stored

Connections live in the `biztechProfiles` DynamoDB table (constant `PROFILES_TABLE`). Each connection creates **two rows** — one for each direction — using composite keys:

| Key | Attribute     | Pattern                        |
| --- | ------------- | ------------------------------ |
| PK  | `compositeID` | `PROFILE#<ownerProfileID>`     |
| SK  | `type`        | `CONNECTION#<targetProfileID>` |

Each record stores a denormalized snapshot: `connectionID`, `connectionType` (`ATTENDEE` / `PARTNER` / `EXEC`), `fname`, `lname`, `pronouns`, `major`, `year`, `company`, `title`, `createdAt`.

To query all connections for a user: `compositeID = "PROFILE#<id>" AND begins_with(type, "CONNECTION#")`.

Handler: `services/interactions/handler.js`. See also [NFC Connections & Testing](/docs/deep-dives/nfc-cards/connections) for how NFC tap triggers connections.

---

## POST /interactions

_this endpoint is used to create an interaction between two users, resulting in two rows that are bi-directional edges_

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

| Body       | Description                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eventType  | eventType refers to the type of interaction that is being posted to the database. since rewriting the profiles service, quests and workshops have been deprecated. For our purposes, this should only be set to "CONNECTION" for now. |
| eventParam | eventParam is the generic argument to be passed for each event (typically an ID). For a connection, it will be the profile ID (not an email, a humanID) to form a connection with someone                                             |

_example request_

```javascript
{
    "eventType": "CONNECTION",
    "eventParam": "SixVansSort"
}
```

**Response**

_the response is intended for debugging purposes, as it does not hold meaningful information that isn't communicated in the response status_

example response

```javascript
{
    "message": "Connection created with firstname",
    "name": "firstname lastname"
}
```

## GET /interactions/journal

_this endpoint is used to fetch all connections for a single user. A connection "journal"._

**Request**

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

#### Query Parameters (optional)

You may optionally filter connections by **event** and/or **year** using query string parameters.

| Parameter | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| eventId   | string | Filters connections associated with a specific event |
| year      | string | Filters connections by event year                    |

### Example request

`GET /interactions/journal`

`GET /interactions/journal?eventId=blueprint&year=2025`

**Response**

_All connections will include the fields in the following response. Note that by default, all connections will be sorted from most to least recent in the response_

### Example response

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

_this endpoint is used to check if the authenticated user is connected with a profile of a specific ID_

**Request**

| Path Variables | Type   | Description         |
| -------------- | ------ | ------------------- |
| {id}           | string | profileID of a user |

| Headers       | Type         |
| ------------- | ------------ |
| Authorization | Bearer Token |

**Response**
_The response will return a boolean field, connection. This will indicate if two users are connected. There are some specific behaviours which may also have an additional message field which is typically used for debugging._

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

## GET /interactions/quests

{% callout type="warning" title="Under construction" %}
This endpoint is not yet fully implemented.
{% /callout %}

{% callout type="warning" title="Deprecated" %}
_currently deprecated... more infrastructure of new profiles needs to be built to support quests and badges at the moment_
{% /callout %}

## POST /interactions/search

_this endpoint is used to semantically search a user’s connections based on a free-text query._

This endpoint allows an authenticated user to search through their existing connections using natural language. It is typically backed by semantic or embedding-based search, rather than exact keyword matching.

**Request**

| Headers       | Type             |
| ------------- | ---------------- |
| Authorization | Bearer Token     |
| Content-Type  | application/json |

| Body  | Type   | Description                                                                           |
| ----- | ------ | ------------------------------------------------------------------------------------- |
| query | string | A free-text query describing the type of people or connections the user wants to find |

### Example request

```bash
curl -X POST "https://api-dev.ubcbiztech.com/interactions/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "query": "I want to meet Lumeno AI interns"
  }'

```
