---
title: 'NFC: Connections, Errors & Testing'
nextjs:
  metadata:
    title: 'NFC: Connections, Errors & Testing'
    description: 'How NFC cards create connections, component hierarchy, database records, error handling, and local testing guide.'
---


This page covers how NFC cards create connections on the Live Wall, the component hierarchy, database records, error handling, and how to test everything locally.

---

## How NFC Creates Connections

After someone gets their NFC card, here's what happens when they tap it with another person:

1. **Person A taps Person B's NFC card** with their phone
2. The phone reads the URL: `https://app.ubcbiztech.com/profile/UUID?scan=true`
3. The browser opens Person B's profile page
4. The profile page detects `?scan=true` and triggers the connection API:
   ```
   POST /interactions
   { eventType: "CONNECTION", eventParam: "PERSON_B_PROFILE_ID" }
   ```
5. The backend:
   - Looks up both users' profiles
   - Creates bidirectional connection records
   - Broadcasts to the Live Wall via WebSocket
6. The connection appears on the Live Wall in real-time!

---

## Component Hierarchy

```
EventsDashboard (admin page)
  └── QrCheckIn
       ├── QrReader (camera component from react-qr-reader)
       └── NfcPopup (shown after successful check-in)
            ├── NfcPopupContent (normal flow - shows "Write to Card" button)
            │    └── NFCWriter (opened when button is tapped)
            └── DeviceNotSupported (fallback - shows URL to copy)
```

---

## Database Records

### Member Card Count

The member's card count is tracked in the members table:

```json
{
  "id": "benny@student.ubc.ca",
  "profileID": "abc-123-def",
  "cardCount": 1,
  "...other fields"
}
```

When a card is written, `cardCount` is incremented via `PATCH /members/{email}`.

### Profile Connection Records

Connections are stored in the profiles table with composite keys:

```
PK: PROFILE#<userProfileID>
SK: CONNECTION#<otherProfileID>
```

Each record includes the connected person's name, major, year, company, pronouns, and the timestamp.

---

## Error Handling

The system handles many edge cases:

| Scenario | Handling |
|----------|---------|
| Device doesn't support NFC | Shows URL with copy button |
| NFC tag not detected within 10s | Shows timeout error with retry button |
| NFC write fails | Shows error with retry button |
| User not a member | Shows "non_member" state |
| User already has a card | Shows "completed" state (can still write if needed) |
| Wrong event QR code | Shows error with specific message |
| Already checked in | Shows "already checked in" error |
| Registration cancelled | Shows cancellation error |
| Waitlisted user | Shows waitlist error |
| Network error during check-in | Shows internal server error |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Event Check-In Flow                 │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ QR Code  │───→│ QrCheckIn│───→│ PUT /registr. │  │
│  │ (camera) │    │ validate │    │ (check in)    │  │
│  └──────────┘    └──────────┘    └───────────────┘  │
│                       │                              │
│                       ↓                              │
│                  ┌──────────┐                        │
│                  │ NfcPopup │                        │
│                  │          │                        │
│     ┌────────── │ Needs    │──────────┐             │
│     │  No NFC   │ card?    │  Has NFC │             │
│     ↓           └──────────┘    ↓                    │
│  ┌──────────┐              ┌──────────────┐         │
│  │ Copy URL │              │  NFCWriter   │         │
│  │ fallback │              │              │         │
│  └──────────┘              │ scan → write │         │
│                            │ → PATCH /mem │         │
│                            └──────────────┘         │
└─────────────────────────────────────────────────────┘

              NFC Card Connection Flow

  ┌──────────┐    ┌──────────────┐    ┌────────────┐
  │  Phone   │───→│ Profile Page │───→│ POST       │
  │ reads    │    │ ?scan=true   │    │ /interact. │
  │ NFC tag  │    └──────────────┘    └─────┬──────┘
  └──────────┘                              │
                                            ↓
                              ┌──────────────────────┐
                              │ interactions service  │
                              │ ├─ Save connection    │
                              │ ├─ Broadcast via WS   │
                              │ └─ Log for wall       │
                              └──────────────────────┘
                                            │
                                            ↓
                              ┌──────────────────────┐
                              │  Live Connection Wall │
                              │  (new edge appears!)  │
                              └──────────────────────┘
```

---

## Local Development & Testing

### Testing QR Check-In

You can generate a test QR code using any QR code generator with the format:

```
testemail@test.com;your-event-id;2025;TestName
```

Make sure:
- The event ID and year match what's in your local events
- The email exists in your registrations data
- The registration status is not "checkedIn"

### Testing NFC Writing

NFC writing requires a physical Android device with NFC support. For development:

1. Use Chrome on an Android phone
2. Navigate to the dev version of the app
3. Use a blank NFC tag (NTAG213/215/216 work well)
4. Hold the tag against the back of the phone when prompted

{% callout type="note" title="Can't test NFC on desktop" %}
Since Web NFC only works on Chrome for Android, you can't test NFC writing on your laptop. The system detects this and shows the fallback UI with the copyable URL. You can test the rest of the flow (QR scanning, check-in API calls, popup UI) on desktop.
{% /callout %}

### Simulating NFC Connections

To test the connection flow without physical NFC cards:

1. Open two browser tabs
2. Navigate to `POST /interactions` endpoint via an API client (Postman, curl)
3. Send a connection request with two valid profile IDs
4. Watch the Live Wall update in real-time

---

## Tips for New Developers

- **NFC is Chrome Android only**, which is a browser limitation, not something you can fix. Always provide a fallback.
- **The QR format is simple**: it's just `email;eventId;year;firstName` separated by semicolons. Easy to generate for testing.
- **Card count tracking** is best-effort. The `PATCH /members` call is wrapped in a try/catch and won't block the success flow if it fails.
- **The NFC URL includes `?scan=true`** and this parameter is crucial. Without it, the profile page won't trigger the connection flow.
- **Always clean up NFC listeners**: the `NFCWriter` component carefully removes event listeners and clears timeouts on unmount to prevent memory leaks.
- **DiceBear avatars**: when a user doesn't have a profile picture, the popup generates a consistent avatar using `api.dicebear.com` seeded with their UUID. Same UUID always produces the same avatar.
