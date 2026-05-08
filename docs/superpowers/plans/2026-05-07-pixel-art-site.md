# Pixel Art Office Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a localhost pixel-art office site with a wandering animated character, plus an admin page for editing the tile layout and placing a desk.

**Architecture:** Plain HTML/CSS/JS with ES modules — no build tools. The scene viewer (`index.html`) runs a `requestAnimationFrame` game loop animating a single character using BFS pathfinding. The admin editor (`admin.html`) uses the same renderer with overlays for tile painting and furniture placement. Layout persists to `localStorage`.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas, `python -m http.server 8000`

---

## File Map

| File | Responsibility |
|------|----------------|
| `js/constants.js` | Enums, timings, colors — no logic |
| `js/tileMap.js` | `isWalkable`, `getWalkableTiles`, `findPath` (BFS) |
| `js/character.js` | `createCharacter`, `updateCharacter`, `getFrameSrcX` |
| `js/furnitureLoader.js` | `loadCatalog`, `loadFurnitureSprites` |
| `js/layoutStore.js` | `loadLayout`, `saveLayout`, `resetLayout`, `buildTileMap`, `buildBlockedTiles`, `buildFurnitureInstances` |
| `js/renderer.js` | `renderFrame`, `computeZoom`, `pixelToTile` |
| `js/gameLoop.js` | `startGameLoop` |
| `js/sceneMain.js` | index.html bootstrap |
| `js/adminMain.js` | admin.html bootstrap + all editor logic |
| `js/tests/run.js` | Test runner helper (`assert`, `runSuite`) |
| `js/tests/tileMap.test.js` | Tests for tileMap.js |
| `js/tests/character.test.js` | Tests for getFrameSrcX, createCharacter |
| `js/tests/layoutStore.test.js` | Tests for buildTileMap, buildBlockedTiles |
| `tests.html` | Loads all test modules, print results to page |
| `index.html` | Scene viewer page |
| `admin.html` | Layout editor page |
| `css/main.css` | Scene viewer styles |
| `css/admin.css` | Admin editor styles |
| `data/catalog.json` | Furniture definitions |
| `data/default-layout.json` | Fallback 20×11 room |
| `assets/furniture/DESK/DESK_FRONT.png` | Downloaded from pixel-agents |
| `assets/furniture/DESK/DESK_SIDE.png` | Downloaded from pixel-agents |

---

## Task 1: Project Setup

**Files:**
- Create: `js/` `css/` `data/` `assets/furniture/DESK/` directories

- [ ] **Step 1: Initialize git and create folder structure**

```bash
cd /Users/jukermacmini/Documents/personal-site-2
git init
mkdir -p js/tests css data assets/furniture/DESK
```

- [ ] **Step 2: Verify structure**

```bash
find . -not -path './.git/*' -not -path './docs/*' | sort
```

Expected output includes: `./assets`, `./assets/furniture/DESK`, `./css`, `./data`, `./js`, `./js/tests`

- [ ] **Step 3: Initial commit**

```bash
git add docs/
git commit -m "chore: add spec and plan docs"
```

---

## Task 2: Download DESK Assets

**Files:**
- Create: `assets/furniture/DESK/DESK_FRONT.png`
- Create: `assets/furniture/DESK/DESK_SIDE.png`
- Create: `assets/furniture/DESK/manifest.json`

- [ ] **Step 1: Download the three DESK files**

```bash
curl -L "https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/furniture/DESK/DESK_FRONT.png" -o assets/furniture/DESK/DESK_FRONT.png
curl -L "https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/furniture/DESK/DESK_SIDE.png" -o assets/furniture/DESK/DESK_SIDE.png
curl -L "https://raw.githubusercontent.com/pablodelucca/pixel-agents/main/webview-ui/public/assets/furniture/DESK/manifest.json" -o assets/furniture/DESK/manifest.json
```

- [ ] **Step 2: Verify sizes match spec**

```bash
python3 -c "
from PIL import Image
front = Image.open('assets/furniture/DESK/DESK_FRONT.png')
side  = Image.open('assets/furniture/DESK/DESK_SIDE.png')
print('DESK_FRONT:', front.size, '(expect (48, 32))')
print('DESK_SIDE: ', side.size,  '(expect (16, 64))')
"
```

Expected:
```
DESK_FRONT: (48, 32) (expect (48, 32))
DESK_SIDE:  (16, 64) (expect (16, 64))
```

If `PIL` is not available, verify file sizes are non-zero:
```bash
ls -la assets/furniture/DESK/
```

- [ ] **Step 3: Commit**

```bash
git add assets/
git commit -m "chore: add DESK furniture assets from pixel-agents"
```

---

## Task 3: Data Files

**Files:**
- Create: `data/catalog.json`
- Create: `data/default-layout.json`

- [ ] **Step 1: Write catalog.json**

```bash
cat > data/catalog.json << 'EOF'
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
EOF
```

- [ ] **Step 2: Write default-layout.json**

A 20×11 room: wall border (tile=0), floor interior (tile=1).

```bash
python3 -c "
import json

cols, rows = 20, 11
tiles = []
for r in range(rows):
    for c in range(cols):
        if r == 0 or r == rows - 1 or c == 0 or c == cols - 1:
            tiles.append(0)  # wall
        else:
            tiles.append(1)  # floor

layout = {
    'version': 1,
    'cols': cols,
    'rows': rows,
    'tiles': tiles,
    'furniture': []
}
print(json.dumps(layout, indent=2))
" > data/default-layout.json
```

- [ ] **Step 3: Verify tile count**

```bash
python3 -c "
import json
with open('data/default-layout.json') as f:
    d = json.load(f)
print('cols:', d['cols'], 'rows:', d['rows'])
print('tile count:', len(d['tiles']), '(expect 220)')
print('wall tiles:', d['tiles'].count(0), '(expect 58)')
print('floor tiles:', d['tiles'].count(1), '(expect 162)')
"
```

Expected:
```
cols: 20 rows: 11
tile count: 220 (expect 220)
wall tiles: 58 (expect 58)
floor tiles: 162 (expect 162)
```

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "chore: add catalog.json and default-layout.json"
```

---

## Task 4: constants.js

**Files:**
- Create: `js/constants.js`

- [ ] **Step 1: Write constants.js**

```bash
cat > js/constants.js << 'EOF'
export const TILE_SIZE = 16;
export const MAX_DELTA_TIME_SEC = 0.1;
export const WALK_SPEED_PX_PER_SEC = 48;
export const WALK_FRAME_DURATION_SEC = 0.15;
export const WANDER_PAUSE_MIN_SEC = 2.0;
export const WANDER_PAUSE_MAX_SEC = 20.0;

