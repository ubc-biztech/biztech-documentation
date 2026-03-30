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
