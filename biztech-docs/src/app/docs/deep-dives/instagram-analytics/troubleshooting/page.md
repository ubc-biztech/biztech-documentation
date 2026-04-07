---
title: 'Instagram Analytics: Troubleshooting'
nextjs:
  metadata:
    title: 'Instagram Analytics Troubleshooting'
    description: 'Common error scenarios for instagram analytics.'
---

Use this page when the dashboard fails to load or metrics look off.

---

## Common Errors

### `Instagram access token is not configured on the server.`

Check:

1. deployed backend has `IG_ACCESS_TOKEN` configured
2. correct stage/environment is being called
3. token secret was added where the backend runtime expects it

---

### Date validation errors (`406`)

- invalid format: must be `YYYY-MM-DD`
- `since` after `until`
- range larger than 730 days

---

### Empty dashboard sections

Usually means selected range has little/no data for that slice:

- no posts in range
- no monthly buckets
- no data for a specific top-post metric

Use `Last 90d` or wider range to confirm pipeline health.

{% callout title="Token operations" %}
Keep token handling server-side only. Never expose Instagram access tokens to the frontend.
{% /callout %}