export const FLOOR_COLOR = '#808080';
export const WALL_COLOR = '#3A3A5C';

export const TileType = Object.freeze({ WALL: 0, FLOOR: 1, VOID: 255 });
export const CharacterState = Object.freeze({ IDLE: 'idle', WALK: 'walk' });
export const Direction = Object.freeze({ DOWN: 0, RIGHT: 1, UP: 2, LEFT: 3 });

// Pixel x-offset of direction's frame 0 in the 384×32 character strip
export const DIR_SPRITE_OFFSET = Object.freeze({ 0: 0, 1: 96, 2: 192, 3: 288 });
EOF
```

- [ ] **Step 2: Commit**

```bash
git add js/constants.js
git commit -m "feat: add constants.js"
```

---

## Task 5: tileMap.js + Tests

**Files:**
- Create: `js/tileMap.js`
- Create: `js/tests/run.js`
- Create: `js/tests/tileMap.test.js`
- Create: `tests.html`

- [ ] **Step 1: Write tileMap.js**

```bash
cat > js/tileMap.js << 'EOF'
import { TileType } from './constants.js';

export function isWalkable(col, row, tileMap, blockedTiles) {
  if (row < 0 || row >= tileMap.length) return false;
  if (col < 0 || col >= tileMap[0].length) return false;
  const t = tileMap[row][col];
  if (t === TileType.WALL || t === TileType.VOID) return false;
  if (blockedTiles.has(`${col},${row}`)) return false;
  return true;
}

export function getWalkableTiles(tileMap, blockedTiles) {
  const tiles = [];
  for (let r = 0; r < tileMap.length; r++) {
    for (let c = 0; c < tileMap[0].length; c++) {
      if (isWalkable(c, r, tileMap, blockedTiles)) tiles.push({ col: c, row: r });
    }
  }
  return tiles;
}

export function findPath(startCol, startRow, endCol, endRow, tileMap, blockedTiles) {
  if (startCol === endCol && startRow === endRow) return [];

  const key = (c, r) => `${c},${r}`;
  const startKey = key(startCol, startRow);
  const endKey = key(endCol, endRow);

  if (!isWalkable(endCol, endRow, tileMap, blockedTiles)) return [];

  const visited = new Set([startKey]);
  const parent = new Map();
  const queue = [{ col: startCol, row: startRow }];
  const dirs = [{ dc: 0, dr: -1 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }];

  while (queue.length > 0) {
    const curr = queue.shift();
    const currKey = key(curr.col, curr.row);

    if (currKey === endKey) {
      const path = [];
      let k = endKey;
      while (k !== startKey) {
        const [c, r] = k.split(',').map(Number);
        path.unshift({ col: c, row: r });
        k = parent.get(k);
      }
      return path;
    }

    for (const d of dirs) {
      const nc = curr.col + d.dc;
      const nr = curr.row + d.dr;
      const nk = key(nc, nr);
      if (visited.has(nk)) continue;
      if (!isWalkable(nc, nr, tileMap, blockedTiles)) continue;
      visited.add(nk);
      parent.set(nk, currKey);
      queue.push({ col: nc, row: nr });
    }
  }
  return [];
}
EOF
```

- [ ] **Step 2: Write test runner (js/tests/run.js)**

```bash
cat > js/tests/run.js << 'EOF'
const results = [];

export function assert(condition, msg) {
  results.push({ pass: !!condition, msg });
}

export function assertEqual(a, b, msg) {
  const pass = JSON.stringify(a) === JSON.stringify(b);
  results.push({ pass, msg: pass ? msg : `${msg} — got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}` });
}

export function getResults() {
  return results;
}
EOF
```

- [ ] **Step 3: Write tileMap tests (js/tests/tileMap.test.js)**

```bash
cat > js/tests/tileMap.test.js << 'EOF'
import { assert, assertEqual } from './run.js';
import { isWalkable, getWalkableTiles, findPath } from '../tileMap.js';
import { TileType } from '../constants.js';

// 3×3 grid: walls on border, floor in center
//   W W W
//   W F W
//   W W W
const map = [
  [TileType.WALL,  TileType.WALL,  TileType.WALL],
  [TileType.WALL,  TileType.FLOOR, TileType.WALL],
  [TileType.WALL,  TileType.WALL,  TileType.WALL],
];
const none = new Set();

