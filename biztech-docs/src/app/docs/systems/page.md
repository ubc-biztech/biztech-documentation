---
title: Systems
nextjs:
  metadata:
    title: Systems
    description: Cross-cutting implementation details — how the frontend and backend integrate, the request execution path, and the endpoint registry.
---

Cross-cutting implementation details that span the entire stack. These pages document how the pieces connect rather than what any single service does. {% .lead %}

{% quick-links %}

{% quick-link title="Frontend–Backend Integration" icon="installation" href="/docs/systems/frontend-backend-integration" description="How the frontend talks to the backend: fetchBackend, API URLs, auth headers, error handling." /%}

{% quick-link title="Request Execution Path" icon="presets" href="/docs/systems/request-execution-path" description="What happens from button click to database write and back. The full execution trace." /%}

{% quick-link title="Endpoint Registry" icon="warning" href="/docs/systems/endpoint-registry" description="Every HTTP endpoint across all 21 backend services, organized by service." /%}

{% /quick-links %}
