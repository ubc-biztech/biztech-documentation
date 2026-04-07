---
title: "Admin & Specialized APIs: Payments, Teams, QR, BTX, and more"
nextjs:
  metadata:
    title: Admin & Specialized APIs
    description: Endpoint reference for Payments, Teams, QR, BTX, Investments, Emails, Bots, Prizes, Transactions, and Stickers.
---

Specialized service endpoints for payments, team management, QR codes, stock exchange simulation, and admin tools. {% .lead %}

---

## Payments

Stripe Checkout integration.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/payments` | 🔓 | Create Stripe checkout session |
| `POST` | `/payments/webhook` | 🌐 | Stripe webhook (session completed) |
| `POST` | `/payments/expiry` | 🌐 | Stripe webhook (session expired) |

### Payment Types

| Type | Triggered When | What It Creates |
| --- | --- | --- |
| `UserMember` | New user pays for membership | Cognito user → User → Member → Profile |
| `OAuthMember` | Google OAuth user pays | User → Member → Profile |
| `Member` | Existing user upgrades | Updates `isMember` → Member → Profile |
| `Event` | User pays for paid event | Creates registration |

**Membership price:** $15 CAD (1500 cents in Stripe).

---

## Teams

Team management, point systems, and judging.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/teams/create` | 🔓 | Create a team |
| `POST` | `/teams/join` | 🔓 | Join a team |
| `POST` | `/teams/leave` | 🔓 | Leave a team |
| `PUT` | `/teams/points` | 🔓 | Add/deduct points |
| `POST` | `/teams/user` | 🔓 | Find user's team for an event |
| `GET` | `/teams/{eventId}/{year}` | 🔓 | Get all teams for event |
| `POST` | `/teams/rename` | 🔓 | Rename a team |
| `GET` | `/teams/scores/{eventId}/{year}` | 🔓 | Get all scores |
| `GET` | `/teams/feedback/{teamId}` | 🔓 | Get feedback for a team |
| `GET` | `/teams/judge/{eventId}/{year}` | 🔓 | Get judge's current team |
| `GET/POST/PUT` | `/teams/judge/feedback` | 🔓 | Judge feedback CRUD |

---

## Event Feedback

Built-in post-event feedback forms for attendees and partners.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/events/{id}/{year}/feedback/{formType}` | 🌐 | Get form metadata + question config |
| `POST` | `/events/{id}/{year}/feedback/{formType}` | 🌐 | Submit feedback response |
| `GET` | `/events/{id}/{year}/feedback/{formType}/submissions` | 🔓 | Admin: list stored submissions |

`formType` must be `attendee` or `partner`.

Key behavior:
- submissions are allowed whenever the form is enabled
- required validation is enforced per question type
- response keys must match known `questionId` values

---

## Instagram Analytics

Admin analytics service for Instagram account and post-level performance.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/instagram/analytics` | 🔓 | Fetch dashboard payload (supports `since`, `until`) |
| `GET` | `/instagram/token/status` | 🔓 | Get token source/expiry status |
| `POST` | `/instagram/token/refresh` | 🔓 | Manually refresh long-lived token |

---

## Partnerships CRM

Admin CRM service for partner directory, event sponsorship tracking, reporting, and Google Sheets sync.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/partnerships/dashboard` | 🔓 | Overview metrics, pace, pipeline, and action items |
| `GET` | `/partnerships/partners` | 🔓 | List partners with filters + directory summary |
| `POST` | `/partnerships/partners` | 🔓 | Create partner |
| `GET` | `/partnerships/partners/{partnerId}` | 🔓 | Partner detail with involvements/docs/comms |
| `PATCH` | `/partnerships/partners/{partnerId}` | 🔓 | Update or archive partner |
| `GET` | `/partnerships/events` | 🔓 | List CRM events with computed metrics |
| `POST` | `/partnerships/events` | 🔓 | Create CRM event |
| `GET` | `/partnerships/events/{eventId}` | 🔓 | Event detail + linked partners |
| `PATCH` | `/partnerships/events/{eventId}` | 🔓 | Update or archive CRM event |
| `DELETE` | `/partnerships/events/{eventId}` | 🔓 | Delete event (only if no links) |
| `POST` | `/partnerships/partners/{partnerId}/events` | 🔓 | Create partner-event involvement |
| `PATCH` | `/partnerships/partner-events/{linkId}` | 🔓 | Update partner-event involvement |
| `DELETE` | `/partnerships/partner-events/{linkId}` | 🔓 | Delete partner-event involvement |
| `GET` | `/partnerships/partners/{partnerId}/documents` | 🔓 | List linked documents |
| `POST` | `/partnerships/partners/{partnerId}/documents` | 🔓 | Create linked document record |
| `PATCH` | `/partnerships/partner-documents/{documentId}` | 🔓 | Update linked document record |
| `DELETE` | `/partnerships/partner-documents/{documentId}` | 🔓 | Delete linked document record |
| `GET` | `/partnerships/partners/{partnerId}/communications` | 🔓 | List communication logs |
| `POST` | `/partnerships/partners/{partnerId}/communications` | 🔓 | Create communication log |
| `PATCH` | `/partnerships/partner-communications/{communicationId}` | 🔓 | Update communication log |
| `DELETE` | `/partnerships/partner-communications/{communicationId}` | 🔓 | Delete communication log |
| `GET` | `/partnerships/email/config` | 🔓 | Sender + merge-field config for Email Ops |
| `GET` | `/partnerships/email/templates` | 🔓 | List email templates |
| `POST` | `/partnerships/email/templates` | 🔓 | Create email template |
| `PATCH` | `/partnerships/email/templates/{templateId}` | 🔓 | Update email template |
| `DELETE` | `/partnerships/email/templates/{templateId}` | 🔓 | Archive email template |
| `POST` | `/partnerships/email/send` | 🔓 | Send campaign emails (logs outbound comms) |
| `GET` | `/partnerships/email/sync/status` | 🔓 | Email sync health + last ingest stats |
| `POST` | `/partnerships/email/sync/ingest` | 🌐 | Service ingest route used by Apps Script |
| `GET` | `/partnerships/export` | 🔓 | Export flattened rows for CSV/Sheets |
| `GET` | `/partnerships/google-sheets/status` | 🔓 | Check Sheets configuration + health |
| `POST` | `/partnerships/google-sheets/sync` | 🔓 | Run manual `push` / `pull` / `merge` sync |

---

## QR Codes

QR code generation and scanning with point rewards.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/qrscan` | 🔓 | Scan a QR code (awards points) |
| `GET` | `/qr/{eventId}/{year}` | 🔓 | Get all QR codes for event |
| `GET` | `/qr/{eventId}/{year}/{qrId}` | 🔓 | Get specific QR code |
| `POST` | `/qr` | 🔓 | Create a QR code |
| `PATCH` | `/qr/{eventId}/{year}/{qrId}` | 🔓 | Update a QR code |
| `DELETE` | `/qr/{eventId}/{year}/{qrId}` | 🔓 | Delete a QR code |

