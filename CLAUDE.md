# Pixel Office

Vanilla HTML/JS pixel-art office scene. No bundler, no framework, no TypeScript.

## Pages

| Page | Entry point | Purpose |
|---|---|---|
| `index.html` | `js/sceneMain.js` | Full-screen scene viewer with animated wandering character |
| `admin.html` | `js/adminMain.js` | Tile painter + furniture placement editor |
| `tests.html` | `js/tests/` | In-browser test suite (no Node/npm) |

## Module Map

```
js/
  constants.js       — all shared constants, enums (TileType, Direction, CharacterState)
  gameLoop.js        — rAF loop, capped delta-time
  renderer.js        — canvas draw: tiles → z-sorted furniture+character
  character.js       — wander state machine, sprite frame calculation
  tileMap.js         — BFS pathfinding, walkability checks
  layoutStore.js     — load/save/reset layout (localStorage → default-layout.json fallback)
  furnitureLoader.js — fetch catalog.json, preload sprite images
  sceneMain.js       — scene entry: load → build → game loop
  adminMain.js       — editor entry: load → dirty-flag RAF → mouse event handlers
  tests/run.js       — minimal assert/assertEqual harness
```

## Data

- `data/catalog.json` — furniture item definitions: `{id, variants[{id, file, w, h, footprintW, footprintH}]}`
- `data/default-layout.json` — 20×11 tile grid, flat array; `0=WALL 1=FLOOR 255=VOID`, `furniture: []`
- Layout persisted to `localStorage` key `pixel-office-layout`; falls back to `default-layout.json` on first load

## Assets

- `assets/Character Model.png` — 766×33 sprite strip, 4 directions × 6 frames, 16px wide / 32px tall per frame
- `assets/furniture/DESK/DESK_FRONT.png` — 48×32px, footprint 3×2 tiles
- `assets/furniture/DESK/DESK_SIDE.png` — 16×64px, footprint 1×4 tiles
- `assets/furniture/DESK/manifest.json` — per-sprite metadata (not read at runtime; catalog.json is authoritative)

## Key Conventions

- **Tile map**: stored flat in JSON, rebuilt to `tileMap[row][col]` 2D array via `buildTileMap()`
- **Furniture instances**: catalog is source of truth for dimensions/footprints; placed instances store only `{uid, type, variantId, col, row}`
- **Blocked tiles**: `Set<"col,row">` rebuilt from placed furniture each time layout changes
- **Rendering**: all drawables Z-sorted by bottom-edge Y (painter's algorithm); integer-only zoom via `Math.floor`
- **Admin render loop**: dirty-flag (`needsRender`) RAF, not a continuous game loop
- **Tests**: run in-browser via `tests.html`; harness is `js/tests/run.js` (no Node)
