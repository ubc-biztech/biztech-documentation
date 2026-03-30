---
title: 'Live Connection Wall'
nextjs:
  metadata:
    title: 'Live Connection Wall'
    description: 'In-depth guide to the real-time network visualization feature that powers BizTech events.'
---


The **Live Connection Wall** is a real-time, interactive network graph that visualizes connections being made at BizTech events. When two people tap their NFC cards together, a new edge appears on the wall instantly. It's one of the most technically impressive features in the codebase.

---

## How It Works

Here is the full journey of a connection:

1. **Person A scans Person B's NFC card** → The phone opens Person B's profile URL
2. **The frontend calls** `POST /interactions` with the connection details
3. **The backend** saves the connection in DynamoDB and **broadcasts** it via WebSocket
4. **The Live Wall** receives the WebSocket message and **animates** a new node + edge on the graph

```
NFC Tap → Profile Page → POST /interactions → DynamoDB + WebSocket Broadcast → Live Wall renders it
```

{% callout type="note" title="Two versions" %}
There are two wall components: a **2D version** (`ConnectionWall.tsx`, ~2800 lines) and a **3D version** (`3DConnectionWall.tsx`, ~1100 lines). They share the same backend and WebSocket protocol. The 2D version has more features (search, analytics, path finder, cluster detection). The 3D version uses Three.js for a more immersive look.
{% /callout %}

---

## Key Files

| File | What it does |
|------|-------------|
| `src/components/LiveWall/ConnectionWall.tsx` | Main 2D wall component (the big one) |
| `src/components/LiveWall/3DConnectionWall.tsx` | 3D variant using Three.js |
| `src/components/LiveWall/ForceGraph2DClient.tsx` | Thin wrapper around `react-force-graph-2d` |
| `services/interactions/handler.js` | Backend HTTP + WebSocket handlers |
| `services/interactions/helpers.js` | Connection logic, WebSocket broadcasting, DynamoDB persistence |
| `services/interactions/constants.js` | Current event ID, company lists for quests |

---

## What's Covered in This Section

{% quick-links %}

{% quick-link title="Frontend Architecture" icon="presets" href="/docs/deep-dives/live-wall/frontend/" description="Graph library, data model, state management, and configuration tunables." /%}

{% quick-link title="Key Features" icon="plugins" href="/docs/deep-dives/live-wall/features/" description="All 14 features: WebSocket, spotlight, leaderboard, search, clusters, heatmap, and more." /%}

{% quick-link title="Backend & WebSocket" icon="installation" href="/docs/deep-dives/live-wall/backend/" description="Interactions service, database tables, connection flow, and WebSocket protocol." /%}

{% quick-link title="Customization & Reference" icon="theming" href="/docs/deep-dives/live-wall/customization/" description="3D version, URL parameters, keyboard shortcuts, common tasks, and tips." /%}

{% /quick-links %}
