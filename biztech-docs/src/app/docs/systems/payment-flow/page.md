---
title: Payment Flow
nextjs:
  metadata:
    title: Payment Flow
    description: Stripe Checkout integration for event registration and membership payments.
---

BizTech uses **Stripe Checkout Sessions** for all paid transactions — event registration fees and membership dues. The backend creates a session, the frontend redirects to Stripe's hosted checkout page, and a webhook confirms the payment.

---

## Architecture

```
Frontend                      Backend (/payments)               Stripe
───────                      ──────────────────               ──────
POST /payments ───────────►  payment() handler
  { paymentType, email,       │
    eventID, year,            │ stripe.checkout.sessions.create()
    success_url, cancel_url } │────────────────────────────────► Session
                              │◄──────────────────────────────── { url }
                              │
                              │ Save checkoutLink on registration
◄─────────────────────────────┘ Return session.url

window.open(url, "_self") ──────────────────────────────────► Stripe Checkout

                              webhook() handler ◄─────────── checkout.session.completed
                              │ Verify signature
                              │ Read metadata.paymentType
                              │ Update DynamoDB state
```

---

## Payment Types

The `paymentType` field in the request body determines the post-payment behavior:

| `paymentType`   | When used                           | Webhook action                                                                                              |
| --------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `"Event"`       | Paid event registration             | Updates registration status from `incomplete` → `registered` (or `acceptedComplete` for application events) |
| `"Member"`      | Membership purchase (existing user) | Updates user in `biztechUsers`, creates member record in `biztechMembers2026`, creates profile             |
| `"UserMember"`  | Membership + new Cognito signup     | Creates Cognito user, then user + member + profile records                                                  |
| `"OAuthMember"` | Membership for OAuth user           | Creates user + member + profile records (no Cognito step)                                                   |

---

## Backend Endpoints

All handlers in `services/payments/handler.js`:

| Method | Path                | Auth             | Handler                                                      |
| ------ | ------------------- | ---------------- | ------------------------------------------------------------ |
| `POST` | `/payments`         | CORS only        | `payment()` — creates Stripe Checkout session                |
| `POST` | `/payments/webhook` | Stripe signature | `webhook()` — handles `checkout.session.completed`           |
| `POST` | `/payments/cancel`  | Stripe signature | `cancel()` — handles session expiration (currently disabled) |

---

## Session Creation payment()

**File:** `services/payments/handler.js` (line ~362)

### Pricing logic

- **Event payments:** Fetches the event from `biztechEvents` and the user from `biztechUsers`. Uses `pricing.members` or `pricing.nonMembers` based on `user.isMember`. Multiplied by 100 for cents.
- **Membership payments:** Fixed `MEMBERSHIP_PRICE = 1500` cents ($15.00 CAD). UBC students receive a $3 discount (`unit_amount = 1200`). Defined in `services/payments/constants.js`.

### Session parameters

```js
stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: [{ price_data: { currency: "CAD", unit_amount, product_data }, quantity: 1 }],
  mode: "payment",
  metadata: { paymentType, email, fname, eventID, year, ... },
  success_url,
  cancel_url,
  expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
  allow_promotion_codes: true,
});
```

All user form data is stored in the session `metadata` so the webhook can process it without a second database lookup.

For event payments, the returned `session.url` is also saved as `checkoutLink` on the registration record via `updateHelper()`. This allows re-registration to reuse the existing session URL.

---

## Webhook webhook()

**File:** `services/payments/handler.js` (line ~36)

1. Verifies the Stripe signature using `endpointSecret`
2. Handles only `checkout.session.completed` events
3. Reads `metadata.paymentType` and dispatches to the matching helper:

| Helper function       | Payment type    | Actions                                                                                            |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `eventRegistration()` | `"Event"`       | Queries registration, updates status `incomplete` → `registered` (or `acceptedComplete`)           |
| `memberSignup()`      | `"Member"`      | Updates `biztechUsers`, creates `biztechMembers2026` record, creates profile via `createProfile()` |
| `userMemberSignup()`  | `"UserMember"`  | Cognito signup → user + member + profile record creation                                           |
| `OAuthMemberSignup()` | `"OAuthMember"` | User + member + profile record creation (no Cognito)                                               |

---

## Frontend Integration

### Registration Strategy Pattern

