# Pixel Art Office Site — Design Spec

**Date:** 2026-05-07  
**Status:** Approved

## Overview

A localhost plain HTML/CSS/JS site that renders a pixel-art office scene with a single animated character, plus an admin page for editing the tile layout and placing furniture. No build tools, no framework — runs via `python -m http.server 8000` (or any static file server).

---

## File Structure

```
personal-site-2/
├── index.html              # Scene viewer
├── admin.html              # Layout editor
├── css/
│   ├── main.css
│   └── admin.css
├── js/
│   ├── constants.js        # TILE_SIZE, animation timings, TileType enum
│   ├── tileMap.js          # isWalkable, getWalkableTiles, findPath (BFS)
│   ├── character.js        # createCharacter, updateCharacter
│   ├── renderer.js         # renderTileGrid, renderScene, renderFrame
│   ├── gameLoop.js         # requestAnimationFrame loop with capped dt
│   ├── furnitureLoader.js  # load catalog.json, preload DESK PNGs
│   ├── layoutStore.js      # localStorage save/load + default-layout fallback
│   ├── sceneMain.js        # index.html bootstrap
│   └── adminMain.js        # admin.html bootstrap + editor logic
├── assets/
│   ├── Character Model.png # 384×32 horizontal strip, 24 frames
│   └── furniture/
│       └── DESK/
│           ├── DESK_FRONT.png   # 48×32, footprint 3×2
│           ├── DESK_SIDE.png    # 16×64, footprint 1×4
│           └── manifest.json    # copied from pixel-agents repo
└── data/
    ├── catalog.json         # flattened furniture definitions
    └── default-layout.json  # fallback 20×11 floor room
```

---

## Pages

### `index.html` — Scene Viewer
- Full-screen canvas, centered
- Small "Admin →" link in a corner
- Loads `sceneMain.js`, which: loads layout from localStorage (falls back to `default-layout.json`), preloads assets, then starts the game loop

### `admin.html` — Layout Editor
- Canvas (~70% width, left) + sidebar (~240px, right)
- Sidebar: active tool buttons (Floor / Wall / Void / Desk), Save button, Reset button, "← View Scene" link
- Canvas shows the live scene (same renderer as viewer)

---

## Character

### Sprite Sheet
- File: `assets/Character Model.png`
- Dimensions: 384×32px, single horizontal strip
- 24 frames total, 16×32px each
- Direction layout: `[DOWN 0–5][RIGHT 6–11][UP 12–17][LEFT 18–23]`

### Frame Rendering
No SpriteData conversion. Frames drawn directly:
```js
ctx.drawImage(img, srcX, 0, 16, 32, drawX, drawY, 16 * zoom, 32 * zoom);
// srcX = directionOffset + frameIndex * 16
// Direction pixel offsets: DOWN=0, RIGHT=96, UP=192, LEFT=288
```

### Animation States

| State | Frames used | Frame duration |
|-------|-------------|----------------|
| WALK  | 0–5 cycled  | 0.15s          |
| IDLE / TYPE | frame 0 held | — |

### Behavior (autonomous wander loop)
1. Spawn at a random walkable tile
2. BFS-pathfind to a random walkable destination
3. Walk there (WALK state, cycling frames)
4. Arrive → IDLE state, wait 2–20s (random)
5. Repeat indefinitely

No seat detection in v1 — TYPE state is unused for now.

---

## Rendering Pipeline

`renderFrame` (called every animation frame):
1. `ctx.clearRect`
2. Draw floor tiles: solid `#808080`
3. Draw wall tiles: solid `#3A3A5C`
4. Skip VOID tiles (transparent)
5. Collect furniture + character as `{ zY, draw }` drawables
6. Sort by `zY` ascending (lower Y = behind)
7. Draw in order
8. `imageSmoothingEnabled = false` always

**Zoom**: computed once at startup:
```js
zoom = Math.floor(Math.min(innerWidth / (cols * 16), innerHeight / (rows * 16)));
zoom = Math.max(1, zoom);
```
No zoom UI control.

**Character draw position**: bottom-center anchor:
```js
drawX = offsetX + ch.x * zoom - (16 * zoom) / 2;
drawY = offsetY + ch.y * zoom - 32 * zoom;
```

**Map centering**:
```js
offsetX = Math.floor((canvas.width - cols * 16 * zoom) / 2) + panX;
offsetY = Math.floor((canvas.height - rows * 16 * zoom) / 2) + panY;
```
No pan controls in v1 (panX = panY = 0).

---

## Admin Editor

### Tool Modes

| Tool | Cursor behavior | Drag behavior |
|------|-----------------|---------------|
| Floor | Paint tile → FLOOR | Continuous paint |
| Wall | Paint tile → WALL | Continuous paint |
| Void | Paint tile → VOID | Continuous paint |
| Desk | Ghost preview follows cursor; click to place | — |

### Desk Placement
- Ghost is semi-transparent (50% alpha), tinted green if valid, red if invalid
- Valid = all footprint tiles are FLOOR and unoccupied
- Rotate button in sidebar cycles variant: DESK_FRONT ↔ DESK_SIDE
- Confirm with click; generates a random `uid`

### Furniture Selection
- Click a placed desk → dashed selection rect drawn on canvas
- **×** button (top-right of selection): deletes the piece
- **↻** button (top-left of selection): rotates to next variant in-place
- Click anywhere else to deselect

### Save / Reset
- **Save**: writes current layout to `localStorage['pixel-office-layout']`
- **Reset**: removes the key and reloads from `default-layout.json`

---

## Data Formats

### `data/catalog.json`
```json
[
  {
    "id": "DESK",
    "label": "Desk",
    "variants": [
      { "id": "DESK_FRONT", "file": "assets/furniture/DESK/DESK_FRONT.png", "w": 48, "h": 32, "footprintW": 3, "footprintH": 2 },
      { "id": "DESK_SIDE",  "file": "assets/furniture/DESK/DESK_SIDE.png",  "w": 16, "h": 64, "footprintW": 1, "footprintH": 4 }
    ]
  }
]
```

### `data/default-layout.json`
```json
{
  "version": 1,
  "cols": 20,
  "rows": 11,
  "tiles": [ ...220 values: 0=wall border, 1=floor interior, 255=void... ],
  "furniture": []
}
```

### `localStorage` key: `pixel-office-layout`
Same shape as `default-layout.json`.

### Placed furniture entry
```json
{ "uid": "abc123", "type": "DESK", "variantId": "DESK_FRONT", "col": 5, "row": 3 }
```

### Tile values
| Value | Meaning |
|-------|---------|
| `0` | WALL |
| `1` | FLOOR |
| `255` | VOID |

---

## Pathfinding (`tileMap.js`)

BFS on 4-connected grid (no diagonals). Identical logic to pixel-agents `findPath`:
- Returns path excluding start tile, including end tile
- End tile must be walkable
- Blocked tiles (furniture footprints) passed as `Set<string>` of `"col,row"` keys

`getWalkableTiles` returns all non-wall, non-void, non-blocked tiles for random destination picking.

---

## Assets to Download

From `https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/furniture/DESK/`:
- `DESK_FRONT.png`
- `DESK_SIDE.png`
- `manifest.json`
