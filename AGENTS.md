# Pixel Office

Vanilla HTML/JS pixel-art office scene. No bundler, no framework, no TypeScript. ES6 modules run directly in browser.

## Pages

| Page | Entry point | Purpose |
|---|---|---|
| `index.html` | `js/sceneMain.js` | Full-screen scene viewer with animated wandering character |
| `admin.html` | `js/adminMain.js` | Tile painter + furniture placement editor |
| `tests.html` | inline module | In-browser test runner, no Node/npm |

## Module Map

```
js/
  constants.js       — root; TileType, Direction, CharacterState, TILE_SIZE, speeds, colors
  gameLoop.js        — rAF loop, delta-time cap, returns stop(); sets imageSmoothingEnabled=false
  tileMap.js         — isWalkable, getWalkableTiles, findPath (BFS)
  character.js       — createCharacter, updateCharacter (wander AI), getFrameSrcX
  renderer.js        — renderFrame (tiles→Z-sorted furniture+character), computeZoom, pixelToTile, computeOffset
  layoutStore.js     — loadLayout, saveLayout, resetLayout, buildTileMap, buildBlockedTiles, buildFurnitureInstances
  furnitureLoader.js — loadCatalog, loadFurnitureSprites, loadAllFloorTiles
  sceneMain.js       — scene entry: parallel load → build → game loop → storage/resize listeners
  adminMain.js       — editor entry: load → state obj → dirty-flag RAF → mouse/button handlers
  tests/run.js       — assert, assertEqual, getResults (14-line harness)
  tests/tileMap.test.js
  tests/layoutStore.test.js
  tests/character.test.js
```

### Dependency graph

```
constants ← (none)
gameLoop  ← constants
tileMap   ← constants
character ← constants, tileMap
renderer  ← constants, character
layoutStore    ← (none)
furnitureLoader← (none)
sceneMain ← all above
adminMain ← all above
```

## Data Schemas

**catalog.json** — array of furniture types:
```json
{
  "id": "DESK", "label": "Desk",
  "category": "desks|chairs|wall|items",
  "variants": [{ "id": "DESK_FRONT", "file": "assets/...", "w": 48, "h": 32,
                  "footprintW": 3, "footprintH": 2, "mirror": false, "centered": false }]
}
```
38 furniture types total. `mirror: true` → flip horizontally on render. `centered: true` → center sprite within footprint.

**default-layout.json** — 32×18 grid:
```json
{ "version": 1, "cols": 32, "rows": 18,
  "tiles": [...],
  "furniture": [{ "uid": "abc12345", "type": "DESK", "variantId": "DESK_FRONT", "col": 5, "row": 3 }] }
```
Tile values: `0=WALL  1=FLOOR(legacy)  2=FLOOR_WHITE  3=FLOOR_GRAY  255=VOID`

Layout persisted to `localStorage` key `pixel-office-layout`; falls back to `default-layout.json` on first load.

## Assets

- `assets/Character Model.png` — 766×33 sprite strip; 4 directions × 6 frames; 16px wide / 32px tall per frame
- `assets/furniture/<TYPE>/<VARIANT>.png` — sprites; dimensions/footprints defined in catalog.json (authoritative)
- `assets/floor/wooden.png`, `white.png`, `gray.png` — floor tile textures (loaded by `loadAllFloorTiles`)

## Key Conventions

**Data structures**
- Tile map stored flat in JSON (`tiles[r*cols+c]`), rebuilt to `tileMap[r][c]` via `buildTileMap()`
- Placed furniture instances store only `{uid, type, variantId, col, row}`; all dimensions/sprites resolved from catalog at runtime
- Blocked tiles: `Set<"col,row">` strings for O(1) walkability checks; rebuilt on every layout change

**Rendering**
- All drawables Z-sorted by bottom-edge Y (painter's algorithm) each frame
- Items (`category: "items"`) layer above desks via adjusted Z
- Integer-only zoom via `Math.floor`; `imageSmoothingEnabled = false` for pixel-perfect output
- Scene: continuous rAF game loop. Admin: dirty-flag (`needsRender`) RAF

**Placement rules by category**
- `desks` — floor tiles only (or wall-backed top edge)
- `chairs` — floor tiles only
- `wall` — wall tiles only
- `items` — no tile restriction; float above furniture

**Naming**
- Furniture/variant IDs: `UPPER_SNAKE_CASE` (e.g. `DESK_FRONT`, `SOFA_SIDE_MIRROR`)
- Enums: `TileType.WALL`, `Direction.RIGHT`, `CharacterState.IDLE`
- Functions: `camelCase`. DOM IDs/CSS classes: `kebab-case`

**Character AI**
- State machine: IDLE → wander timer expires → pick random walkable tile → BFS pathfind → WALK → IDLE
- Sub-pixel interpolation between tiles; 6 animation frames per direction at 0.15s/frame

**Tests**
- 29 assertions across 3 files; run in-browser via `tests.html`
- Harness: `js/tests/run.js` — `assert`, `assertEqual` (JSON.stringify deep-equal), `getResults`