export function runTests() {
  assert(!isWalkable(0, 0, map, none), 'wall tile is not walkable');
  assert(isWalkable(1, 1, map, none), 'floor tile is walkable');
  assert(!isWalkable(-1, 0, map, none), 'out-of-bounds col is not walkable');
  assert(!isWalkable(0, -1, map, none), 'out-of-bounds row is not walkable');
  assert(!isWalkable(1, 1, map, new Set(['1,1'])), 'blocked tile is not walkable');

  const walkable = getWalkableTiles(map, none);
  assertEqual(walkable, [{ col: 1, row: 1 }], 'only center tile is walkable');

  // 5-tile straight corridor: row=1, cols 1-5 are floor
  const corridor = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  const path = findPath(1, 1, 5, 1, corridor, none);
  assertEqual(path, [
    { col: 2, row: 1 },
    { col: 3, row: 1 },
    { col: 4, row: 1 },
    { col: 5, row: 1 },
  ], 'straight path through corridor');

  const emptyPath = findPath(1, 1, 1, 1, corridor, none);
  assertEqual(emptyPath, [], 'same-tile path is empty');

  const noPath = findPath(1, 1, 5, 1, corridor, new Set(['3,1']));
  assertEqual(noPath, [], 'blocked corridor returns empty path');

  const wallTarget = findPath(1, 1, 0, 1, corridor, none);
  assertEqual(wallTarget, [], 'wall target returns empty path');
}
EOF
```

- [ ] **Step 4: Write tests.html**

```bash
cat > tests.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tests</title>
  <style>
    body { font-family: monospace; padding: 1rem; background: #111; color: #eee; }
    .pass { color: #4c4; }
    .fail { color: #f44; font-weight: bold; }
    h2 { color: #aaa; border-bottom: 1px solid #333; }
  </style>
</head>
<body>
  <h1>Test Results</h1>
  <div id="output"></div>
  <script type="module">
    import { getResults } from './js/tests/run.js';
    import { runTests as tileMapTests } from './js/tests/tileMap.test.js';

    tileMapTests();

    const out = document.getElementById('output');
    const results = getResults();
    const passed = results.filter(r => r.pass).length;
    out.innerHTML = `<p>${passed}/${results.length} passed</p>` +
      results.map(r =>
        `<div class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${r.msg}</div>`
      ).join('');
  </script>
</body>
</html>
EOF
```

- [ ] **Step 5: Run tests in browser**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/tests.html`. Expected: all tests show ✓ in green, "8/8 passed" (or similar).

- [ ] **Step 6: Commit**

```bash
git add js/tileMap.js js/tests/ tests.html
git commit -m "feat: add tileMap BFS pathfinding with tests"
```

---

## Task 6: character.js + Tests

**Files:**
- Create: `js/character.js`
- Create: `js/tests/character.test.js`
- Modify: `tests.html`

- [ ] **Step 1: Write character.js**

```bash
cat > js/character.js << 'EOF'
import {
  TILE_SIZE, WALK_SPEED_PX_PER_SEC, WALK_FRAME_DURATION_SEC,
  WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC,
  CharacterState, Direction, DIR_SPRITE_OFFSET,
} from './constants.js';
import { findPath, getWalkableTiles } from './tileMap.js';

export function createCharacter(col, row) {
  return {
    state: CharacterState.IDLE,
    dir: Direction.DOWN,
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
    tileCol: col,
    tileRow: row,
    path: [],
    moveProgress: 0,
    frame: 0,
    frameTimer: 0,
    wanderTimer: randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC),
  };
}

/** Returns the pixel x-offset of the character's current frame in the sprite strip */
export function getFrameSrcX(ch) {
  const frameIndex = ch.state === CharacterState.WALK ? ch.frame : 0;
  return DIR_SPRITE_OFFSET[ch.dir] + frameIndex * 16;
}

export function updateCharacter(ch, dt, tileMap, blockedTiles) {
  ch.frameTimer += dt;

  if (ch.state === CharacterState.IDLE) {
    ch.frame = 0;
    ch.wanderTimer -= dt;
    if (ch.wanderTimer <= 0) {
      const walkable = getWalkableTiles(tileMap, blockedTiles);
      if (walkable.length > 0) {
        const target = walkable[Math.floor(Math.random() * walkable.length)];
        const path = findPath(ch.tileCol, ch.tileRow, target.col, target.row, tileMap, blockedTiles);
        if (path.length > 0) {
          ch.path = path;
          ch.moveProgress = 0;
          ch.state = CharacterState.WALK;
          ch.frame = 0;
          ch.frameTimer = 0;
        }
      }
      ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC);
    }
    return;
  }

  if (ch.state === CharacterState.WALK) {
    if (ch.frameTimer >= WALK_FRAME_DURATION_SEC) {
      ch.frameTimer -= WALK_FRAME_DURATION_SEC;
      ch.frame = (ch.frame + 1) % 6;
    }

    if (ch.path.length === 0) {
      const center = tileCenter(ch.tileCol, ch.tileRow);
      ch.x = center.x;
      ch.y = center.y;
      ch.state = CharacterState.IDLE;
      ch.frame = 0;
      ch.frameTimer = 0;
      ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC);
      return;
    }

    const next = ch.path[0];
    ch.dir = directionBetween(ch.tileCol, ch.tileRow, next.col, next.row);
    ch.moveProgress += (WALK_SPEED_PX_PER_SEC / TILE_SIZE) * dt;

    const from = tileCenter(ch.tileCol, ch.tileRow);
    const to = tileCenter(next.col, next.row);
    const t = Math.min(ch.moveProgress, 1);
    ch.x = from.x + (to.x - from.x) * t;
    ch.y = from.y + (to.y - from.y) * t;

    if (ch.moveProgress >= 1) {
      ch.tileCol = next.col;
      ch.tileRow = next.row;
      ch.x = to.x;
      ch.y = to.y;
      ch.path.shift();
      ch.moveProgress = 0;
    }
  }
}

function tileCenter(col, row) {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

function directionBetween(fc, fr, tc, tr) {
  const dc = tc - fc, dr = tr - fr;
  if (dc > 0) return Direction.RIGHT;
  if (dc < 0) return Direction.LEFT;
  if (dr > 0) return Direction.DOWN;
  return Direction.UP;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
EOF
```

- [ ] **Step 2: Write character tests (js/tests/character.test.js)**

```bash
cat > js/tests/character.test.js << 'EOF'
import { assert, assertEqual } from './run.js';
import { createCharacter, getFrameSrcX } from '../character.js';
import { CharacterState, Direction } from '../constants.js';

export function runTests() {
  const ch = createCharacter(3, 5);
  assertEqual(ch.tileCol, 3, 'createCharacter sets tileCol');
  assertEqual(ch.tileRow, 5, 'createCharacter sets tileRow');
  assertEqual(ch.x, 3 * 16 + 8, 'createCharacter centers x on tile');
  assertEqual(ch.y, 5 * 16 + 8, 'createCharacter centers y on tile');
  assertEqual(ch.state, CharacterState.IDLE, 'createCharacter starts IDLE');
  assertEqual(ch.frame, 0, 'createCharacter starts at frame 0');

  // getFrameSrcX: IDLE always uses frame 0 of direction
  ch.dir = Direction.DOWN;
  ch.state = CharacterState.IDLE;
  ch.frame = 4;
  assertEqual(getFrameSrcX(ch), 0, 'IDLE DOWN always srcX=0 (dir offset 0, frame 0)');

  ch.dir = Direction.RIGHT;
  assertEqual(getFrameSrcX(ch), 96, 'IDLE RIGHT always srcX=96 (dir offset 96, frame 0)');

  ch.dir = Direction.UP;
  assertEqual(getFrameSrcX(ch), 192, 'IDLE UP always srcX=192 (dir offset 192, frame 0)');

  ch.dir = Direction.LEFT;
  assertEqual(getFrameSrcX(ch), 288, 'IDLE LEFT always srcX=288 (dir offset 288, frame 0)');

  // getFrameSrcX: WALK uses current frame
  ch.dir = Direction.DOWN;
  ch.state = CharacterState.WALK;
  ch.frame = 3;
  assertEqual(getFrameSrcX(ch), 0 + 3 * 16, 'WALK DOWN frame 3 srcX=48');

  ch.dir = Direction.RIGHT;
  ch.frame = 5;
  assertEqual(getFrameSrcX(ch), 96 + 5 * 16, 'WALK RIGHT frame 5 srcX=176');
}
EOF
```

- [ ] **Step 3: Add character tests to tests.html**

Edit `tests.html` — replace the `<script type="module">` block with:

```html
  <script type="module">
    import { getResults } from './js/tests/run.js';
    import { runTests as tileMapTests } from './js/tests/tileMap.test.js';
    import { runTests as characterTests } from './js/tests/character.test.js';

    tileMapTests();
    characterTests();

    const out = document.getElementById('output');
    const results = getResults();
    const passed = results.filter(r => r.pass).length;
    out.innerHTML = `<p>${passed}/${results.length} passed</p>` +
      results.map(r =>
        `<div class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${r.msg}</div>`
      ).join('');
  </script>
```

- [ ] **Step 4: Run tests in browser**

Refresh `http://localhost:8000/tests.html`. All tests should show ✓.

- [ ] **Step 5: Commit**

```bash
git add js/character.js js/tests/character.test.js tests.html
git commit -m "feat: add character state machine with tests"
```

---

## Task 7: furnitureLoader.js + layoutStore.js + Tests

**Files:**
- Create: `js/furnitureLoader.js`
- Create: `js/layoutStore.js`
- Create: `js/tests/layoutStore.test.js`
- Modify: `tests.html`

- [ ] **Step 1: Write furnitureLoader.js**

```bash
cat > js/furnitureLoader.js << 'EOF'
export async function loadCatalog() {
  const res = await fetch('data/catalog.json');
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  return res.json();
}

export async function loadFurnitureSprites(catalog) {
  const sprites = {};
  const loads = [];
  for (const item of catalog) {
    for (const variant of item.variants) {
      const img = new Image();
      img.src = variant.file;
      loads.push(new Promise(resolve => {
        img.onload = resolve;
        img.onerror = () => { console.warn(`Failed to load: ${variant.file}`); resolve(); };
      }));
      sprites[variant.id] = img;
    }
  }
  await Promise.all(loads);
  return sprites;
}
EOF
```

- [ ] **Step 2: Write layoutStore.js**

```bash
cat > js/layoutStore.js << 'EOF'
const STORAGE_KEY = 'pixel-office-layout';

export async function loadLayout() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through to default */ }
  }
  const res = await fetch('data/default-layout.json');
  if (!res.ok) throw new Error(`Failed to load default layout: ${res.status}`);
  return res.json();
}

export function saveLayout(layout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function resetLayout() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Convert flat tiles array to 2D tileMap[row][col] */
export function buildTileMap(layout) {
  const { cols, rows, tiles } = layout;
  const tileMap = [];
  for (let r = 0; r < rows; r++) {
    tileMap.push(tiles.slice(r * cols, (r + 1) * cols));
  }
  return tileMap;
}

/** Build Set of "col,row" strings for all tiles occupied by placed furniture */
export function buildBlockedTiles(furniture, catalog) {
  const blocked = new Set();
  for (const f of furniture) {
    const item = catalog.find(c => c.id === f.type);
    if (!item) continue;
    const variant = item.variants.find(v => v.id === f.variantId);
    if (!variant) continue;
    for (let dr = 0; dr < variant.footprintH; dr++) {
      for (let dc = 0; dc < variant.footprintW; dc++) {
        blocked.add(`${f.col + dc},${f.row + dr}`);
      }
    }
  }
  return blocked;
}

/** Combine placed furniture with catalog variant data and loaded sprite images */
export function buildFurnitureInstances(furniture, catalog, sprites) {
  return furniture.map(f => {
    const item = catalog.find(c => c.id === f.type);
    const variant = item ? item.variants.find(v => v.id === f.variantId) : null;
    return { ...f, variant, img: sprites[f.variantId] ?? null };
  });
}
EOF
```

- [ ] **Step 3: Write layoutStore tests (js/tests/layoutStore.test.js)**

```bash
cat > js/tests/layoutStore.test.js << 'EOF'
import { assert, assertEqual } from './run.js';
import { buildTileMap, buildBlockedTiles } from '../layoutStore.js';
import { TileType } from '../constants.js';

export function runTests() {
  // buildTileMap: 2×2 flat → 2D
  const flat = { cols: 2, rows: 2, tiles: [0, 1, 1, 0] };
  const map = buildTileMap(flat);
  assertEqual(map[0], [0, 1], 'buildTileMap row 0');
  assertEqual(map[1], [1, 0], 'buildTileMap row 1');
  assertEqual(map.length, 2, 'buildTileMap has 2 rows');

  // buildBlockedTiles: DESK_FRONT at (2,3) blocks 3×2 tiles
  const catalog = [{
    id: 'DESK',
    label: 'Desk',
    variants: [
      { id: 'DESK_FRONT', file: '', w: 48, h: 32, footprintW: 3, footprintH: 2 },
      { id: 'DESK_SIDE',  file: '', w: 16, h: 64, footprintW: 1, footprintH: 4 },
    ],
  }];
  const furniture = [{ uid: 'x', type: 'DESK', variantId: 'DESK_FRONT', col: 2, row: 3 }];
  const blocked = buildBlockedTiles(furniture, catalog);

  assertEqual(blocked.size, 6, 'DESK_FRONT blocks 3×2=6 tiles');
  assert(blocked.has('2,3'), 'blocks (2,3)');
  assert(blocked.has('3,3'), 'blocks (3,3)');
  assert(blocked.has('4,3'), 'blocks (4,3)');
  assert(blocked.has('2,4'), 'blocks (2,4)');
  assert(blocked.has('3,4'), 'blocks (3,4)');
  assert(blocked.has('4,4'), 'blocks (4,4)');

  // DESK_SIDE at (5,2) blocks 1×4 tiles
  const sideF = [{ uid: 'y', type: 'DESK', variantId: 'DESK_SIDE', col: 5, row: 2 }];
  const sideBlocked = buildBlockedTiles(sideF, catalog);
  assertEqual(sideBlocked.size, 4, 'DESK_SIDE blocks 1×4=4 tiles');
  assert(sideBlocked.has('5,2'), 'blocks (5,2)');
  assert(sideBlocked.has('5,5'), 'blocks (5,5)');
}
EOF
```

- [ ] **Step 4: Add layoutStore tests to tests.html**

Edit `tests.html` — replace the `<script type="module">` block with:

```html
  <script type="module">
    import { getResults } from './js/tests/run.js';
    import { runTests as tileMapTests } from './js/tests/tileMap.test.js';
    import { runTests as characterTests } from './js/tests/character.test.js';
    import { runTests as layoutStoreTests } from './js/tests/layoutStore.test.js';

    tileMapTests();
    characterTests();
    layoutStoreTests();

    const out = document.getElementById('output');
    const results = getResults();
    const passed = results.filter(r => r.pass).length;
    out.innerHTML = `<p>${passed}/${results.length} passed</p>` +
      results.map(r =>
        `<div class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${r.msg}</div>`
      ).join('');
  </script>
```

- [ ] **Step 5: Run tests in browser**

Refresh `http://localhost:8000/tests.html`. All tests should show ✓.

- [ ] **Step 6: Commit**

```bash
git add js/furnitureLoader.js js/layoutStore.js js/tests/layoutStore.test.js tests.html
git commit -m "feat: add furnitureLoader, layoutStore with tests"
```

---

## Task 8: renderer.js

**Files:**
- Create: `js/renderer.js`

- [ ] **Step 1: Write renderer.js**

```bash
cat > js/renderer.js << 'EOF'
import { TILE_SIZE, TileType, FLOOR_COLOR, WALL_COLOR } from './constants.js';
import { getFrameSrcX } from './character.js';

export function computeZoom(canvasWidth, canvasHeight, cols, rows) {
  return Math.max(1, Math.floor(Math.min(canvasWidth / (cols * TILE_SIZE), canvasHeight / (rows * TILE_SIZE))));
}

/** Convert canvas pixel coords to tile col/row */
export function pixelToTile(px, py, offsetX, offsetY, zoom) {
  return {
    col: Math.floor((px - offsetX) / (TILE_SIZE * zoom)),
    row: Math.floor((py - offsetY) / (TILE_SIZE * zoom)),
  };
}

/** Compute top-left pixel offset so the tile map is centered in the canvas */
export function computeOffset(canvasWidth, canvasHeight, cols, rows, zoom) {
  return {
    offsetX: Math.floor((canvasWidth - cols * TILE_SIZE * zoom) / 2),
    offsetY: Math.floor((canvasHeight - rows * TILE_SIZE * zoom) / 2),
  };
}

/**
 * Render a full frame onto ctx.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ cols, rows, tileMap }} layout  tileMap is 2D array
 * @param {Array} furnitureInstances  each has { col, row, variant, img }
 * @param {object|null} character  null to skip character rendering
 * @param {HTMLImageElement|null} charImg
 * @param {number} zoom
 */
export function renderFrame(ctx, layout, furnitureInstances, character, charImg, zoom) {
  const { cols, rows, tileMap } = layout;
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const { offsetX, offsetY } = computeOffset(cw, ch, cols, rows, zoom);
  const s = TILE_SIZE * zoom;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cw, ch);

  // Tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = tileMap[r][c];
      if (tile === TileType.VOID) continue;
      ctx.fillStyle = tile === TileType.WALL ? WALL_COLOR : FLOOR_COLOR;
      ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
    }
  }

  // Z-sorted drawables: furniture then character, sorted by bottom-edge Y
  const drawables = [];

  for (const f of furnitureInstances) {
    if (!f.img || !f.variant) continue;
    const fx = offsetX + f.col * s;
    const fy = offsetY + f.row * s;
    const fw = Math.round(f.variant.w * zoom);
    const fh = Math.round(f.variant.h * zoom);
    const fimg = f.img;
    drawables.push({
      zY: (f.row + f.variant.footprintH) * TILE_SIZE,
      draw: (c) => { c.imageSmoothingEnabled = false; c.drawImage(fimg, fx, fy, fw, fh); },
    });
  }

  if (character && charImg) {
    const srcX = getFrameSrcX(character);
    const drawX = Math.round(offsetX + character.x * zoom - (16 * zoom) / 2);
    const drawY = Math.round(offsetY + character.y * zoom - 32 * zoom);
    const charZY = character.y + TILE_SIZE / 2 + 0.5; // +0.5 so char sorts in front of same-row furniture
    const cimg = charImg;
    const czoom = zoom;
    const csrcX = srcX;
    drawables.push({
      zY: charZY,
      draw: (c) => { c.imageSmoothingEnabled = false; c.drawImage(cimg, csrcX, 0, 16, 32, drawX, drawY, 16 * czoom, 32 * czoom); },
    });
  }

  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) d.draw(ctx);
}
EOF
```

- [ ] **Step 2: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add canvas renderer with z-sorting"
```

---

## Task 9: gameLoop.js

**Files:**
- Create: `js/gameLoop.js`

- [ ] **Step 1: Write gameLoop.js**

```bash
cat > js/gameLoop.js << 'EOF'
import { MAX_DELTA_TIME_SEC } from './constants.js';

/**
 * Start a requestAnimationFrame loop.
 * @param {HTMLCanvasElement} canvas
 * @param {{ update: (dt: number) => void, render: (ctx: CanvasRenderingContext2D) => void }} callbacks
 * @returns {() => void} stop function
 */
export function startGameLoop(canvas, callbacks) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let lastTime = 0;
  let rafId = 0;
  let stopped = false;

  const frame = (time) => {
    if (stopped) return;
    const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, MAX_DELTA_TIME_SEC);
    lastTime = time;
    callbacks.update(dt);
    ctx.imageSmoothingEnabled = false;
    callbacks.render(ctx);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(rafId); };
}
EOF
```

- [ ] **Step 2: Commit**

```bash
git add js/gameLoop.js
git commit -m "feat: add requestAnimationFrame game loop"
```

---

## Task 10: Scene Viewer — index.html, sceneMain.js, main.css

**Files:**
- Create: `css/main.css`
- Create: `js/sceneMain.js`
- Create: `index.html`

- [ ] **Step 1: Write main.css**

```bash
cat > css/main.css << 'EOF'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #1a1a2e;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

#scene {
  display: block;
  width: 100vw;
  height: 100vh;
}

#admin-link {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  color: rgba(255,255,255,0.4);
  font-family: monospace;
  font-size: 0.75rem;
  text-decoration: none;
  letter-spacing: 0.05em;
}