The frontend uses an abstract `RegistrationStrategy` class to manage registration and payment state.

**File:** `src/lib/registrationStrategy/registrationStrategy.ts`

```ts
abstract class RegistrationStrategy {
  abstract needsPayment(): boolean
  abstract regForPaid(): Promise<{ paymentUrl?: string }>
  abstract regForPaidApp(): Promise<{ paymentUrl?: string }>
  abstract confirmAndPay(): Promise<{ paymentUrl?: string }>
  // ...
}
```

**Concrete implementation:** `RegistrationStateOld` in `src/lib/registrationStrategy/registrationStateOld.ts`

| Method            | When used                                      | What it does                                                             |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `regForPaid()`    | Non-application paid event, first registration | Creates registration with status `INCOMPLETE`, then POSTs to `/payments` |
| `regForPaidApp()` | Application-based paid event                   | Same + sets `applicationStatus: REVIEWING`                               |
| `confirmAndPay()` | User accepted, needs to pay                    | POSTs to `/payments` for a new checkout session                          |
| `needsPayment()`  | State check                                    | Returns `true` if status is `INCOMPLETE` or `ACCEPTED`                   |

### Checkout redirect

All three payment methods POST to `/payments` and redirect with:

```ts
const response = await fetchBackend('/payments', 'POST', paymentBody)
window.open(response, '_self') // redirects to Stripe hosted page
```

The `success_url` is constructed as `CLIENT_URL/event/{eventId}/{year}/register/success`.

### Re-registration shortcut

In `services/registrations/handler.js` (line ~366): if a user tries to register but already has an `incomplete` registration, the backend returns `{ url: existingReg.checkoutLink }` — the previously-saved Stripe session URL. The frontend strategy checks for `res.url` and returns it directly as `paymentUrl` before calling `/payments`.

---

## Environment Variables

Defined in `services/payments/serverless.yml`:

| Variable                                       | Purpose                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `STRIPE_DEV_KEY` / `STRIPE_PROD_KEY`           | Stripe secret API key                                         |
| `STRIPE_DEV_ENDPOINT` / `STRIPE_PROD_ENDPOINT` | Webhook signing secret for `checkout.session.completed`       |
| `STRIPE_DEV_CANCEL` / `STRIPE_PROD_CANCEL`     | Webhook signing secret for cancel/expiration                  |
| `ENVIRONMENT`                                  | `"PROD"` selects production keys; anything else uses dev keys |

Stripe is initialized at the top of handler.js:

```js
const stripe = require('stripe')(
  process.env.ENVIRONMENT === 'PROD'
    ? process.env.STRIPE_PROD_KEY
    : process.env.STRIPE_DEV_KEY,
)
```

---

## DynamoDB Tables

| Table                  | Usage in payment flow                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `biztechEvents`        | Lookup `pricing.members` / `pricing.nonMembers` for event payments  |
| `biztechUsers`         | Lookup `isMember` for pricing tier; updated on membership payment   |
| `biztechMembers2026`   | Created on membership payment completion                            |
| `biztechRegistrations` | Stores `registrationStatus` and `checkoutLink` (Stripe session URL) |
| `biztechProfiles`      | Profile created as side effect of membership payment                |

---

## Key Files

| File                                                   | Purpose                                              |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `services/payments/handler.js`                         | All 3 endpoint handlers + 4 webhook helper functions |
| `services/payments/constants.js`                       | `MEMBERSHIP_PRICE = 1500`                            |
| `services/payments/serverless.yml`                     | Endpoint definitions, env vars, IAM permissions      |
| `src/lib/registrationStrategy/registrationStrategy.ts` | Abstract strategy base class                         |
| `src/lib/registrationStrategy/registrationStateOld.ts` | Concrete payment + registration logic                |
| `src/pages/membership.tsx`                             | Membership payment flow                              |
| `src/pages/event/[eventId]/[year]/register/index.tsx`  | Event registration payment flow                      |

---

## Related Pages

- [Registration](/docs/systems/registration) — registration state machine that payment completes
- [Membership Flow](/docs/flows/membership) — full membership path including admin bypasses
- [User, Member & Profile Relationships](/docs/identity/relationships) — the three records created by membership payment
- [Authentication](/docs/authentication) — Cognito auth context for membership signup
- [Event Lifecycle](/docs/flows/event-lifecycle) — where payment fits in the broader event flow
