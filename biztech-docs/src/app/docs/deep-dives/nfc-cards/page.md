---
title: 'NFC Cards & QR Check-In'
nextjs:
  metadata:
    title: 'NFC Cards & QR Check-In'
    description: 'In-depth guide to the NFC membership card writing system and QR code-based event check-in.'
---

BizTech uses **NFC membership cards** and **QR code scanning** to streamline event check-ins and enable the [Live Connection Wall](/docs/deep-dives/live-wall/). This page covers both systems end-to-end.

---

## Overview

Here's how the systems work together at a BizTech event:

1. **Attendee arrives** → Admin opens the event dashboard and toggles the QR scanner
2. **Admin scans QR code** → The attendee's QR code (from their registration email) gets scanned
3. **System checks in the user** → Registration status is updated to "checked in"
4. **NFC popup appears** → After a successful check-in, the NFC popup appears automatically (it always shows, not conditionally)
5. **Card check inside popup** → `NFCWriter` calls `checkUserNeedsCard` to determine the write state — if the user already has a card, it shows a "completed" state; if not, it enters "ready" state for writing
6. **Card is written** → The admin taps a blank NFC card to the phone, and the NFC card now contains a URL that links to the user's profile
7. **At the event** → People tap each other's NFC cards to view profiles and create connections (which show up on the Live Wall)

```
QR Scan → Check In → NFC Popup (always) → Card Check (inside popup) → Write Card (if needed) → Ready to Connect!
```

---

## Key Files

### Frontend

| File                                     | What it does                                            |
| ---------------------------------------- | ------------------------------------------------------- |
| `src/components/QrScanner/QrScanner.tsx` | Main QR code scanner and check-in component             |
| `src/components/QrScanner/types.ts`      | TypeScript types for the QR scanner                     |
| `src/components/NFCWrite/NFCPopup.tsx`   | NFC writing popup - shows user info and triggers writer |
| `src/components/NFCWrite/NFCWriter.tsx`  | Handles the actual NFC tag writing via Web NFC API      |
| `src/hooks/useNFCSupport.ts`             | Hook to check if the device supports NFC                |
| `src/hooks/useUserNeedsCard.ts`          | Hook to check if a user needs a membership card         |
| `src/util/nfcUtils.ts`                   | Utility to generate the NFC profile URL                 |

### Backend

| File                               | What it does                                                         |
| ---------------------------------- | -------------------------------------------------------------------- |
| `services/interactions/handler.js` | `POST /interactions` - creates connections when NFC cards are tapped |
| `services/interactions/helpers.js` | Connection logic and WebSocket broadcasting                          |

---

## What's Covered in This Section

{% quick-links %}

{% quick-link title="QR Code Check-In" icon="presets" href="/docs/deep-dives/nfc-cards/qr-checkin/" description="How QR codes work, the scanner component, validation flow, and check-in API." /%}

{% quick-link title="NFC Card Writing" icon="plugins" href="/docs/deep-dives/nfc-cards/nfc-writing/" description="Web NFC API, URL format, writing flow, writer states, and support hooks." /%}

{% quick-link title="Connections, Errors & Testing" icon="installation" href="/docs/deep-dives/nfc-cards/connections/" description="How NFC creates connections, error handling, database records, and local testing." /%}

{% /quick-links %}