#admin-link:hover { color: rgba(255,255,255,0.8); }
EOF
```

- [ ] **Step 2: Write sceneMain.js**

```bash
cat > js/sceneMain.js << 'EOF'
import { loadCatalog, loadFurnitureSprites } from './furnitureLoader.js';
import { loadLayout, buildTileMap, buildBlockedTiles, buildFurnitureInstances } from './layoutStore.js';
import { createCharacter, updateCharacter } from './character.js';
import { renderFrame, computeZoom } from './renderer.js';
import { startGameLoop } from './gameLoop.js';
import { getWalkableTiles } from './tileMap.js';

async function main() {
  const canvas = document.getElementById('scene');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const [catalog, layout] = await Promise.all([loadCatalog(), loadLayout()]);

  const charImg = new Image();
  charImg.src = 'assets/Character Model.png';
  await new Promise(r => { charImg.onload = r; charImg.onerror = r; });

  const furnitureSprites = await loadFurnitureSprites(catalog);

  const tileMap = buildTileMap(layout);
  const blockedTiles = buildBlockedTiles(layout.furniture, catalog);
  const furnitureInstances = buildFurnitureInstances(layout.furniture, catalog, furnitureSprites);

  const zoom = computeZoom(canvas.width, canvas.height, layout.cols, layout.rows);

  const walkable = getWalkableTiles(tileMap, blockedTiles);
  const start = walkable.length > 0
    ? walkable[Math.floor(Math.random() * walkable.length)]
    : { col: 1, row: 1 };
  const character = createCharacter(start.col, start.row);

  startGameLoop(canvas, {
    update: (dt) => updateCharacter(character, dt, tileMap, blockedTiles),
    render: (ctx) => renderFrame(ctx, { cols: layout.cols, rows: layout.rows, tileMap }, furnitureInstances, character, charImg, zoom),
  });

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

main().catch(err => { console.error('Scene failed to start:', err); });
EOF
```

- [ ] **Step 3: Write index.html**

```bash
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel Office</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <canvas id="scene"></canvas>
  <a id="admin-link" href="admin.html">admin →</a>
  <script type="module" src="js/sceneMain.js"></script>
</body>
</html>
EOF
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8000`. Expected:
- Dark background fills the window
- Pixel art office room (gray floor tiles, dark walls) centered on screen
- A single character sprite visible and walking around autonomously
- "admin →" link in the bottom-right corner

- [ ] **Step 5: Commit**

```bash
git add index.html css/main.css js/sceneMain.js
git commit -m "feat: scene viewer with animated wandering character"
```

---

## Task 11: Admin Editor — admin.html, adminMain.js, admin.css

**Files:**
- Create: `css/admin.css`
- Create: `js/adminMain.js`
- Create: `admin.html`

- [ ] **Step 1: Write admin.css**

```bash
cat > css/admin.css << 'EOF'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #1a1a2e;
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: monospace;
  color: #eee;
}

