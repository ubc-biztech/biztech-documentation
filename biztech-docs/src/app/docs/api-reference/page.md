---
title: API Reference
nextjs:
  metadata:
    title: API Reference
    description: Overview and base URLs for the BizTech REST API. Links to detailed endpoint references.
---

Complete endpoint reference for the BizTech REST API. All endpoints are served from a single API Gateway. {% .lead %}

**Base URLs:**

| Environment | URL |
| --- | --- |
| Local | `http://localhost:4000` |
| Dev / Staging | `https://api-dev.ubcbiztech.com` |
| Production | `https://api.ubcbiztech.com` |

**Authentication:** Most endpoints require a Cognito JWT token in the `Authorization` header. Endpoints marked with 🔓 require auth, 🔑 require admin, and 🌐 are public.

---

## API Sections

The API reference is split into three sections for easier navigation:

{% quick-links %}

{% quick-link title="Core APIs" icon="installation" href="/docs/api-reference/core" description="Events, Registrations, Users, and Members: the fundamental CRUD endpoints." /%}

{% quick-link title="Profile & Social APIs" icon="presets" href="/docs/api-reference/social" description="Profiles, Interactions, Quests, and Quizzes for connection and engagement features." /%}

{% quick-link title="Admin & Specialized APIs" icon="plugins" href="/docs/api-reference/admin" description="Payments, Teams, QR, BTX, Investments, Emails, Bots, Prizes, and more." /%}

{% /quick-links %}

---

## Quick Reference (All Endpoints)

| Service | # Endpoints | Auth | Section |
| --- | --- | --- | --- |
| Events | 7 | 🔓 / 🌐 | [Core](/docs/api-reference/core) |
| Registrations | 7 | 🔓 | [Core](/docs/api-reference/core) |
| Users | 8 | 🔓 / 🌐 | [Core](/docs/api-reference/core) |
| Members | 7 | 🔓 / 🔑 | [Core](/docs/api-reference/core) |
| Profiles | 9 | 🔓 / 🌐 | [Social](/docs/api-reference/social) |
| Interactions | 6 + WebSocket | 🔓 | [Social](/docs/api-reference/social) |
| Quests | 4 | 🔓 / 🌐 | [Social](/docs/api-reference/social) |
| Quizzes | 6 | 🔓 / 🌐 | [Social](/docs/api-reference/social) |
| Payments | 3 | 🔓 / 🌐 | [Admin](/docs/api-reference/admin) |
| Teams | 12+ | 🔓 | [Admin](/docs/api-reference/admin) |
| QR Codes | 6 | 🔓 | [Admin](/docs/api-reference/admin) |
| BTX | 12+ | 🔓 / 🔑 | [Admin](/docs/api-reference/admin) |
| Investments | 4 | 🔓 | [Admin](/docs/api-reference/admin) |
| Emails | 5 | 🔑 | [Admin](/docs/api-reference/admin) |
| Bots | 5 | 🌐 | [Admin](/docs/api-reference/admin) |
| Prizes | 4 | 🔓 / 🔑 | [Admin](/docs/api-reference/admin) |
| Transactions | 2 | 🔓 | [Admin](/docs/api-reference/admin) |
| Stickers | WebSocket + 6 | 🔓 | [Admin](/docs/api-reference/admin) |
