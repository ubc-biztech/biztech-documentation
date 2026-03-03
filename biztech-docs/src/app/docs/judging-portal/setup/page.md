---
title: Judging Portal Setup
nextjs:
  metadata:
    title: Judging Portal Setup
    description: Local development setup for the BizTech Judging Portal.
---

Use this page to get the judging portal running locally. {% .lead %}

---

{% callout type="warning" title="Firebase Migration In Progress" %}
We are currently migrating to `dev@ubcbiztech.com`'s Firebase account. Login details will be shared on Notion.
{% /callout %}

---

## Repository

- [https://github.com/ubc-biztech/hello-hacks-judging-portal](https://github.com/ubc-biztech/hello-hacks-judging-portal)

---

## Prerequisites

- Node.js 20+
- npm
- Firebase project values for public env vars

---

## Local Run

1. Open terminal in `hello-hacks-judging-portal/hello-hacks-portal`
2. Install dependencies: `npm install`
3. Create `.env.local` with the required `NEXT_PUBLIC_*` variables
4. Start app: `npm run dev`
5. Open `http://localhost:3000`

---

## Required Environment Variables

- `NEXT_PUBLIC_EVENT_ID`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

{% callout type="warning" title="Important" %}
Set `NEXT_PUBLIC_EVENT_ID` explicitly in every environment. If omitted, the app falls back to `techstrat-2026 ` (trailing space).
{% /callout %}

---

## Useful Commands

- `npm run dev` - start local dev server
- `npm run build` - production build check
- `npm run lint` - lint the codebase
- `npm run start` - run production build locally