QR types include standard codes and NFC variants (`NFC_ATTENDEE`, `NFC_COMPANY`). Each QR can be configured with point values, active/inactive state, and unlimited scan support.

---

## BTX (BizTech Exchange)

Real-time stock market simulation.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/btx/projects/{eventId}/{year}` | 🔓 | List all projects |
| `GET` | `/btx/market/snapshot` | 🔓 | Current market prices |
| `POST` | `/btx/market/buy` | 🔓 | Buy shares |
| `POST` | `/btx/market/sell` | 🔓 | Sell shares |
| `GET` | `/btx/portfolio/{eventId}/{year}` | 🔓 | User's portfolio |
| `GET` | `/btx/trades/{eventId}/{year}` | 🔓 | User's trade history |
| `GET` | `/btx/prices/{projectId}` | 🔓 | Price history for a project |
| `GET` | `/btx/leaderboard/{eventId}/{year}` | 🔓 | Portfolio value leaderboard |
| `POST` | `/btx/admin/create-project` | 🔑 | Create a project |
| `POST` | `/btx/admin/seed-funding` | 🔑 | Update seed funding |
| `POST` | `/btx/admin/investment-impact` | 🔑 | Apply investment impact |
| `POST` | `/btx/admin/phase-bump` | 🔑 | Apply phase price bump |

### Market Constants

| Constant | Value | Description |
| --- | --- | --- |
| Starting cash | $2,500 | Virtual starting balance |
| Starting price | $1.00 | Initial share price |
| Floor price | $0.10 | Minimum price |
| Trade impact | 0.02 | Price movement per trade |
| Trading fee | 2% | Fee on each trade |
| Max drift | 1.5% | Max random price drift |

---

## Investments

Kickstart event funding system.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/investments` | 🔓 | Make investment |
| `GET` | `/investments/team/{teamId}` | 🔓 | Get team's funding status |
| `GET` | `/investments/investor/{email}` | 🔓 | Get investor's portfolio |
| `GET` | `/investments/{eventId}/{year}` | 🔓 | List all investments |

---

## Emails

Admin-only email template management via AWS SES.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/email/{templateName}` | 🔑 | Get template |
| `POST` | `/email` | 🔑 | Create template |
| `PATCH` | `/email/{templateName}` | 🔑 | Update template |
| `DELETE` | `/email/{templateName}` | 🔑 | Delete template |
| `GET` | `/email` | 🔑 | List all templates |

---

## Bots

Discord and Slack integrations.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/discord/interaction` | 🌐 | Discord slash command webhook |
| `POST` | `/discord/account/mapping` | 🌐 | Link Discord ↔ BizTech account |
| `POST` | `/discord/webhook` | 🌐 | Discord event webhook |
| `POST` | `/slack/github` | 🌐 | GitHub PR reminders (cron: Mon/Fri 5pm) |
| `POST` | `/slack/event` | 🌐 | Slack event shortcut |

---

## Prizes & Transactions

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/prizes` | 🔓 | List all prizes |
| `POST` | `/prizes` | 🔑 | Create prize |
| `PATCH` | `/prizes/{prizeId}` | 🔑 | Update prize |
| `DELETE` | `/prizes/{prizeId}` | 🔑 | Delete prize |
| `GET` | `/transactions` | 🔓 | List transactions |
| `POST` | `/transactions` | 🔓 | Create transaction |

---

## Stickers (WebSocket)

Real-time voting system via WebSocket.

### WebSocket Routes

| Route | Description |
| --- | --- |
| `$connect` | Register connection |
| `$disconnect` | Remove connection |
| `admin` | Start/stop/reset voting |
| `sticker` | Submit a sticker/vote |
| `score` | Submit a score |
| `sync` | Sync current state |

### REST Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/stickers/scores` | 🔓 | All scores |
| `GET` | `/stickers/scores/{roomId}` | 🔓 | Scores by room |
| `GET` | `/stickers/scores/team/{teamId}` | 🔓 | Scores by team |
| `GET` | `/stickers` | 🔓 | All stickers |
| `GET` | `/stickers/{roomId}` | 🔓 | Stickers by room |
| `GET` | `/stickers/team/{teamId}` | 🔓 | Stickers by team |
