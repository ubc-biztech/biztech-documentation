---
title: Schemas & Access Patterns
nextjs:
  metadata:
    title: Schemas & Access Patterns
    description: Detailed DynamoDB table schemas, Global Secondary Indexes, common access patterns, and db module usage.
---

Detailed schemas for the key DynamoDB tables, the GSIs that power secondary queries, and how to use the db module in your code. {% .lead %}

---

## Key Table Schemas

### biztechEvents

**Keys:** PK = `id` (string), SK = `year` (number)

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | URL-safe slug (e.g., `"blueprint"`, `"kickstart"`) |
| `year` | number | Event year (e.g., `2026`) |
| `ename` | string | Display name (e.g., `"Blueprint 2026"`) |
| `description` | string | Full description |
| `capac` | number | Maximum capacity |
| `startDate` | string | ISO date string |
| `endDate` | string | ISO date string |
| `elocation` | string | Venue name |
| `imageUrl` | string | Event banner image URL (S3) |
| `isPublished` | boolean | Visible to non-admin users |
| `isCompleted` | boolean | Event has concluded |
| `isApplicationBased` | boolean | Requires application to register |
| `pricing` | object | `{ nonMember: number, member: number }` |
| `registrationQuestions` | array | Custom form questions |
| `attendeeFeedbackEnabled` | boolean | Whether attendee feedback is enabled |
| `partnerFeedbackEnabled` | boolean | Whether partner feedback is enabled |
| `attendeeFeedbackQuestions` | array | Attendee feedback form config |
| `partnerFeedbackQuestions` | array | Partner feedback form config |
| `feedback` | string | Legacy external feedback URL (older flow) |

**Access Pattern:** Most queries use `id + year` composite key. List all events uses a full table scan.

---

### biztechUsers

**Keys:** PK = `id` (string = email)

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Email address (primary key) |
| `fname` | string | First name |
| `lname` | string | Last name |
| `email` | string | Same as `id` |
| `admin` | boolean | Auto-set from email domain |
| `isMember` | boolean | Has paid membership |
| `faculty` | string | Faculty/school |
| `major` | string | Area of study |
| `year` | string | Academic year (e.g., `"3rd Year"`) |
| `studentId` | string | Student number |
| `diet` | string | Dietary restrictions |
| `gender` | string | Gender identity |
| `education` | string | Undergrad, Grad, etc. |
| `favEvents` | array | List of favorited event IDs |

---

### biztechRegistrations

**Keys:** PK = `id` (string = email), SK = `eventID;year` (string, e.g., `"blueprint;2026"`)

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | User's email |
| `eventID;year` | string | Composite event key |
| `registrationStatus` | string | One of the registration statuses (see below) |
| `basicInformation` | object | `{ fname, lname }` |
| `dynamicResponses` | object | Answers to custom questions |
| `isPartner` | boolean | Partner vs. attendee registration |
| `applicationStatus` | string | For application-based events |
| `checkoutLink` | string | Stripe payment link (if paid event) |
| `points` | number | Points earned at event |
| `scannedQRs` | array | QR codes the user has scanned |
| `teamID` | string | Team assignment |
| `createdAt` | number | Timestamp of registration |

**Registration Statuses:** `registered`, `waitlist`, `checkedIn`, `incomplete`, `cancelled`, `accepted`, `acceptedPending`, `acceptedComplete`, `rejected`

---

### biztechMembers2026

**Keys:** PK = `id` (string = email)
**GSI:** `profileIDQueryIndex` on `profileID` field

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Email address |
| `profileID` | string | Human-readable profile ID |
| `firstName` | string | First name |
| `pronouns` | string | Preferred pronouns |
| `faculty` | string | Faculty |
| `major` | string | Major |
| `year` | string | Academic year |
| `international` | boolean | International student |
| `prevMember` | boolean | Returning member |
| `education` | string | Education level |
| `heardFrom` | string | How they heard about BizTech |
| `topics` | array | Topics of interest |
| `admin` | boolean | Admin flag |
| `discordId` | string | Discord user ID |

{% callout title="Table Name History" %}
The members table is named `biztechMembers2026` because it was created for the 2025-2026 membership year. Previous years had their own tables (`biztechMembers2025`, etc.). The current table name is set in `constants/tables.js`.
{% /callout %}

---

### biztechProfiles

**Keys:** PK = `id` (string), SK = `eventID;year` (string)

This table stores both profiles and connections:
- **Profile items:** `id` = email-derived ID, `eventID;year` = event context
- **Connection items:** Stored as separate items in the same table with SK = `connection;{otherProfileID}`

| Field | Type | Description |
| --- | --- | --- |
| `profileID` | string | Human-readable ID (e.g., `"SillyPandasDeny"`) |
| `profileType` | string | `EXEC`, `ATTENDEE`, or `COMPANY` |
| `fname` / `lname` | string | Name |
| `pronouns` | string | Pronouns |
| `major` / `year` | string | Academic info |
| `hobby1` / `hobby2` | string | Hobbies |
| `linkedin` | string | LinkedIn URL |
| `profilePictureURL` | string | S3 URL |
| `description` | string | Bio text |
| `viewableMap` | object | Visibility controls for each field |
| `connections` | array | List of connected profile IDs |
| `embedding` | array | OpenAI embedding vector (1536 dimensions) |

---

### biztechTeams

