---
title: Project Structure
nextjs:
  metadata:
    title: Project Structure
    description: Directory layout and key files for bt-web-v2 (frontend) and serverless-biztechapp-1 (backend).
---

File layout and key entry points for the two main BizTech repositories. {% .lead %}

---

## bt-web-v2 (Frontend)

```
bt-web-v2/
├── amplify/                     # AWS Amplify Gen 2 config
│   ├── auth/resource.ts         # Cognito user pool config (login methods, OAuth, password policy)
│   └── backend.ts               # Amplify backend root
├── public/                      # Static assets (served at /)
│   ├── assets/                  # Images and SVGs
│   ├── favicon/                 # Favicon files
│   ├── fonts/                   # Custom web fonts
│   └── videos/                  # Video files
├── src/
│   ├── components/              # Reusable React components
│   │   ├── Common/              # Generic UI: Cards, Divider, Buttons, Loading states
│   │   ├── NavBar/              # Sidebar navigation
│   │   ├── Events/              # Event listing and detail components
│   │   ├── EventsDashboard/     # Admin event dashboard
│   │   ├── Registration/        # Registration forms
│   │   ├── ProfilePage/         # Profile view components
│   │   ├── Connections/         # Connection history display
│   │   ├── NFCWrite/            # NFC tag writing UI
│   │   ├── QrScanner/           # QR code scanner
│   │   ├── PartnershipsCRM/     # Partnerships CRM admin UI
│   │   ├── Companion/           # Companion app components
│   │   ├── LiveWall/            # 2D/3D live connection wall
│   │   ├── Blocks/              # Larger page-section blocks (EventsAttended, etc.)
│   │   └── ui/                  # shadcn/ui primitives (button, dialog, tabs, etc.)
│   ├── constants/               # App-wide constants
│   ├── contexts/                # React Context providers
│   ├── features/                # Event-specific companion modules (blueprint, kickstart, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/
│   │   ├── db.ts                # fetchBackend() and fetchBackendFromServer() API wrappers
│   │   ├── dbconfig.ts          # API_URL, CLIENT_URL, WS_URL by stage
│   │   └── queryProvider.tsx    # TanStack React Query setup
│   ├── pages/                   # Next.js Pages Router (each file = one route)
│   │   ├── _app.tsx             # Global providers, layout selection, fonts
│   │   ├── _document.tsx        # HTML shell customization
│   │   ├── layout.tsx           # Standard layout (sidebar + content area)
│   │   ├── index.tsx            # Home dashboard
│   │   ├── login.tsx            # Login page
│   │   ├── register.tsx         # Sign up
│   │   ├── verify.tsx           # Email verification
│   │   ├── membership.tsx       # Membership payment
│   │   ├── events.tsx           # Event browsing
│   │   ├── btx.tsx              # BizTech Exchange trading UI
│   │   ├── investments.tsx      # Kickstart investments
│   │   ├── event/               # Event registration forms
│   │   ├── profile/             # User profile pages
│   │   ├── companion/           # Companion app pages
│   │   ├── connections/         # Connection history
│   │   └── admin/               # Admin panel pages
│   ├── queries/                 # TanStack React Query hooks (useEvents, useUser, etc.)
│   ├── styles/                  # Global CSS (globals.css, animations, blueprint theme)
│   ├── types/                   # TypeScript type definitions
│   ├── types.ts                 # Core type definitions (User, BiztechEvent, etc.)
│   ├── util/                    # Utility functions and Amplify server-side helpers
│   └── middleware.ts            # Auth middleware (runs on every request)
├── amplify_outputs.json         # Generated Amplify config (Cognito pool IDs, OAuth URLs)
├── components.json              # shadcn/ui component config
├── next.config.mjs              # Next.js config
├── tailwind.config.ts           # Tailwind theme (colors, fonts, breakpoints)
└── tsconfig.json                # TypeScript config
```

### Key Entry Points

| File                       | What to open first for...                 |
| -------------------------- | ----------------------------------------- |
| `src/pages/_app.tsx`       | Layout logic, which pages skip nav/layout |
| `src/middleware.ts`        | Auth enforcement on every request         |
| `src/lib/db.ts`            | How all API calls are made                |
| `src/lib/dbconfig.ts`      | Backend URL per environment               |
| `src/pages/layout.tsx`     | Standard sidebar + content layout         |
| `amplify/auth/resource.ts` | Cognito configuration                     |

