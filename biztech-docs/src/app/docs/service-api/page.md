---
title: '[Service] API'
nextjs:
  metadata:
    title: '[Service] API'
    description: 'Endpoint reference for the [Service] API.'
---

Complete endpoint reference for the [Service] API. {% .lead %}

---

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/resource` | 🔓 | List all resources |
| POST | `/api/resource` | 🔑 | Create a resource |
| GET | `/api/resource/:id` | 🔓 | Get one resource |
| PUT | `/api/resource/:id` | 🔑 | Update a resource |
| DELETE | `/api/resource/:id` | 🔑 | Delete a resource |

---

## GET /api/resource

Returns a list of all resources. Requires authentication.

### Request

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.ubcbiztech.com/api/resource
```

### Response

```json
{
  "data": [
    {
      "id": "abc-123",
      "name": "Example",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "count": 1
}
```

{% callout title="Note" %}
All timestamps are in ISO 8601 format (UTC).
{% /callout %}