**Keys:** PK = `eventID;year` (string), SK = `id` (string = team ID)

| Field | Type | Description |
| --- | --- | --- |
| `eventID;year` | string | Event composite key |
| `id` | string | Team ID |
| `teamName` | string | Display name |
| `memberEmails` | array | Team member emails |
| `memberNames` | array | Team member names |
| `points` | number | Total points earned |
| `pointsSpent` | number | Points redeemed |
| `scannedQRs` | array | QR codes scanned |
| `inventory` | array | Items/prizes purchased |
| `submission` | string | Project submission link |
| `funding` | number | Investment funding received |

---

### biztechEventFeedback

**Keys:** PK = `id` (string = UUID)
**GSIs:** `event-form-query`, `event-year-query`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Submission UUID |
| `eventID` | string | Event ID |
| `year` | number | Event year |
| `formType` | string | `attendee` or `partner` |
| `eventFormKey` | string | `{eventId};{year};{formType}` |
| `eventIDYear` | string | `{eventId};{year}` |
| `submittedAt` | number | Submission timestamp |
| `responses` | object | Answers keyed by `questionId` |
| `respondentName` | string | Optional name |
| `respondentEmail` | string | Optional email |
| `createdAt` / `updatedAt` | number | Audit timestamps |

**Access Pattern:**
- get all attendee or partner responses for one event via `event-form-query`
- get all feedback for an event/year via `event-year-query`

---

### biztechInstagramAuth

**Keys:** PK = `id` (string)

Used by the Instagram analytics service to persist token state across deploys/runtimes.

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Record key (`primary`) |
| `accessToken` | string | Current long-lived access token |
| `expiresIn` | number | Expiry duration in seconds |
| `expiresAt` | number | Computed absolute expiry timestamp (ms) |
| `refreshedAt` | number | Last refresh timestamp (ms) |
| `source` | string | Refresh source (`manual_refresh`, `scheduled_refresh`, etc.) |

---

## Global Secondary Indexes (GSIs)

GSIs let you query tables by fields other than the primary key.

| Table | Index Name | Key Schema | Used For |
| --- | --- | --- | --- |
| `biztechMembers2026` | `profileIDQueryIndex` | PK: `profileID` | Look up member email by profile ID |
| `biztechInvestments` | `teamInvestmentsIndex` | PK: `teamId` | Get all investments for a team |
| `biztechInvestments` | `investorInvestmentsIndex` | PK: `investorEmail` | Get investor's portfolio |
| `bizWallSockets` | `byEvent` | PK: `eventKey` | Get wall connections per event |
| `bizBtxProjects` | `byEvent` | PK: `eventKey` | Get projects per event |
| `bizBtxHoldings` | `byProject` | PK: `projectId` | Get all holders of a project |
| `bizBtxSockets` | `byEvent` | PK: `eventKey` | Get WebSocket connections per event |

---

## Common Access Patterns

| What You Need | How to Get It |
| --- | --- |
| Get a specific event | `db.getOne(eventId, EVENTS_TABLE, { year })` |
| List all events | `db.scan(EVENTS_TABLE)` |
| Get user's registrations | `db.scan(REGISTRATIONS_TABLE, { id: email })` |
| Get event's registrations | `db.scan(REGISTRATIONS_TABLE, { "eventID;year": key })` |
| Get a user | `db.getOne(email, USERS_TABLE)` |
| Get a member | `db.getOne(email, MEMBERS_TABLE)` |
| Get teams for an event | `db.query({ KeyConditionExpression: "eventID;year = :ey" })` |
| Look up member by profileID | Query the `profileIDQueryIndex` GSI |

---

## Working with the DB Module

### Creating an item

```javascript
import db from "../../lib/db.js";
import { EVENTS_TABLE } from "../../constants/tables.js";

// This uses PutItem with a condition that the item doesn't already exist
await db.create({
  id: "my-event",
  year: 2026,
  ename: "My Event",
}, EVENTS_TABLE);
```

### Reading an item

```javascript
// Single key
const user = await db.getOne(email, USERS_TABLE);

// Composite key (PK + SK)
const event = await db.getOne("blueprint", EVENTS_TABLE, { year: 2026 });
```

### Updating an item

```javascript
// db.updateDB handles reserved words automatically
await db.updateDB(email, { isMember: true, year: "3rd Year" }, USERS_TABLE);
```

### Scanning (listing all items)

```javascript
// Full scan
const allEvents = await db.scan(EVENTS_TABLE);

// Filtered scan
const activeEvents = await db.scan(EVENTS_TABLE, {
  FilterExpression: "isPublished = :pub",
  ExpressionAttributeValues: { ":pub": true },
});
```

{% callout type="warning" title="Scans Are Expensive" %}
DynamoDB scans read the entire table. This is fine for small tables but should be avoided for large ones. Prefer `query` with key conditions when possible.
{% /callout %}

---

## Local DynamoDB

For local development, we use DynamoDB Local (a Java application that emulates DynamoDB).

### Seeding local data

```bash
node scripts/initlocal.js
```

This script reads the actual table schemas and data from AWS and recreates them locally. You need valid AWS credentials for this.

### Viewing local data

You can use the AWS CLI to query local DynamoDB:

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Scan a table
aws dynamodb scan --table-name biztechEvents --endpoint-url http://localhost:8000
```

Or use a GUI like [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html).
