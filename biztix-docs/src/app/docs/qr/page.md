---
title: QR API
nextjs:
  metadata:
    title: QR Serivce Documentation
    description: Detailed documentation for the QR service
    url: https://github.com/ubc-biztech/serverless-biztechapp/blob/master/services/qr/handler.js
---

The `QR` API service allows admin to create QR codes for many purposes.

[Code found here](https://github.com/ubc-biztech/serverless-biztechapp/blob/master/services/qr/handler.js)

---

## Endpoint - Post /qrscan

The `qrscan` API endpoint is used to handle a qr scan from the user. It updates the corresponding registration.

```
POST /qrscan
```

### Method

Uses the `handler.post` method

### Request Body

The request body must contain a JSON object with the following properties:

- `qrCodeID` (string, required)
- `eventID` (string required)
- `year` (number, required)
- `email` (string, required)
- `negativePointsConfirmed` (boolean, required)
- `admin` (boolean, optional)events.

### Response

```json
{
  "message": "message",
  "response": {
    "current_points": userRegistration.points,
    "redeemed_points": qr.points,
    "redemption_type": "user",
    "qr_data": qr.data,
    ...
  }
}
```

### Internals

1. Checks if the QR code is valid, if so, sends control flow to process this qr redemption
2. Processes a QR code redemption via DynamoDB — adds points to user's event registration (Registration table), adds the QR code key as being used (Registration table), then returns updated progress.

- If QR is type partner, then users can only redeem this qr points once.
- Validates that user has not already scanned the QR code (unless unlimited scans allowed)
- updates their registration with the new points
- opens a socket connection to companion app to update live leaderboards

## Endpoint - GET /qr

```
GET /qr
```

### Method

Uses the `handler.get` method

### Request Parameters

n/a

### Response

```json
{ "body": [list of qr data]}
```

### Internals

1. Gets all qrs from QRS_TABLE

## Endpoint - GET /qr/{id}/{eventID}/{year}

```
GET /qr/{id}/{eventID}/{year}
```

### Method

Uses the `handler.getOne` method

### Request Params

- `id` (string, required) - id of qr code
- `eventID` (string, required)
- `year` (number, required)

### Response

```json
{ "body": qr}
```

### Internals

1. Gets specific qr code

## Endpoint - POST /qr

```
POST /qr
```

### Method

Uses the `handler.create` method

### Request Body

The request body must contain a JSON object with the following properties:

- `id` (string, required)
- `eventID` (string required)
- `year` (number, required)
- `points` (number, optional)
- `type` (string, required)
- `data` (object, optional)

### Response

```json
{
  "message": "message",
  "response": db_response,
  "item": qr
}
```

### Internals

1. Creates new qr if not exist

## Endpoint - PATCH /qr/{id}/{eventID}/{year}

```
PATCH /qr/{id}/{eventID}/{year}
```

### Method

Uses the `handler.update` method

### Request Params

- `id` (string, required) - id of qr code
- `eventID` (string, required)
- `year` (number, required)

### Request Body

The request body must contain a JSON object with the following properties:

- `points` (number, optional)
- `type` (string, optional)
- `data` (object, optional)

### Response

```json
{
  "message": "message",
  "response": res
}
```

### Internals

1. Updates qr data

## Endpoint - DELETE /qr/{id}/{eventID}/{year}

```
DELETE /qr/{id}/{eventID}/{year}
```

### Method

Uses the `handler.delete` method

### Request Params

- `id` (string, required) - id of qr code
- `eventID` (string, required)
- `year` (number, required)

### Response

```json
{
  "message": "message",
  "response": res
}
```

### Internals

1. Deletes the qr if exists.