#canvas-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}

#scene {
  display: block;
  width: 100%;
  height: 100%;
}

#sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #12122a;
  border-left: 1px solid #2a2a4a;
  display: flex;
  flex-direction: column;
  padding: 1rem 0.75rem;
  gap: 0.5rem;
  overflow-y: auto;
}

#sidebar h2 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 0.25rem; }

.tool-btn {
  width: 100%;
  padding: 0.4rem 0.5rem;
  background: #1e1e3a;
  border: 1px solid #2a2a4a;
  color: #aaa;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.8rem;
  text-align: left;
  border-radius: 3px;
}

.tool-btn:hover { background: #2a2a4a; color: #eee; }
.tool-btn.active { background: #007fd4; border-color: #007fd4; color: #fff; }

#variant-btn {
  width: 100%;
  padding: 0.35rem 0.5rem;
  background: #1e1e3a;
  border: 1px solid #2a2a4a;
  color: #aaa;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.75rem;
  text-align: left;
  border-radius: 3px;
}
#variant-btn:hover { background: #2a2a4a; color: #eee; }

.sep { border: none; border-top: 1px solid #2a2a4a; margin: 0.25rem 0; }

.action-btn {
  width: 100%;
  padding: 0.4rem 0.5rem;
  background: #1e1e3a;
  border: 1px solid #2a2a4a;
  color: #aaa;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.8rem;
  border-radius: 3px;
}
.action-btn:hover { background: #2a2a4a; color: #eee; }
#save-btn { border-color: #007fd4; color: #007fd4; }
#save-btn:hover { background: #007fd4; color: #fff; }

#scene-link {
  display: block;
  color: rgba(255,255,255,0.35);
  font-size: 0.75rem;
  text-decoration: none;
  text-align: center;
  margin-top: auto;
  padding-top: 0.5rem;
}
#scene-link:hover { color: rgba(255,255,255,0.7); }

#selection-toolbar {
  position: absolute;
  display: none;
  gap: 0.25rem;
  pointer-events: auto;
}
#selection-toolbar button {
  padding: 0.2rem 0.4rem;
  font-family: monospace;
  font-size: 0.75rem;
  cursor: pointer;
  border: 1px solid #444;
  border-radius: 3px;
}
#rotate-btn-overlay { background: rgba(50,120,200,0.9); color: #fff; border-color: #007fd4; }
#delete-btn-overlay { background: rgba(200,50,50,0.9); color: #fff; border-color: #c00; }
EOF
```

- [ ] **Step 2: Write adminMain.js**

```bash
cat > js/adminMain.js << 'EOF'
import { loadCatalog, loadFurnitureSprites } from './furnitureLoader.js';
import { loadLayout, saveLayout, resetLayout, buildTileMap, buildBlockedTiles, buildFurnitureInstances } from './layoutStore.js';
import { renderFrame, computeZoom, pixelToTile, computeOffset } from './renderer.js';
import { TileType, TILE_SIZE } from './constants.js';

