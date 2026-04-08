---
title: 'Core APIs: Events, Registrations, Users, Members'
nextjs:
  metadata:
    title: Core APIs
    description: Endpoint reference for Events, Registrations, Users, and Members services.
---

The fundamental CRUD endpoints for events, registrations, users, and members. {% .lead %}

---

## Events

Manage events: create, read, update, delete, image upload, and built-in feedback forms.

| Method   | Path                                                       | Auth | Description                                 |
| -------- | ---------------------------------------------------------- | ---- | ------------------------------------------- |
| `POST`   | `/events`                                                  | 🔓   | Create a new event                          |
| `GET`    | `/events`                                                  | 🔓   | List all events                             |
| `GET`    | `/events/{eventId}/{year}`                                 | 🔓   | Get a single event                          |
| `PATCH`  | `/events/{eventId}/{year}`                                 | �    | Update an event (admin only)                |
| `DELETE` | `/events/{eventId}/{year}`                                 | 🔑   | Delete an event (admin only)                |
| `GET`    | `/events/getActiveEvent`                                   | 🌐   | Get the nearest upcoming event              |
| `POST`   | `/events/event-image-upload-url`                           | 🔑   | Get a presigned S3 URL for image upload     |
| `GET`    | `/events/{eventId}/{year}/feedback/{formType}`             | 🌐   | Get attendee/partner feedback form metadata |
| `POST`   | `/events/{eventId}/{year}/feedback/{formType}`             | 🌐   | Submit attendee/partner feedback            |
| `GET`    | `/events/{eventId}/{year}/feedback/{formType}/submissions` | 🔑   | Admin: list feedback submissions            |

### POST /events: Create Event

**Request Body:**

| Field                       | Type    | Required | Description                             |
| --------------------------- | ------- | -------- | --------------------------------------- |
| `id`                        | string  | ✅       | Event slug (e.g., `"blueprint"`)        |
| `year`                      | number  | ✅       | Event year (e.g., `2026`)               |
| `ename`                     | string  | ✅       | Display name                            |
| `description`               | string  |          | Event description                       |
| `capac`                     | number  |          | Max capacity                            |
| `startDate`                 | string  |          | ISO date string                         |
| `endDate`                   | string  |          | ISO date string                         |
| `elocation`                 | string  |          | Venue location                          |
| `imageUrl`                  | string  |          | Event banner image URL                  |
| `isPublished`               | boolean |          | Whether visible to users                |
| `isApplicationBased`        | boolean |          | Requires application to register        |
| `pricing`                   | object  |          | `{ nonMember: number, member: number }` |
| `registrationQuestions`     | array   |          | Custom registration form questions      |
| `attendeeFeedbackEnabled`   | boolean |          | Enable attendee feedback form           |
| `partnerFeedbackEnabled`    | boolean |          | Enable partner feedback form            |
| `attendeeFeedbackQuestions` | array   |          | Attendee feedback question config       |
| `partnerFeedbackQuestions`  | array   |          | Partner feedback question config        |

### GET /events/{eventId}/{year}

Supports optional query parameters:

- `?count=true` includes registration count
- `?users=true` includes full user details for each registration

**Response:** Full event object with all fields above, plus `isCompleted` flag.

### GET /events/getActiveEvent

Returns the single event with the closest future `startDate`. No auth required, used for landing pages and the frontend home dashboard.

---

## Registrations

Handle event registration, check-in, waitlisting, and bulk operations.

| Method   | Path                             | Auth | Description                            |
| -------- | -------------------------------- | ---- | -------------------------------------- |
| `POST`   | `/registrations`                 | 🌐   | Register for an event                  |
| `PUT`    | `/registrations/{email}/{fname}` | 🔓   | Update a registration                  |
| `GET`    | `/registrations`                 | 🔓   | List registrations (with filters)      |
| `DELETE` | `/registrations/{email}`         | 🔓   | Delete a single registration           |
| `DELETE` | `/registrations`                 | 🔑   | Bulk delete registrations (admin only) |
| `GET`    | `/registrations/leaderboard`     | 🔓   | Event leaderboard (points)             |
| `PUT`    | `/registrations/massUpdate`      | 🔑   | Bulk update registrations (admin only) |

### POST /registrations: Register

**Request Body:**

| Field              | Type    | Required | Description                              |
| ------------------ | ------- | -------- | ---------------------------------------- |
| `eventID`          | string  | ✅       | Event ID                                 |
| `year`             | number  | ✅       | Event year                               |
| `email`            | string  | ✅       | User's email                             |
| `basicInformation` | object  |          | `{ fname, lname }`                       |
| `dynamicResponses` | object  |          | Answers to custom registration questions |
| `isPartner`        | boolean |          | Whether this is a partner registration   |

