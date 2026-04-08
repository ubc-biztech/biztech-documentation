---
title: 'Live Wall: Frontend Architecture'
nextjs:
  metadata:
    title: 'Live Wall: Frontend Architecture'
    description: 'Graph library, data model, state management, and configuration tunables for the Live Connection Wall.'
---

This page covers the frontend architecture of the Live Connection Wall, including the graph library, data model, state management patterns, and all the configuration constants you can tweak.

---

## Graph Library

The wall uses the **react-force-graph** library, which wraps D3's force simulation:

- **2D**: `react-force-graph-2d`, which renders on an HTML Canvas
- **3D**: `react-force-graph-3d`, which renders using Three.js / WebGL

Both use a **force-directed layout** where:

- Nodes repel each other (like magnets)
- Links pull connected nodes together (like springs)
- The simulation finds a balanced layout automatically

---

## Data Model

The graph stores two things: **nodes** (people) and **links** (connections).

```typescript
// A person in the graph
type WallNode = {
  id: string // Profile UUID
  name: string // e.g. "Jay Park"
  avatar?: string // Profile picture URL
  x?: number // Current x position (set by physics)
  y?: number // Current y position (set by physics)
  vx?: number // Current x velocity (set by physics)
  vy?: number // Current y velocity (set by physics)
  __born?: number // Timestamp when added (for intro animation)
  __pinUntil?: number // Timestamp until which the node is pinned
}

// A connection between two people
type WallLink = { source: string; target: string; createdAt: number }
```

---

## State Management

The wall uses a **ref-based architecture** instead of putting everything in React state. This is intentional because the force graph library mutates node positions every frame, and re-rendering React on every physics tick would be way too slow.

```typescript
// These are refs, NOT state - they don't cause re-renders
const graphDataRef = useRef({ nodes: [], links: [] })
const nodesByIdRef = useRef({}) // Quick lookup: id → node
const neighborsRef = useRef(new Map()) // id → Set of neighbor ids
const pairKeySetRef = useRef(new Set()) // Prevents duplicate links
```

The component uses a `dataTick` state counter that gets incremented when the graph data changes. This triggers derived computations (like degree calculations) without re-rendering the entire graph:

```typescript
const [dataTick, setDataTick] = useState(0)
// Increment when data changes:
setDataTick((t) => t + 1)
```

{% callout title="Refs vs State" %}
If data needs to be read every animation frame (like node positions), use a ref. If data drives UI updates (like the ticker list), use state. This is the most important architectural decision in the wall.
{% /callout %}

---

## Tunables

At the top of `ConnectionWall.tsx`, you'll find a block of constants that control everything about the visualization:

| Constant              | Default                  | What it controls                         |
| --------------------- | ------------------------ | ---------------------------------------- |
| `VIS`                 | `0.5`                    | Global scale factor for all sizes        |
| `CHARGE_BASE`         | `-2000`                  | How strongly nodes repel each other      |
| `CHARGE_PER_DEG`      | `-80`                    | Extra repulsion per connection           |
| `COLLIDE_BASE`        | `18 * VIS` (9 effective) | Minimum distance between nodes           |
| `INTRO_MS`            | `1200`                   | How long the "pop in" animation takes    |
| `SPOTLIGHT_MS`        | `6000`                   | How long the spotlight banner shows      |
| `HALO_RECENT_MS`      | `20000`                  | How long the "just connected" glow lasts |
| `AUTOPAN_INTERVAL_MS` | `12000`                  | How often the camera moves to a new node |
| `TRAIL_WINDOW_MS`     | `90000`                  | How long trail lines persist             |
| `HEATMAP_WINDOW_MS`   | `300000` (5 min)         | Time window for heatmap glow             |
| `TICKER_MAX`          | `24`                     | Maximum items in the scrolling ticker    |

{% callout title="Tip for customization" %}
If the graph looks too spread out or too cramped, adjust `CHARGE_BASE` (more negative = more spread). If nodes overlap, increase `COLLIDE_BASE`.
{% /callout %}
