---
title: 'NFC: QR Code Check-In'
nextjs:
  metadata:
    title: 'NFC: QR Code Check-In'
    description: 'How the QR code scanning and event check-in system works, including validation, API calls, and UI feedback.'
---


This page covers Part 1 of the NFC & QR system: the QR code check-in flow that admins use to check attendees into events.

---

## How QR Codes Work

When someone registers for a BizTech event, they receive a QR code in their email. This QR code contains a semicolon-separated string:

```
email;eventId;year;firstName
```

For example:

```
ashley@student.ubc.ca;kickstart;2025;Ashley
```

---

## The QrCheckIn Component

`QrScanner.tsx` contains the `QrCheckIn` component that handles the entire check-in flow. It uses the `react-qr-reader` library to access the device camera.

### Props

```typescript
interface QrProps {
  event: { id: string; year: string };  // Current event
  rows: Registration[];                   // All registrations for this event
  isQrReaderToggled: boolean;            // Whether scanner is visible
  setQrReaderToggled: (v: boolean) => void;
}
```

### Scan Stages

The scanner goes through different stages, each with its own visual feedback:

| Stage | Color | Meaning |
|-------|-------|---------|
| `SCANNING` | Green | Ready to scan, waiting for QR code |
| `SUCCESS` | Green | Check-in succeeded |
| `FAILED` | Red | Something went wrong |

---

## Validation Flow

When a QR code is scanned, it goes through several checks:

```typescript
// 1. Parse the QR code
const [email, eventId, year, firstName] = qrCodeText.split(";");

// 2. Check if it's for the correct event
if (eventId + ";" + year !== event.id + ";" + event.year) {
  // ❌ Wrong event
}

// 3. Check if user is registered
const user = rows.find(row => row.id === email);
if (!user) {
  // ❌ Not registered
}

// 4. Check registration status
if (isCheckedIn(user.registrationStatus)) {
  // ❌ Already checked in
}
if (isCancelled(user.registrationStatus)) {
  // ❌ Registration cancelled
}
if (isWaitlisted(user.registrationStatus)) {
  // ❌ On waitlist
}

// 5. All checks passed, proceed with check-in!
```

---

## Check-In API Call

If validation passes, the component calls the registration update endpoint:

```typescript
await fetchBackend({
  endpoint: `/registrations/${email}/${firstName}`,
  method: "PUT",
  data: {
    eventID: event.id,
    year: parseInt(event.year),
    registrationStatus: "checkedIn"
  }
});
```

After a successful check-in, the **NFC popup** automatically appears.

---

## UI Features

- **Camera flip**: Toggle between front and back camera
- **Reset scanner**: Clear the current scan and start fresh
- **Collapse**: Hide the scanner when not needed
- **Visual feedback**: Color-coded status bar with icons
