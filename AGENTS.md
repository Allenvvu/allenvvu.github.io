# Pixel Office

Static browser app built with vanilla HTML, CSS, JSON, and ES modules. No bundler, no framework, no TypeScript, no Node runtime required.

## Entry Points

| Page | Boot file | Purpose |
|---|---|---|
| `index.html` | `js/sceneMain.js` | Public scene viewer with wandering character and portfolio overlay |
| `admin.html` | `js/adminMain.js` | Protected layout editor for tiles and furniture |
| `tests.html` | inline module | In-browser test harness for pure JS modules |

## Directory Map

```text
assets/
  Character Model.png
  floor/              floor textures; runtime currently uses wooden/white/gray/gray_nogrid
  furniture/          38 furniture type folders; catalog.json is authoritative, not manifest.json

css/
  main.css            public scene + portfolio overlay styles
  admin.css           editor shell, auth gate, sidebar, overlays

data/
  catalog.json        furniture catalog: 38 types, 53 variants, 4 categories
  default-layout.json blank-ish fallback layout
  published-layout.json shipped layout used before local edits exist

js/
  constants.js        enums, tile values, sprite math, movement tuning
  furnitureLoader.js  catalog fetch, furniture sprite loads, floor tile loads
  layoutStore.js      layout load/save/reset + derived tile/block/render structures
  tileMap.js          walkability checks + BFS pathfinding
  character.js        wandering AI + sprite frame selection
  renderer.js         tile/furniture/character rendering, zoom, offsets, pixel→tile
  gameLoop.js         shared scene rAF loop
  portfolio.js        portfolio overlay state, room cameras, modal content
  sceneMain.js        public scene bootstrap
  adminMain.js        editor bootstrap + full interaction controller
  tests/
    run.js
    tileMap.test.js
    character.test.js
    layoutStore.test.js
    portfolio.test.js
    githubPublish.test.js   orphaned; imports missing js/githubPublish.js and is not run by tests.html

docs/superpowers/
  plans/              implementation plans
  specs/              design/spec notes
```

## Runtime Architecture

### Scene
- `sceneMain.js` loads catalog + layout in parallel, then character sprite, furniture sprites, and floor textures.
- Layout source order is: `localStorage` → `data/published-layout.json` → `data/default-layout.json`.
- Scene builds derived state with `buildTileMap()`, `buildBlockedTiles()`, and `buildFurnitureInstances()`.
- Character spawns on a random walkable tile and updates every frame.
- Rendering runs through `startGameLoop()` and `renderFrame()`.
- Portfolio navigation is layered over the canvas and drives camera transitions via `portfolio.js`.
- Cross-tab layout changes sync through the `storage` event.

### Admin
- `admin.html` has a client-side auth gate, canvas area, floating selection toolbar, and sidebar controls.
- `adminMain.js` uses one mutable `state` object plus a dirty-flag render loop (`needsRender`).
- Editor supports tile painting, furniture placement, selection, deletion, rotation, save, reset, and publish/export.
- Save writes to `localStorage`.
- Publish exports a JSON file with `showSaveFilePicker()` when available, otherwise a download link fallback.
- Reset clears `localStorage` and reloads `data/default-layout.json`.

## Module Responsibilities

| Module | Responsibility |
|---|---|
| `js/constants.js` | `TileType`, `Direction`, `CharacterState`, sizes, speeds, sprite offsets |
| `js/furnitureLoader.js` | Fetch `catalog.json`; load furniture images and 4 floor textures |
| `js/layoutStore.js` | Load persisted layout; rebuild tile map, blocked tiles, furniture instances, animation state |
| `js/tileMap.js` | `isWalkable()`, `getWalkableTiles()`, `findPath()` |
| `js/character.js` | Idle/walk state machine and sprite strip frame selection |
| `js/renderer.js` | Draw tiles, z-sort drawables, render mirrored/animated/centered sprites, compute zoom/offset |
| `js/gameLoop.js` | Capped-delta requestAnimationFrame loop for the public scene |
| `js/portfolio.js` | Section targets, camera math, modal content, open/close transitions |
| `js/sceneMain.js` | Public app orchestration |
| `js/adminMain.js` | Editor state, placement rules, mouse handling, toolbar actions |

