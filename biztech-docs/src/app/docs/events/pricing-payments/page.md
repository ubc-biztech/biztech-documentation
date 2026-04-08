---
title: Event Pricing and Payments
nextjs:
  metadata:
    title: Event Pricing and Payments
    description: How event pricing connects to Stripe payments — member vs non-member pricing, checkout session creation, webhook processing, and the payment flow.
---

Events can be free or paid. Paid events use Stripe Checkout with a price determined by the event record's `pricing` field and the user's membership status. {% .lead %}

---

## Pricing Model

Each event stores pricing in a `pricing` object:

```json
{
  "pricing": {
    "members": 0,
    "nonMembers": 5
  }
}
```

| Field                | Type   | Unit    | Description               |
| -------------------- | ------ | ------- | ------------------------- |
| `pricing.members`    | Number | Dollars | Price for BizTech members |
| `pricing.nonMembers` | Number | Dollars | Price for non-members     |

A value of `0` means the event is free for that group. A value of `5` means $5.00 CAD.

---

## Payment Flow

```
User clicks "Register"
        │
        ▼
Frontend checks if event is free
        │
        ├── pricing === 0 → Register directly → status: "registered"
        │
        └── pricing > 0  → Create Stripe session
                │
                ▼
           POST /payments/
           { paymentType: "Event", eventID, year, email }
                │
                ▼
           Backend fetches event → reads pricing
                │
                ▼
           Creates Stripe Checkout session
           unit_amount = pricing × 100 (cents)
                │
                ▼
           Updates registration → status: "incomplete"
           Stores checkoutLink on registration record
                │
                ▼
           Redirects user to Stripe Checkout
                │
                ├── User pays → Stripe webhook → status: "registered"
                └── User abandons → session expires (30 min) → stays "incomplete"
```

---

## How the Backend Reads Event Pricing

**File:** `services/payments/handler.js` → `export const payment`

When the payment type is `"Event"`:

```js
const [event, user] = await Promise.all([
  db.getOne(data.eventID, EVENTS_TABLE, { year: Number(data.year) }),
  db.getOne(data.email, USERS_TABLE),
])

const isMember = !isEmpty(user) && user.isMember
const samePricing = event.pricing.members === event.pricing.nonMembers

unit_amount =
  (isMember ? event.pricing.members : event.pricing.nonMembers) * 100
```

| Step                             | What happens                                                        |
| -------------------------------- | ------------------------------------------------------------------- |
| Fetch event and user in parallel | Gets the event record and user's membership status                  |
| Determine `isMember`             | Checks `user.isMember` flag                                         |
| Select price                     | `pricing.members` for members, `pricing.nonMembers` for non-members |
| Convert to cents                 | Multiplies by 100 for Stripe's `unit_amount`                        |

The event's display name and image are also used:

```js
data.paymentName = `${event.ename} ${
  isMember || samePricing ? '' : '(Non-member)'
}`
data.paymentImages = [event.imageUrl]
```

---

## Stripe Checkout Session

```js
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'CAD',
        product_data: {
          name: data.paymentName,
          images: paymentImages,
        },
        unit_amount,
      },
      quantity: 1,
    },
  ],
  metadata: data,
  mode: 'payment',
  success_url: data.success_url,
  cancel_url: data.cancel_url,
  expires_at: Math.round(new Date().getTime() / 1000) + 1800,
  allow_promotion_codes: true,
})
```

| Setting         | Value                                               |
| --------------- | --------------------------------------------------- |
| Currency        | `CAD`                                               |
| Session expiry  | 30 minutes                                          |
| Promotion codes | Enabled                                             |
| Product name    | Event `ename` + "(Non-member)" suffix if applicable |
| Product image   | Event `imageUrl`                                    |

After session creation, the handler updates the registration with the checkout link:

```js
await updateHelper(
  { eventID, year, checkoutLink: session.url },
  false,
  email,
  fname,
)
```

This sets the registration status to `"incomplete"` until payment completes.

---

## Application-Based Events with Pricing

For application-based events (`isApplicationBased: true`), the flow is different:

```
Register → "registered" (pending review)
   │
   Admin accepts
   │
   ├── pricing === 0 → "acceptedPending" (no payment needed)
   └── pricing > 0  → "accepted" → user pays → "acceptedComplete"
```

The acceptance handler checks:

```js
const pricing = isMember
  ? eventExists.pricing?.members ?? 0
  : eventExists.pricing?.nonMembers ?? 0

if (pricing === 0) {
  data.registrationStatus = 'acceptedPending'
}
```

---

## Free Events

When `pricing.members` and `pricing.nonMembers` are both `0`, the event is free:

- No Stripe session is created
- Registration goes directly to `"registered"` status
- No checkout link is stored
- No webhook processing needed

---

## Where Pricing Is Set

Pricing is configured by admins during event creation or editing:

**Frontend:** `src/components/Events/EventForm.tsx`

- `price` field → maps to `pricing.members`
- `nonMemberPrice` field → maps to `pricing.nonMembers`
- Defaults to `0` (free) if not set

**Backend:** `services/events/handler.js` → `create` / `update`

- Stored as-is in the event record
- No backend validation on pricing values beyond type checking

---

## Key Files

| File                                                 | Purpose                                               |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `services/payments/handler.js` → `payment`           | Creates Stripe checkout session using event pricing   |
| `services/payments/handler.js` → webhook             | Processes Stripe webhook, updates registration status |
| `services/registrations/handler.js` → `updateHelper` | Stores checkout link, handles status transitions      |
| `services/events/handler.js` → `create`, `update`    | Stores pricing on event record                        |
| `src/components/Events/EventForm.tsx`                | Admin pricing input fields                            |

---

## Related Pages

- [Event Data Model](/docs/events/data-model) — the `pricing` field
- [Events and Registrations](/docs/events/registrations) — how registration depends on event pricing
- [Events System Overview](/docs/events) — event architecture
- [Payment Flow](/docs/systems/payment-flow) — full Stripe integration details
