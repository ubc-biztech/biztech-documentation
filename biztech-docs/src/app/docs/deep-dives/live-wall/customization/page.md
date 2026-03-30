---
title: 'Live Wall: Customization & Reference'
nextjs:
  metadata:
    title: 'Live Wall: Customization & Reference'
    description: '3D version differences, URL parameters, keyboard shortcuts, common tasks, and tips for the Live Connection Wall.'
---


This page covers the 3D variant, URL configuration, keyboard shortcuts, and practical guidance for working with the Live Wall.

---

## 3D Version Differences

The 3D wall (`3DConnectionWall.tsx`) uses **Three.js** for rendering:

- Nodes are **3D spheres** with glow halos (using `SpriteMaterial` with additive blending)
- Labels use `three-spritetext` for billboard-style text
- Camera auto-orbits using `cameraPosition()` with spherical coordinates
- The scene has **fog**, **hemisphere lighting**, and **directional lighting** for depth
- Link particles flow along edges to show directionality

Key visual differences:
- Nodes have subtle transparency with `MeshPhongMaterial`
- Crown rings for top connectors use additive blending
- Trails are rendered as dashed `THREE.Line` objects
- Heatmap uses `THREE.Sprite` objects with additive blending

---

## URL Parameters

You can control the wall's behavior via URL query parameters:

| Parameter | Values | Effect |
|-----------|--------|--------|
| `kiosk` | `1` | Enables kiosk mode (hides UI, enables auto-pan) |
| `autopan` | `0` | Disables auto-panning |
| `ticker` | `0` | Hides the scrolling ticker |
| `leaderboard` | `0` | Hides the leaderboard sidebar |
| `heat` | `0` or `1` | Disables or enables heatmap |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **L** | Toggle leaderboard |
| **T** | Toggle ticker |
| **A** | Toggle auto-pan |
| **H** | Toggle heatmap |
| **S** | Toggle search |
| **Escape** | Close search / deselect / exit path mode |

---

## Common Tasks

### Adding a New Visual Feature

1. Add your constant/tunable at the top of `ConnectionWall.tsx`
2. Add state (if needed). Prefer refs for data the graph reads every frame
3. If it's a UI overlay, add it to the JSX in the render section
4. If it's a canvas effect, modify the `nodeCanvasObject` callback (2D) or `buildNodeObject` / `handleRenderFrame` (3D)

### Changing Node Appearance

In the 2D version, look for the `nodeCanvasObject` callback passed to `<ForceGraph2D>`. This is a function that receives a Canvas 2D context and draws each node.

In the 3D version, look for `buildNodeObject`, which creates a Three.js `Group` containing a sphere, halo sprite, label, and optional crown ring.

### Debugging WebSocket Issues

1. Check the connection indicator (green = connected, yellow = connecting, red = offline)
2. Open browser DevTools → Network → WS tab to see messages
3. The backend logs `[WS]` and `[WALL]` prefixed messages to CloudWatch
4. If the wall is empty, try clicking "Refresh" to fetch a new snapshot

---

## Tips for New Developers

- **Don't panic** about the file size. `ConnectionWall.tsx` is large but well-organized. The top has constants, then types, then utility functions, then the component with hooks, then the JSX render.
- **Refs vs State**: If data needs to be read every animation frame (like node positions), use a ref. If data drives UI updates (like the ticker list), use state.
- **Testing without NFC**: Use the dev simulation mode (play button) or manually send WebSocket messages via the browser console.
- **Performance**: The 2D version is much lighter than 3D. For large events (500+ people), the 2D version is recommended.
