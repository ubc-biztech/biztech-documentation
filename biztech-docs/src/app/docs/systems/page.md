---
title: Systems
nextjs:
  metadata:
    title: Systems
    description: How the BizTech app works as a system. Cross-cutting concerns, integration patterns, and end-to-end execution paths.
---

How the BizTech app works as a system — not just individual services or pages, but how the pieces connect. {% .lead %}

These pages document the interfaces between frontend and backend, the execution path of a request, and how to trace a feature across codebases.

{% quick-links %}

{% quick-link title="Frontend–Backend Integration" icon="installation" href="/docs/systems/frontend-backend-integration" description="How the frontend talks to the backend: fetchBackend, API URLs, auth headers, error handling." /%}

{% quick-link title="Request Execution Path" icon="presets" href="/docs/systems/request-execution-path" description="What happens from button click to database write and back. The full execution trace." /%}

{% quick-link title="Tracing a Feature" icon="theming" href="/docs/systems/tracing-features" description="How to find and follow any feature through the frontend, API, handler, and database." /%}

{% quick-link title="Registration System" icon="plugins" href="/docs/systems/registration" description="The registration system across frontend forms, backend processing, emails, capacity, and payments." /%}

{% quick-link title="Authentication System" icon="lightbulb" href="/docs/systems/authentication" description="How auth works end-to-end: Cognito, Amplify, middleware, API Gateway authorizer, admin checks." /%}

{% quick-link title="Endpoint Registry" icon="warning" href="/docs/systems/endpoint-registry" description="Every HTTP endpoint across all 21 backend services, organized by service." /%}

{% /quick-links %}
