---
title: "Profile & Social APIs: Profiles, Interactions, Quests, Quizzes"
nextjs:
  metadata:
    title: Profile & Social APIs
    description: Endpoint reference for Profiles, Interactions, Quests, and Quizzes services.
---

The social and engagement layer: public profiles, NFC connections, quests, and the BluePrint MBTI quiz. {% .lead %}

---

## Profiles

Public profile system with visibility controls.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/profiles` | 🔓 | Create profile |
| `GET` | `/profiles/profile/{profileID}` | 🌐 | Get public profile |
| `GET` | `/profiles/user` | 🔓 | Get own profile |
| `PATCH` | `/profiles/{profileID}` | 🔓 | Update profile |
| `POST` | `/profiles/upload` | 🔓 | Get presigned URL for profile picture |
| `POST` | `/profiles/partner/partial` | 🔓 | Create partial partner profile |
| `POST` | `/profiles/company` | 🔓 | Create company profile |
| `POST` | `/profiles/company/link-partner` | 🔓 | Link partner to company |
| `POST` | `/profiles/partner/sync` | 🔓 | Sync partner registration data to profiles |

### Profile Schema

| Field | Type | Public | Description |
| --- | --- | --- | --- |
| `profileID` | string | ✅ | Human-readable ID (e.g., "SillyPandasDeny") |
| `profileType` | string | ✅ | `EXEC`, `ATTENDEE`, or `COMPANY` |
| `fname` | string | ✅ | First name |
| `lname` | string | ✅ | Last name |
| `pronouns` | string | ✅ | Preferred pronouns |
| `year` | string | ✅ | Academic year |
| `major` | string | ✅ | Area of study |
| `hobby1` / `hobby2` | string | Configurable | Hobbies |
| `funQuestion1` / `funQuestion2` | string | Configurable | Ice-breaker answers |
| `linkedin` | string | Configurable | LinkedIn URL |
| `profilePictureURL` | string | Configurable | Profile picture URL |
| `description` | string | Configurable | Bio |
| `viewableMap` | object | - | Controls which fields are publicly visible |

The `viewableMap` is an object where each key is a field name and the value is `true`/`false`. When fetching a public profile (`/profiles/profile/{profileID}`), only fields marked `true` in the viewable map are returned.

---

## Interactions

NFC-based connections and real-time connection wall.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/interactions/search` | 🔓 | Algolia-powered profile search |
| `POST` | `/interactions/connection` | 🔓 | Create a connection between two profiles |
| `GET` | `/interactions/check/{profileID}` | 🔓 | Check if connected to a profile |
| `GET` | `/interactions/journal` | 🔓 | Get all your connections |
| `GET` | `/interactions/quests/{eventId}/{year}` | 🔓 | Get quest progress |
| `GET` | `/interactions/wall/{eventId}/{year}` | 🔓 | Get connection wall snapshot |

### WebSocket (Connection Wall)

| Route | Description |
| --- | --- |
| `$connect` | Register for real-time wall updates |
| `$disconnect` | Unregister |
| `wall` | Receive new connections broadcast |

WebSocket URL: `wss://bn27jq3bal.execute-api.us-west-2.amazonaws.com/prod`

---

## Quests

Achievement tracking system for events.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `PATCH` | `/quests/{eventId}/{year}` | 🔓 | Update quest progress |
| `GET` | `/quests/{eventId}/{year}` | 🔓 | Get user's quests |
| `GET` | `/quests/all/{eventId}/{year}` | 🔓 | Admin: all users' quests |
| `GET` | `/quests/kiosk/{eventId}/{year}` | 🌐 | Kiosk display view |

### Quest Types

| Type | How It Completes |
| --- | --- |
| `COUNTER` | Increment toward a target number (e.g., "Make 5 connections") |
| `UNIQUE_SET` | Collect unique items (e.g., "Talk to 6 different companies") |

Quest events that trigger updates: `NEW_CONNECTION`, `RECOMMENDED_CONNECTION`, `COMPANY_VISIT`.

---

## Quizzes

MBTI personality quiz system built for BluePrint

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/quizzes` | 🔓 | Submit quiz answers |
| `GET` | `/quizzes/{email}/{eventId}/{year}` | 🌐 | Get personality report |
| `GET` | `/quizzes/results/{eventId}/{year}` | 🔓 | All quiz results for event |
| `GET` | `/quizzes/stats/{eventId}/{year}` | 🔓 | MBTI distribution stats |
| `GET` | `/quizzes/type/{mbtiType}/{eventId}/{year}` | 🔓 | Profiles by MBTI type |
| `POST` | `/quizzes/wrapped` | 🔓 | Generate wrapped summary |
