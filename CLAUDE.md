# personal-site

Pixel-art portfolio landing page rendered in HTML5 Canvas. Zero dependencies, no build step, no framework. Static HTML hosted on GitHub Pages.

## Stack

- Vanilla JS (ES6), HTML5 Canvas 2D API, inline CSS only
- Python 3 + Pillow — one-time sprite generation utility (already run)
- GitHub Pages — deploy via `git push`; `.nojekyll` skips Jekyll

## Entry Points

| File | Role |
|---|---|
| `index.html` | Full-viewport canvas + fixed CSS name/title overlay |
| `game.js` | Entire engine — setup, render, NPC logic, game loop |
| `tests/test.html` | In-browser unit test harness (open via HTTP server) |

## Coordinate System

- `TILE = 16px`, `SCALE = 3×` → `TS = 48px` on-screen tile
- Room: 24 cols × 16 rows; top 3 rows = wall, rows 3–15 = walkable floor
- `tileToPixel(col, row, roomX, roomY)` converts tile coords to pixels
- `roomOffset(canvasW, canvasH)` centers room on canvas (integer division)

## Rendering Pipeline (per frame)

1. Background fill (`#0d0d1a`)
2. Checkerboard floor tiles
3. Wall strip + baseboard accent
4. Furniture sorted back-to-front by Y
5. NPCs Y-sorted and drawn
6. Vignette (radial gradient overlay)
7. CSS overlay div rendered above canvas by browser

## NPC System

**State machine:** `IDLE` → (random 0.5–2s timer) → `WALKING` → (reach target) → `IDLE`

**NPC object shape:**
```js
{ spriteKey, x, y, dir, frame, cycleIndex, frameTimer, state, idleTimer, targetX, targetY }
```

**Walk bounds:** col 2–21, row 4–14 (avoids walls and furniture)

**Animation:** 6-frame cycle at 150ms/frame; delta-time capped at 100ms/tick

## Sprite Systems

**MetroCity (active):** Single horizontal strip, 384×32px  
Layout: `[DOWN 0–5][RIGHT 6–11][UP 12–17][LEFT 18–23]`  
File: `sprites/MetroCity/CharacterModel/Character Model.png`  
All three NPCs (npc1, npc2, npc3) point to this asset.

**Original placeholders (unused):** `npc-1/2/3.png` — 4×4 grid, rows=direction, cols=frame

**Furniture:** `bookshelf.png` (16×32), `plant.png` (16×24), `wall-art.png` (32×24)

## Key Constants

```js
TILE = 16         // base sprite size (px)
SCALE = 3         // pixel-perfect upscaling
TS = 48           // on-screen tile size (TILE × SCALE)
NPC_SPEED = TS/400 // 1 tile per 400ms
FRAME_INTERVAL = 150 // ms per animation frame
WALK_CYCLE = [0,1,2,3,4,5]
DIR = { DOWN:0, UP:1, LEFT:2, RIGHT:3 }
```

## Color Palette

```js
page:       '#0d0d1a'  // dark charcoal background
floorA:     '#7a4f2e'  // light brown floor
floorB:     '#6b4226'  // dark brown floor
wall:       '#2a1f3d'  // dark purple wall
wallAccent: '#3d2f5a'  // lighter purple baseboard
```

## Testing

- All pure functions exported via `window.GameUtils` for testability without a bundler
- Open `tests/test.html` over HTTP (not `file://`) — 57+ tests, all passing
- `ctx.imageSmoothingEnabled = false` must stay set everywhere sprites are drawn

## Local Dev

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

Sprites require HTTP — `file://` protocol blocks image loading.

## Conventions

- Sections in `game.js` separated by ASCII dividers: `// ── Name ────`
- No comments except where behavior is non-obvious
- No bundler, no transpilation — edit and refresh
- `generate_sprites.py` only needed if regenerating assets from scratch