// ── State ────────────────────────────────────────────────────

const state = {
  catalog: null,
  furnitureSprites: null,
  layout: null,        // mutable layout object
  tileMap: null,       // rebuilt when layout changes
  blockedTiles: null,
  furnitureInstances: null,
  zoom: 1,
  activeTool: 'floor', // 'floor' | 'wall' | 'void' | 'desk'
  activeVariantIdx: 0,
  isPainting: false,
  ghostCol: -1,
  ghostRow: -1,
  selectedUid: null,
  needsRender: true,
};

// ── DOM refs ─────────────────────────────────────────────────

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const selToolbar = document.getElementById('selection-toolbar');
const rotateBtn = document.getElementById('rotate-btn-overlay');
const deleteBtn = document.getElementById('delete-btn-overlay');
const variantBtn = document.getElementById('variant-btn');
const variantSection = document.getElementById('variant-section');

// ── Helpers ──────────────────────────────────────────────────

function rebuildLayout() {
  state.tileMap = buildTileMap(state.layout);
  state.blockedTiles = buildBlockedTiles(state.layout.furniture, state.catalog);
  state.furnitureInstances = buildFurnitureInstances(state.layout.furniture, state.catalog, state.furnitureSprites);
  state.needsRender = true;
}

function getOffset() {
  return computeOffset(canvas.width, canvas.height, state.layout.cols, state.layout.rows, state.zoom);
}

