---
title: 'NFC: Card Writing System'
nextjs:
  metadata:
    title: 'NFC: Card Writing System'
    description: 'How NFC membership cards are written using the Web NFC API, including the popup, writer component, URL format, and support hooks.'
---


This page covers the NFC card writing system: the Web NFC API, URL format, writing flow, and the support hooks that make it all work.

---

## What is Web NFC?

The **Web NFC API** lets websites read and write to NFC (Near Field Communication) tags using compatible Android devices. It's a browser API, so no app installation is needed!

{% callout type="warning" title="Browser Support" %}
Web NFC is **only supported on Chrome for Android**. It does NOT work on:
- iPhones / Safari (Apple blocks Web NFC)
- Desktop browsers
- Firefox, Edge on mobile

This means NFC card writing must be done from an **Android phone or tablet**. The system handles unsupported devices gracefully with a fallback.
{% /callout %}

---

## NFC URL Format

Each NFC card is written with a URL that points to the user's profile:

```typescript
// From nfcUtils.ts
export const generateNfcProfileUrl = (token: string): string => {
  const stage = process.env.NEXT_PUBLIC_REACT_APP_STAGE;

  if (stage === "production") {
    return `https://app.ubcbiztech.com/profile/${token}?scan=true`;
  } else if (stage === "local") {
    return `http://localhost:3000/profile/${token}?scan=true`;
  } else {
    return `https://dev.app.ubcbiztech.com/profile/${token}?scan=true`;
  }
};
```

The `token` is the user's **profile UUID**. The `?scan=true` parameter tells the profile page it was opened via NFC scan (which triggers the connection flow).

---

## The NFC Writing Flow

There are two components that work together:

### 1. NFCPopup (the preview)

`NFCPopup.tsx` is shown after a successful check-in. It displays:

- The user's name and profile picture (or a generated avatar from DiceBear)
- A "Write to Card" button
- A fallback for unsupported devices

```
┌─────────────────────────────┐
│     [Profile Picture]        │
│                              │
│  Alex does not have a        │
│  membership card.            │
│                              │
│     [Write to Card]          │
│                              │
│         [close]              │
└─────────────────────────────┘
```

**If the device doesn't support NFC**, the popup shows the NFC URL as text with a "Copy" button. This lets the admin copy the URL and use a separate NFC writing app.

### 2. NFCWriter (the actual writer)

`NFCWriter.tsx` handles the physical NFC writing process. It uses the Web NFC API:

```typescript
// Create NFC reader/writer
const ndef = new NDEFReader();

// Start scanning for nearby NFC tags
await ndef.scan();

// When a tag is detected...
ndef.addEventListener("reading", async (event) => {
  // Write the profile URL to the tag
  await ndef.write({
    records: [{ recordType: "url", data: nfcUrl }]
  });

  // Update the user's card count in the database
  await fetchBackend({
    endpoint: `/members/${email}`,
    method: "PATCH",
    data: { cardCount: numCards + 1 }
  });
});
```

---

## Writer States

The writer goes through these visual states:

| State | Visual | Description |
|-------|--------|-------------|
| `loading` | Pulsing blue rings | Checking NFC support |
| `ready` | Blue rings + icon | Ready, waiting for tag |
| `writing` | Blue rings + icon | NFC tag detected, writing... |
| `completed` | Blue rings + warning | User already has a card (but can still write) |
| `success` | Green rings + ✓ | Successfully written! |
| `error` | Red rings + ✗ | Something went wrong |
| `not_supported` | Error message | Device doesn't support NFC |
| `non_member` | Error message | User isn't a member |

The visual design uses **animated concentric rings** that change color based on the state: blue for neutral, green for success, red for error.

---

## Timeout Handling

The writer has a 10-second timeout. If no NFC tag is detected within 10 seconds, it shows an error with a "Try Again" button:

```typescript
const setOpTimeout = () => {
  timeoutIdRef.current = window.setTimeout(() => {
    setStatus("error");
    setErrorMessage("Operation timed out. Please try again.");
  }, 10000);
};
```

---

## Auto-Close

After a successful write, the component automatically closes after 3 seconds:

```typescript
window.setTimeout(() => {
  if (mountedRef.current) closeAll();
}, 3000);
```

---

## NFC Support Hooks

### useNFCSupport

A simple hook that checks if the current browser supports Web NFC:

```typescript
const { isNFCSupported, isLoading } = useNFCSupport();
```

It checks for the `NDEFReader` object on the `window`:

```typescript
const hasNFC = "NDEFReader" in window;
```

### useUserNeedsCard

Checks whether a user needs a membership card by looking up their member record:

```typescript
const { checkUserNeedsCard, isLoading, error } = useUserNeedsCard();

const result = await checkUserNeedsCard("jane@student.ubc.ca");
// result = { needsCard: true, profileID: "abc-123-..." }
```

The logic:
1. Fetch the member record via `GET /members/{email}`
2. If member not found (404) → doesn't need card (not a member)
3. If `cardCount > 0` → doesn't need card (already has one)
4. Otherwise → needs a card, return their `profileID`
