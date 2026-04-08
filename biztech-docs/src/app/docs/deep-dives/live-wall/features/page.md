---
title: 'Live Wall: Key Features'
nextjs:
  metadata:
    title: 'Live Wall: Key Features'
    description: 'All 14 features of the Live Connection Wall, including WebSocket, spotlight, leaderboard, search, clusters, heatmap, and more.'
---

The Live Wall is packed with interactive features. This page covers all 14 of them in detail.

---

## 1. Real-Time WebSocket Connection

The wall opens a WebSocket connection on mount and subscribes to events:

```typescript
const ws = new WebSocket(`${WS_URL}?v=1`)

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      action: 'subscribe',
      eventId: selectedEventId,
    }),
  )
}

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)

  if (msg.type === 'snapshot') {
    // Initial batch of nodes + links
  }

  if (msg.type === 'connection' || msg.type === 'edge') {
    // A new connection just happened!
    // 1. Create/find the two nodes
    // 2. Add the link between them
    // 3. Trigger animations
  }
}
```

If the WebSocket disconnects, it automatically reconnects after 1.5 seconds.

---

## 2. Snapshot Loading

On startup, the wall fetches a "snapshot" of recent connections via HTTP:

```
GET /interactions/wall?eventId=kickstart-2025&sinceSec=300
```

This returns all connections from the last 5 minutes (300 seconds). The wall uses this to pre-populate the graph so it's not empty when you first open it.

---

## 3. Node Spawning Animation

When a new node appears, it doesn't just pop in. Instead, it animates with an **easeOutBack** curve (a springy overshoot effect):

```typescript
const easeOutBack = (t: number, s = 1.10158) =>
  1 + s * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
```

New nodes are spawned near the node they're connecting to, and they have a `__born` timestamp that drives the intro animation over `INTRO_MS` (1200ms).

---

## 4. Spotlight Banner

When a connection happens, a green banner slides in at the top:

> **Lucas** connected with **Grace**

This stays visible for `SPOTLIGHT_MS` (6 seconds) and then fades out.

---

## 5. Streaks and Toasts

The wall tracks how frequently each person makes connections. If someone makes `STREAK_THRESHOLD` connections within `STREAK_WINDOW_MS`, a toast notification appears:

> 🏅 Kevin is on a streak!

---

## 6. Scrolling Ticker

A news-ticker-style scroll at the bottom shows recent connections with timestamps. It uses CSS animations and auto-calculates the scroll duration based on content width.

---

## 7. Leaderboard

A sidebar panel shows the top connectors ranked by degree (number of connections). Press **L** to toggle it. The top 3 get gold/silver/bronze medal badges and crown rings on their nodes.

---

## 8. Search

Press **S** to open the search bar. It fuzzy-matches against node names and lets you click a result to zoom the camera to that person.

---

## 9. Cluster Detection (2D only)

The wall uses BFS (Breadth-First Search) to detect **clusters**, which are groups of people who are all connected to each other but not to other groups:

```typescript
function computeClusters(
  nodes: WallNode[],
  neighbors: Map<string, Set<string>>,
): Map<string, number> {
  const clusterMap = new Map<string, number>()
  const visited = new Set<string>()
  let clusterId = 0
  for (const node of nodes) {
    if (visited.has(node.id)) continue
    const queue = [node.id]
    visited.add(node.id)
    while (queue.length) {
      const cur = queue.shift()!
      clusterMap.set(cur, clusterId)
      const nbrs = neighbors.get(cur)
      if (nbrs) {
        Array.from(nbrs).forEach((nb) => {
          if (!visited.has(nb)) {
            visited.add(nb)
            queue.push(nb)
          }
        })
      }
    }
    clusterId++
  }
  return clusterMap
}
```

The function takes the full `nodes` array and the `neighbors` adjacency map, and returns a `Map<string, number>` mapping each node ID to its cluster ID. When cluster mode is enabled, each cluster gets its own color.

---

## 10. Path Finder (2D only)

Click the route icon, then click two nodes to find the **shortest path** between them. It uses BFS:

```typescript
function bfsShortestPath(startId, endId, neighborsMap) {
  const queue = [[startId]]
  const visited = new Set([startId])

  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]

    if (current === endId) return path

    for (const neighbor of neighborsMap.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }
  return null // No path found
}
```

---

## 11. Heatmap

When enabled (press **H**), nodes that have been recently active get a glowing halo. The intensity fades over `HEATMAP_WINDOW_MS`. This helps you spot the most socially active areas of the event at a glance.

---

## 12. Auto-Pan

For display screens at events, the wall supports auto-panning. Every `AUTOPAN_INTERVAL_MS`, the camera smoothly moves to a recently active node, then zooms back out. This creates a cinematic effect.

You can also enable **kiosk mode** via URL parameter: `?kiosk=1`

---

## 13. Event Switching

The dropdown in the header lets you switch between events. When you switch:

1. The graph clears completely
2. A new WebSocket subscription is sent
3. A fresh snapshot is fetched

---

## 14. Dev Simulation Mode

In development, you can toggle a **simulation mode** that generates fake connections with random names. This is invaluable for testing without needing real NFC taps:

- Press the play/stop button (dev only)
- It creates a burst of initial connections, then adds new ones at random intervals
- Uses a pool of fake names like "Alice Chen", "Bob Wang", etc.