function getActiveVariant() {
  const desk = state.catalog[0];
  return desk.variants[state.activeVariantIdx];
}

function canPlaceAt(col, row, variant) {
  for (let dr = 0; dr < variant.footprintH; dr++) {
    for (let dc = 0; dc < variant.footprintW; dc++) {
      const c = col + dc, r = row + dr;
      if (r < 0 || r >= state.layout.rows || c < 0 || c >= state.layout.cols) return false;
      if (state.layout.tiles[r * state.layout.cols + c] !== TileType.FLOOR) return false;
      if (state.blockedTiles.has(`${c},${r}`)) return false;
    }
  }
  return true;
}

function canvasToTile(e) {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  return pixelToTile(px, py, getOffset().offsetX, getOffset().offsetY, state.zoom);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function updateSelectionToolbar() {
  if (!state.selectedUid) { selToolbar.style.display = 'none'; return; }
  const f = state.layout.furniture.find(x => x.uid === state.selectedUid);
  if (!f) { selToolbar.style.display = 'none'; return; }
  const item = state.catalog.find(c => c.id === f.type);
  const variant = item.variants.find(v => v.id === f.variantId);
  const { offsetX, offsetY } = getOffset();
  const s = TILE_SIZE * state.zoom;
  const x = offsetX + (f.col + variant.footprintW) * s;
  const y = offsetY + f.row * s;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  selToolbar.style.display = 'flex';
  selToolbar.style.left = `${x * scaleX}px`;
  selToolbar.style.top = `${(y - 28) * scaleY}px`;
}

// ── Render overlays ──────────────────────────────────────────

function renderOverlays() {
  const { offsetX, offsetY } = getOffset();
  const s = TILE_SIZE * state.zoom;

  // Grid
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= state.layout.cols; c++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + c * s + 0.5, offsetY);
    ctx.lineTo(offsetX + c * s + 0.5, offsetY + state.layout.rows * s);
    ctx.stroke();
  }
  for (let r = 0; r <= state.layout.rows; r++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + r * s + 0.5);
    ctx.lineTo(offsetX + state.layout.cols * s, offsetY + r * s + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // Ghost preview
  if (state.activeTool === 'desk' && state.ghostCol >= 0 && state.ghostRow >= 0) {
    const variant = getActiveVariant();
    const img = state.furnitureSprites[variant.id];
    if (img) {
      const valid = canPlaceAt(state.ghostCol, state.ghostRow, variant);
      const gx = offsetX + state.ghostCol * s;
      const gy = offsetY + state.ghostRow * s;
      const gw = Math.round(variant.w * state.zoom);
      const gh = Math.round(variant.h * state.zoom);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, gx, gy, gw, gh);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = valid ? '#00ff00' : '#ff0000';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.restore();
    }
  }

  // Selection highlight
  if (state.selectedUid) {
    const f = state.layout.furniture.find(x => x.uid === state.selectedUid);
    if (f) {
      const item = state.catalog.find(c => c.id === f.type);
      const variant = item.variants.find(v => v.id === f.variantId);
      const x = offsetX + f.col * s + 0.5;
      const y = offsetY + f.row * s + 0.5;
      const w = variant.footprintW * s - 1;
      const h = variant.footprintH * s - 1;
      ctx.save();
      ctx.strokeStyle = '#007fd4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }
}

function render() {
  renderFrame(ctx, { cols: state.layout.cols, rows: state.layout.rows, tileMap: state.tileMap }, state.furnitureInstances, null, null, state.zoom);
  renderOverlays();
  updateSelectionToolbar();
  state.needsRender = false;
}

// ── RAF render loop ──────────────────────────────────────────

function rafLoop() {
  if (state.needsRender) render();
  requestAnimationFrame(rafLoop);
}

// ── Tile painting ────────────────────────────────────────────

function paintTile(col, row) {
  if (col < 0 || col >= state.layout.cols || row < 0 || row >= state.layout.rows) return;
  const tileVal = state.activeTool === 'floor' ? TileType.FLOOR
    : state.activeTool === 'wall' ? TileType.WALL
    : TileType.VOID;
  state.layout.tiles[row * state.layout.cols + col] = tileVal;
  rebuildLayout();
}

// ── Furniture actions ─────────────────────────────────────────

function placeDeskAt(col, row) {
  const variant = getActiveVariant();
  if (!canPlaceAt(col, row, variant)) return;
  state.layout.furniture.push({ uid: uid(), type: 'DESK', variantId: variant.id, col, row });
  rebuildLayout();
}

function selectFurnitureAt(col, row) {
  const found = state.layout.furniture.find(f => {
    const item = state.catalog.find(c => c.id === f.type);
    const variant = item.variants.find(v => v.id === f.variantId);
    return col >= f.col && col < f.col + variant.footprintW
        && row >= f.row && row < f.row + variant.footprintH;
  });
  state.selectedUid = found ? found.uid : null;
  state.needsRender = true;
}

function deleteSelected() {
  if (!state.selectedUid) return;
  state.layout.furniture = state.layout.furniture.filter(f => f.uid !== state.selectedUid);
  state.selectedUid = null;
  rebuildLayout();
}

function rotateSelected() {
  if (!state.selectedUid) return;
  const f = state.layout.furniture.find(x => x.uid === state.selectedUid);
  if (!f) return;
  const item = state.catalog.find(c => c.id === f.type);
  const idx = item.variants.findIndex(v => v.id === f.variantId);
  f.variantId = item.variants[(idx + 1) % item.variants.length].id;
  rebuildLayout();
}

// ── Mouse events ──────────────────────────────────────────────

canvas.addEventListener('mousedown', (e) => {
  const { col, row } = canvasToTile(e);
  if (state.activeTool === 'desk') {
    placeDeskAt(col, row);
  } else if (['floor', 'wall', 'void'].includes(state.activeTool)) {
    state.isPainting = true;
    paintTile(col, row);
  } else {
    selectFurnitureAt(col, row);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const { col, row } = canvasToTile(e);
  state.ghostCol = col;
  state.ghostRow = row;
  state.needsRender = true;
  if (state.isPainting) paintTile(col, row);
});

canvas.addEventListener('mouseleave', () => {
  state.ghostCol = -1;
  state.ghostRow = -1;
  state.needsRender = true;
});

canvas.addEventListener('mouseup', () => { state.isPainting = false; });

canvas.addEventListener('click', (e) => {
  if (['floor', 'wall', 'void'].includes(state.activeTool)) return;
  if (state.activeTool === 'desk') return;
  const { col, row } = canvasToTile(e);
  selectFurnitureAt(col, row);
});

// ── Tool buttons ─────────────────────────────────────────────

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeTool = btn.dataset.tool;
    state.selectedUid = null;
    variantSection.hidden = state.activeTool !== 'desk';
    state.needsRender = true;
  });
});