**What happens on registration:**

1. Checks if event exists and has capacity
2. If full → auto-sets status to `waitlist`
3. Creates registration record
4. Sends QR code email via SendGrid
5. Sends calendar invite (ICS file)
6. Sends SNS notification to Slack

### Registration Statuses

| Status             | Description                                     |
| ------------------ | ----------------------------------------------- |
| `registered`       | Confirmed registration                          |
| `waitlist`         | On the waitlist (event at capacity)             |
| `checkedIn`        | Checked in at event                             |
| `incomplete`       | Started but didn't finish registration          |
| `cancelled`        | Cancelled by user or admin                      |
| `accepted`         | Application accepted (application-based events) |
| `acceptedPending`  | Accepted, awaiting payment                      |
| `acceptedComplete` | Accepted and paid                               |
| `rejected`         | Application rejected                            |

### GET /registrations: Query Filters

| Query Param    | Description                   |
| -------------- | ----------------------------- |
| `eventID`      | Filter by event ID            |
| `year`         | Filter by year                |
| `email`        | Filter by user email          |
| `eventID;year` | Filter by composite event key |

---

## Users

User account management.

| Method   | Path                      | Auth | Description             |
| -------- | ------------------------- | ---- | ----------------------- |
| `POST`   | `/users`                  | 🔓   | Create user             |
| `GET`    | `/users/check/{email}`    | 🌐   | Check if user exists    |
| `GET`    | `/users/isMember/{email}` | 🌐   | Check membership status |
| `GET`    | `/users/{email}`          | 🔓   | Get user details        |
| `GET`    | `/users`                  | 🔑   | List all users (admin)  |
| `PATCH`  | `/users/{email}`          | 🔓   | Update user             |
| `PATCH`  | `/users/favEvent/{email}` | 🔓   | Toggle favorite event   |
| `DELETE` | `/users/{email}`          | 🔓   | Delete user             |

### User Schema

| Field       | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| `id`        | string  | Email address (primary key)                  |
| `fname`     | string  | First name                                   |
| `lname`     | string  | Last name                                    |
| `email`     | string  | Email address                                |
| `admin`     | boolean | Auto-set if email contains `@ubcbiztech.com` |
| `isMember`  | boolean | Has active membership                        |
| `faculty`   | string  | Faculty/school                               |
| `major`     | string  | Area of study                                |
| `year`      | string  | Academic year                                |
| `studentId` | string  | Student number                               |
| `diet`      | string  | Dietary restrictions                         |
| `gender`    | string  | Gender identity                              |
| `education` | string  | Education level                              |
| `favEvents` | array   | Favorited event IDs                          |

{% callout title="Immutable Fields" %}
The `id` and `email` fields cannot be changed after creation. The `admin` field is auto-detected from the email domain.
{% /callout %}

---

## Members

Club membership CRUD.

| Method   | Path                             | Auth | Description                                                           |
| -------- | -------------------------------- | ---- | --------------------------------------------------------------------- |
| `POST`   | `/members`                       | 🔓   | Create member                                                         |
| `GET`    | `/members/{email}`               | 🔓   | Get member by email                                                   |
| `GET`    | `/members/profileID/{profileID}` | 🔓   | Get member email by profile ID                                        |
| `GET`    | `/members`                       | 🔑   | List all members (admin)                                              |
| `PATCH`  | `/members/{email}`               | 🔓   | Update member                                                         |
| `DELETE` | `/members/{email}`               | 🔓   | Delete member                                                         |
| `POST`   | `/members/grant`                 | 🔑   | Admin: grant membership (creates user + member + profile in one call) |

### Member Schema

| Field           | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| `id`            | string  | Email address (primary key)             |
| `profileID`     | string  | Human-readable profile identifier       |
| `firstName`     | string  | First name                              |
| `pronouns`      | string  | Preferred pronouns                      |
| `faculty`       | string  | Faculty                                 |
| `major`         | string  | Major                                   |
| `year`          | string  | Academic year                           |
| `international` | boolean | International student status            |
| `prevMember`    | boolean | Was a member before                     |
| `education`     | string  | Education level (undergrad, grad, etc.) |
| `heardFrom`     | string  | How they heard about BizTech            |
| `topics`        | array   | Topics of interest                      |
| `admin`         | boolean | Admin status                            |
| `discordId`     | string  | Discord user ID                         |