---

## serverless-biztechapp-1 (Backend)

```
serverless-biztechapp-1/
├── index.js                     # Local dev entry point — spawns all services + proxy
├── handler.js                   # Proxy server helpers (readConfigFile, runServices, runProxy)
├── sls-multi-gateways.yml       # Defines all services, their path prefixes, and source dirs
├── serverless.common.yml        # Shared Serverless config (provider, plugins, domains)
├── config.dev.json              # Dev environment config (ENVIRONMENT: "")
├── config.staging.json          # Staging environment config
├── config.prod.json             # Production environment config (ENVIRONMENT: "PROD")
├── constants/
│   ├── tables.js                # All DynamoDB table name constants
│   ├── indexes.js               # GSI name constants
│   ├── emails.js                # Email address constants
│   └── dynamodb.js              # DynamoDB-specific constants (reserved words list, etc.)
├── lib/
│   ├── db.js                    # DynamoDB helpers (create, getOne, scan, updateDB, etc.)
│   ├── docClient.js             # DynamoDB DocumentClient setup
│   ├── handlerHelpers.js        # Response builders (createResponse, notFoundResponse, etc.)
│   ├── sesHelper.js             # AWS SES email sender (v1)
│   ├── sesV2Client.js           # AWS SES email template management (v2)
│   ├── search.js                # Algolia search wrapper
│   ├── algoliaClient.js         # Algolia client setup
│   ├── snsHelper.js             # SNS message sender (Slack notifications)
│   ├── utils.js                 # Shared utilities (isValidEmail, isEmpty, etc.)
│   └── testHelpers.js           # Test setup helpers
├── scripts/                     # One-off admin and migration scripts
└── services/                    # One directory per microservice
    ├── hello/                   # Health check + shared API Gateway export (deploy first)
    ├── events/                  # Event CRUD, image upload, feedback forms
    ├── registrations/           # Registration, check-in, waitlist, leaderboard
    ├── members/                 # Club membership CRUD
    ├── users/                   # User account CRUD, favorites, admin check
    ├── payments/                # Stripe checkout, webhook handler
    ├── teams/                   # Teams, points, judging (also handles /team path)
    ├── profiles/                # Public profiles, company profiles, profile pictures
    ├── emails/                  # SES email template CRUD (admin only)
    ├── investments/             # Kickstart event investment tracking
    ├── qr/                      # QR code CRUD (path: /qr) and scanning (path: /qrscan)
    ├── quests/                  # Quest/achievement tracking
    ├── quizzes/                 # MBTI personality quiz results
    ├── interactions/            # NFC connections, profile search, WebSocket live wall
    ├── bots/                    # Discord and Slack bot integrations
    ├── prizes/                  # Prize catalog CRUD
    ├── transactions/            # Point transaction ledger
    ├── stickers/                # Real-time WebSocket voting system (currently disabled locally)
    └── btx/                     # BizTech Exchange stock trading simulation
```

### Key Entry Points

| File                             | What to open first for...                            |
| -------------------------------- | ---------------------------------------------------- |
| `sls-multi-gateways.yml`         | What services exist and what path prefix each owns   |
| `services/hello/serverless.yml`  | Shared API Gateway and Cognito Authorizer definition |
| `lib/db.js`                      | How all DynamoDB access works                        |
| `lib/handlerHelpers.js`          | Response helper functions used in every handler      |
| `constants/tables.js`            | All DynamoDB table names                             |
| `services/{name}/serverless.yml` | Routes and IAM permissions for any service           |
| `services/{name}/handler.js`     | Lambda handler logic for any service                 |

### Service File Layout

Every service follows this layout:

```
services/events/
├── serverless.yml     # Function definitions, HTTP routes, IAM permissions
├── handler.js         # Lambda handler functions (exported by name)
└── helpers.js         # Service-specific business logic (optional)
```

---

## Related Pages

- [Frontend Architecture](/docs/frontend-architecture): Tech stack, layout system, and Pages Router overview
- [Backend Architecture](/docs/backend-architecture): Services list, request flow, and how services share an API Gateway
- [Getting Started](/docs/getting-started): How to run both repos locally
