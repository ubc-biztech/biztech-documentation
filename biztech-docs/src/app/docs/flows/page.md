---
title: Flows
nextjs:
  metadata:
    title: Flows
    description: End-to-end walkthroughs of the major user and admin flows in the BizTech app — account creation, membership, event lifecycle, registration, payments, and check-in.
---

End-to-end walkthroughs of the major flows in the BizTech app. Each page traces a complete user or admin journey from trigger to outcome. {% .lead %}

{% quick-links %}

{% quick-link title="Account Creation" icon="installation" href="/docs/flows/account-creation" description="New user signup through Cognito, user record creation, and initial state." /%}

{% quick-link title="Membership" icon="presets" href="/docs/flows/membership" description="The membership purchase flow — Stripe payment, Cognito signup, user/member/profile record creation." /%}

{% quick-link title="Event Lifecycle" icon="theming" href="/docs/flows/event-lifecycle" description="How an event moves from creation through registration, check-in, feedback, and analytics." /%}

{% quick-link title="Registration" icon="plugins" href="/docs/systems/registration" description="Step-by-step: form submission, capacity checking, email delivery, and database writes." /%}

{% quick-link title="Payment Flow" icon="lightbulb" href="/docs/systems/payment-flow" description="Stripe Checkout integration for event registration fees and membership payments." /%}

{% quick-link title="Event Check-In" icon="warning" href="/docs/flows/check-in" description="QR scanner and manual check-in at events. Status transitions and admin dashboard." /%}

{% quick-link title="Profile Sync" icon="installation" href="/docs/flows/profile-sync" description="How profile data stays in sync across user, member, and profile records." /%}

{% /quick-links %}