## Data Contracts

### Layout

```json
{
  "version": 1,
  "cols": 32,
  "rows": 18,
  "tiles": [255, 2, 2],
  "furniture": [
    { "uid": "abc12345", "type": "DESK", "variantId": "DESK_FRONT", "col": 5, "row": 3 }
  ]
}
```

- Tiles are stored flat as `tiles[row * cols + col]`.
- Runtime rebuilds `tileMap[row][col]`.
- `default-layout.json` currently contains no furniture and mostly white floor + void border.
- `published-layout.json` currently contains 30 placed furniture instances.

### Tile Values

| Value | Meaning |
|---|---|
| `0` | `WALL` |
| `1` | `FLOOR` / wooden legacy floor |
| `2` | `FLOOR_WHITE` |
| `3` | `FLOOR_GRAY` |
| `4` | `FLOOR_GRAY_NOGRID` |
| `255` | `VOID` |

### Catalog

```json
{
  "id": "DESK",
  "label": "Desk",
  "category": "desks",
  "variants": [
    {
      "id": "DESK_FRONT",
      "file": "assets/furniture/DESK/DESK_FRONT.png",
      "w": 48,
      "h": 32,
      "footprintW": 3,
      "footprintH": 2
    }
  ]
}
```

- Categories: `desks`, `chairs`, `wall`, `items`
- Live optional variant flags:
  - `mirror`
  - `centered`
  - `anchorBottom`
  - `frames`
  - `frameW`
  - `frameDuration`

## Rendering Rules

- Tile size is `16px`.
- Public scene uses fixed zoom `3.5`.
- Editor uses integer fit zoom from `computeZoom()`.
- All drawables are sorted by bottom-edge Y each frame.
- `items` render above the non-item furniture beneath them.
- `mirror: true` flips sprites horizontally at draw time.
- `centered: true` centers sprite art within its footprint.
- `anchorBottom: true` bottom-aligns tall sprites inside the footprint.
- Animated furniture uses `frameIndex` + `frameTimer` derived at runtime.
- `imageSmoothingEnabled` is always disabled for pixel rendering.

## Interaction Rules

### Character
- State machine: `IDLE` → choose random walkable target → BFS path → `WALK` → `IDLE`
- Movement is sub-tile interpolated.
- Walk speed is `48 px/sec`.
- Walk animation uses 6 frames per direction.
- Wander delay is randomized between `2s` and `20s`.

### Furniture Placement
- `desks`: floor tiles only, except top footprint row may back against a wall
- `chairs`: floor tiles only
- `wall`: wall tiles only
- `items`: no tile restriction
- Occupancy is tracked as `Set<"col,row">` blocked tiles
- Rotation cycles through a furniture type's catalog variants if the new footprint still fits

## Tests

- Tests are browser-only and run from `tests.html`.
- Active suites:
  - `tileMap.test.js`
  - `character.test.js`
  - `layoutStore.test.js`
  - `portfolio.test.js`
- Harness is `js/tests/run.js` with `assert()`, `assertEqual()`, and `getResults()`.
- `githubPublish.test.js` is currently inactive drift: `tests.html` does not import it, and `js/githubPublish.js` does not exist.

## Conventions

- Use ES modules with explicit relative imports ending in `.js`.
- Functions are `camelCase`.
- Enums/constants are exported from `constants.js` as frozen objects.
- Furniture and variant IDs are `UPPER_SNAKE_CASE`.
- DOM ids and CSS classes are kebab-case.
- `catalog.json` is the source of truth for runtime furniture metadata; per-folder `manifest.json` files are not consumed by the app.
- Local edit persistence key is `pixel-office-layout`.

## Known Drift

- `AGENTS.md` and `CLAUDE.md` may lag the code; prefer the live modules.
- `js/tests/githubPublish.test.js` references a missing module.
- `docs/superpowers/` describes planned/previous work and is not guaranteed to match runtime behavior.
- Admin auth is only a client-side gate; the password is visible in source and `sessionStorage` stores the auth flag.