variantBtn.addEventListener('click', () => {
  const desk = state.catalog[0];
  state.activeVariantIdx = (state.activeVariantIdx + 1) % desk.variants.length;
  variantBtn.textContent = desk.variants[state.activeVariantIdx].id;
  state.needsRender = true;
});

deleteBtn.addEventListener('click', deleteSelected);
rotateBtn.addEventListener('click', rotateSelected);

document.getElementById('save-btn').addEventListener('click', () => {
  saveLayout(state.layout);
  const btn = document.getElementById('save-btn');
  btn.textContent = 'Saved ✓';
  setTimeout(() => { btn.textContent = 'Save'; }, 1500);
});

document.getElementById('reset-btn').addEventListener('click', async () => {
  if (!confirm('Reset layout to default? This clears all edits.')) return;
  resetLayout();
  const res = await fetch('data/default-layout.json');
  state.layout = await res.json();
  state.selectedUid = null;
  rebuildLayout();
});

// ── Init ──────────────────────────────────────────────────────

async function main() {
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = window.innerHeight;

  const [catalog, layout] = await Promise.all([loadCatalog(), loadLayout()]);
  const furnitureSprites = await loadFurnitureSprites(catalog);

  state.catalog = catalog;
  state.furnitureSprites = furnitureSprites;
  state.layout = layout;
  state.zoom = computeZoom(canvas.width, canvas.height, layout.cols, layout.rows);

  rebuildLayout();
  requestAnimationFrame(rafLoop);

  window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = window.innerHeight;
    state.zoom = computeZoom(canvas.width, canvas.height, state.layout.cols, state.layout.rows);
    state.needsRender = true;
  });
}

main().catch(err => { console.error('Admin failed to start:', err); });
EOF
```

- [ ] **Step 3: Write admin.html**

```bash
cat > admin.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel Office — Admin</title>
  <link rel="stylesheet" href="css/admin.css">
</head>
<body>
  <div id="canvas-wrap">
    <canvas id="scene"></canvas>
    <div id="selection-toolbar">
      <button id="rotate-btn-overlay">↻</button>
      <button id="delete-btn-overlay">✕</button>
    </div>
  </div>

  <div id="sidebar">
    <h2>Tiles</h2>
    <button class="tool-btn active" data-tool="floor">Floor</button>
    <button class="tool-btn" data-tool="wall">Wall</button>
    <button class="tool-btn" data-tool="void">Void</button>

    <hr class="sep">
    <h2>Furniture</h2>
    <button class="tool-btn" data-tool="desk">Desk</button>

    <div id="variant-section" hidden>
      <button id="variant-btn">DESK_FRONT</button>
    </div>

    <hr class="sep">
    <button class="action-btn" id="save-btn">Save</button>
    <button class="action-btn" id="reset-btn">Reset</button>
    <a id="scene-link" href="index.html">← View Scene</a>
  </div>

  <script type="module" src="js/adminMain.js"></script>
</body>
</html>
EOF
```

- [ ] **Step 4: Verify admin editor in browser**

Open `http://localhost:8000/admin.html`. Verify:
- Office layout renders in the left canvas area with a visible grid overlay
- **Floor / Wall / Void** buttons paint tiles when clicked or dragged
- **Desk** button shows a ghost preview on hover; green = valid, red = invalid; click places it
- Variant button cycles between DESK_FRONT and DESK_SIDE
- Clicking a placed desk selects it (dashed blue outline + ↻/✕ toolbar appears)
- ↻ rotates the desk, ✕ deletes it
- Save writes to localStorage; navigating to `index.html` shows the saved layout
- Reset restores the default empty room

- [ ] **Step 5: Commit**

```bash
git add admin.html css/admin.css js/adminMain.js
git commit -m "feat: admin layout editor with tile painting and desk placement"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|-----------------|------|
| `index.html` scene viewer with full-screen canvas | Task 10 |
| `admin.html` editor with canvas + sidebar | Task 11 |
| Character sprite strip, direction offsets | Tasks 4, 6 |
| Walk frames 0–5, idle holds frame 0 | Task 6 |
| Autonomous BFS wander loop | Tasks 5, 6 |
| Z-sort furniture + character by Y | Task 8 |
| `computeZoom` fills window | Tasks 8, 10 |
| Tile paint (Floor/Wall/Void) + drag | Task 11 |
| Desk ghost preview (green/red) | Task 11 |
| Desk variant rotate in sidebar | Task 11 |
| Select furniture → dashed highlight + buttons | Task 11 |
| Delete and rotate placed furniture | Task 11 |
| Save to localStorage / reset to default | Tasks 7, 11 |
| `catalog.json` + `default-layout.json` | Task 3 |
| DESK assets downloaded | Task 2 |

All spec requirements are covered. ✓
