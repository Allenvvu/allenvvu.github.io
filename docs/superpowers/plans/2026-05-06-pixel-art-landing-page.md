# Pixel Art Portfolio Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-viewport HTML5 Canvas pixel art landing page with a cozy studio scene and 3 ambient wandering NPCs, deployable to GitHub Pages with zero dependencies.

**Architecture:** `index.html` holds the canvas and a CSS name overlay. `game.js` owns all rendering and NPC logic — it draws the floor/walls via Canvas API, loads PNG sprites for furniture and characters, runs 3 independent NPC state machines (IDLE → WALK → IDLE), Y-sorts NPCs each frame for depth, and drives everything with `requestAnimationFrame`. Testable pure functions are exposed on `window.GameUtils` and tested in `tests/test.html`.

**Tech Stack:** Vanilla HTML5, CSS3, Canvas 2D API. No npm, no build step, no framework.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Canvas element, name/title CSS overlay, loads `game.js` |
| `game.js` | Constants, coordinate helpers, renderer, sprite loader, NPC system, game loop |
| `tests/test.html` | In-browser unit tests for all pure logic functions |
| `sprites/npc-{1,2,3}.png` | Character sprite sheets — already generated |
| `sprites/bookshelf.png` | Wall bookshelf — already generated |
| `sprites/plant.png` | Potted plant — already generated |
| `sprites/wall-art.png` | Framed painting — already generated |
| `.nojekyll` | Disables Jekyll on GitHub Pages |

---

### Task 1: Scaffold — index.html

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Allen — Portfolio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d0d1a; overflow: hidden; }
    canvas { display: block; }
    #overlay {
      position: fixed;
      bottom: 48px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      pointer-events: none;
      font-family: 'Courier New', monospace;
    }
    #overlay .name {
      display: inline-block;
      background: rgba(0,0,0,0.65);
      border: 1px solid rgba(255,255,255,0.15);
      color: #ffffff;
      font-size: 18px;
      letter-spacing: 4px;
      padding: 6px 20px;
      text-transform: uppercase;
    }
    #overlay .title {
      display: block;
      background: rgba(0,0,0,0.5);
      color: rgba(255,255,255,0.6);
      font-size: 11px;
      letter-spacing: 2px;
      padding: 3px 12px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <div id="overlay">
    <div class="name">Allen</div>
    <span class="title">Developer &amp; Designer</span>
  </div>
  <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open index.html in browser (file://)**

Expected: dark `#0d0d1a` background, no canvas yet (blank), "ALLEN / DEVELOPER & DESIGNER" text centered near the bottom. No console errors (game.js missing is expected here — add an empty `game.js` to suppress it).

```bash
touch game.js
```

- [ ] **Step 3: Commit**

```bash
git add index.html game.js
git commit -m "feat: scaffold index.html with canvas and name overlay"
```

---

### Task 2: Constants, coordinate helpers, and unit tests

**Files:**
- Modify: `game.js`
- Create: `tests/test.html`

- [ ] **Step 1: Write game.js constants and coordinate helpers**

Replace the empty `game.js` with:

```javascript
// game.js

const TILE = 16;         // base tile size in pixels
const SCALE = 3;         // render scale (pixel-perfect 3×)
const TS = TILE * SCALE; // on-screen tile size = 48px

const ROOM_COLS = 24;
const ROOM_ROWS = 16;
const WALL_ROWS = 3;     // top rows reserved for wall

// Returns the pixel top-left of a tile within the room's local space
function tileToPixel(tileCol, tileRow, roomX, roomY) {
  return {
    x: roomX + tileCol * TS,
    y: roomY + tileRow * TS,
  };
}

// Returns the canvas offset to center the room
function roomOffset(canvasW, canvasH) {
  return {
    x: Math.floor((canvasW - ROOM_COLS * TS) / 2),
    y: Math.floor((canvasH - ROOM_ROWS * TS) / 2),
  };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

window.GameUtils = { tileToPixel, roomOffset, clamp, TILE, SCALE, TS, ROOM_COLS, ROOM_ROWS, WALL_ROWS };
```

- [ ] **Step 2: Create tests/test.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unit Tests</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #111; color: #eee; }
    .pass { color: #2ecc71; } .fail { color: #e74c3c; }
    h2 { color: #7eb8f7; margin: 16px 0 8px; }
    #summary { margin-top: 16px; font-weight: bold; font-size: 14px; }
  </style>
</head>
<body>
<h1>Unit Tests</h1>
<div id="results"></div>
<div id="summary"></div>
<script src="../game.js"></script>
<script>
const out = document.getElementById('results');
let passed = 0, failed = 0;

function assert(desc, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  const el = document.createElement('div');
  el.className = ok ? 'pass' : 'fail';
  el.textContent = (ok ? '✓ ' : '✗ ') + desc +
    (ok ? '' : '  — got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  out.appendChild(el);
  ok ? passed++ : failed++;
}

const G = window.GameUtils;

// ── tileToPixel ──────────────────────────────────────────────────────────────
assert('tileToPixel(0,0) at room origin',
  G.tileToPixel(0, 0, 10, 20), { x: 10, y: 20 });
assert('tileToPixel col offset',
  G.tileToPixel(1, 0, 0, 0), { x: G.TS, y: 0 });
assert('tileToPixel row offset',
  G.tileToPixel(0, 1, 0, 0), { x: 0, y: G.TS });
assert('tileToPixel combined',
  G.tileToPixel(2, 3, 5, 10), { x: 5 + 2 * G.TS, y: 10 + 3 * G.TS });

// ── roomOffset ───────────────────────────────────────────────────────────────
assert('roomOffset centers room',
  G.roomOffset(G.ROOM_COLS * G.TS + 100, G.ROOM_ROWS * G.TS + 60), { x: 50, y: 30 });
assert('roomOffset exact fit',
  G.roomOffset(G.ROOM_COLS * G.TS, G.ROOM_ROWS * G.TS), { x: 0, y: 0 });

// ── clamp ────────────────────────────────────────────────────────────────────
assert('clamp mid', G.clamp(5, 0, 10), 5);
assert('clamp below min', G.clamp(-3, 0, 10), 0);
assert('clamp above max', G.clamp(15, 0, 10), 10);
assert('clamp at min boundary', G.clamp(0, 0, 10), 0);
assert('clamp at max boundary', G.clamp(10, 0, 10), 10);

document.getElementById('summary').textContent =
  passed + ' passed, ' + failed + ' failed';
document.getElementById('summary').style.color = failed === 0 ? '#2ecc71' : '#e74c3c';
</script>
</body>
</html>
```

- [ ] **Step 3: Open tests/test.html in browser**

Expected output: `11 passed, 0 failed` (all green).

- [ ] **Step 4: Commit**

```bash
git add game.js tests/test.html
git commit -m "feat: coordinate helpers and unit test harness"
```

---

### Task 3: Canvas setup, resize, and floor/wall renderer

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Append canvas setup and drawRoom() to game.js**

```javascript
// ── Canvas setup ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let roomX = 0, roomY = 0;

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false; // reapply after resize clears it
  const off = roomOffset(canvas.width, canvas.height);
  roomX = off.x;
  roomY = off.y;
}

window.addEventListener('resize', resize);
resize();

// ── Colors ───────────────────────────────────────────────────────────────────

const COLORS = {
  page:       '#0d0d1a',
  floorA:     '#7a4f2e',
  floorB:     '#6b4226',
  wall:       '#2a1f3d',
  wallAccent: '#3d2f5a',
};

// ── Room renderer ─────────────────────────────────────────────────────────────

function drawRoom() {
  // Page background
  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor tiles (rows WALL_ROWS to ROOM_ROWS-1)
  for (let row = WALL_ROWS; row < ROOM_ROWS; row++) {
    for (let col = 0; col < ROOM_COLS; col++) {
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(roomX + col * TS, roomY + row * TS, TS, TS);
    }
  }

  // Wall strip
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(roomX, roomY, ROOM_COLS * TS, WALL_ROWS * TS);

  // Baseboard accent line at bottom of wall
  ctx.fillStyle = COLORS.wallAccent;
  ctx.fillRect(roomX, roomY + WALL_ROWS * TS - 3, ROOM_COLS * TS, 3);
}

// Temporary bootstrap — replaced in Task 9
drawRoom();
```

- [ ] **Step 2: Open index.html in browser (file:// is fine for this task)**

Expected: centered room with dark purple wall strip (top 3 tile rows) and alternating brown wooden floor tiles. Name overlay visible at bottom. Resizing the window should re-center the room.

- [ ] **Step 3: Commit**

```bash
git add game.js
git commit -m "feat: canvas setup, resize handler, floor and wall renderer"
```

---

### Task 4: Sprite loader

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add sprite paths and loadSprites() to game.js** (before the `drawRoom()` temporary bootstrap line)

```javascript
// ── Sprite loader ─────────────────────────────────────────────────────────────

const SPRITE_PATHS = {
  npc1:      'sprites/npc-1.png',
  npc2:      'sprites/npc-2.png',
  npc3:      'sprites/npc-3.png',
  bookshelf: 'sprites/bookshelf.png',
  plant:     'sprites/plant.png',
  wallArt:   'sprites/wall-art.png',
};

const sprites = {};

function loadSprites() {
  const entries = Object.entries(SPRITE_PATHS);
  return Promise.all(
    entries.map(([key, src]) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => { sprites[key] = img; resolve(); };
        img.onerror = () => reject(new Error('Failed to load sprite: ' + src));
        img.src = src;
      })
    )
  );
}
```

- [ ] **Step 2: Replace the temporary `drawRoom()` call with loadSprites bootstrap**

Remove the line `drawRoom();` at the bottom of `game.js` and replace with:

```javascript
loadSprites()
  .then(() => drawRoom())
  .catch(err => console.error(err));
```

- [ ] **Step 3: Verify via local server (sprites require HTTP, not file://)**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Room should look identical to Task 3. Open browser DevTools → Network tab and confirm all 6 sprite PNGs return 200 OK. Zero console errors.

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: promise-based sprite loader"
```

---

### Task 5: Furniture rendering

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add FURNITURE layout and drawFurniture() to game.js** (after the sprite loader block, before the bootstrap)

```javascript
// ── Furniture ─────────────────────────────────────────────────────────────────

// Each entry: { key, tileCol, tileRow, w, h }
// w/h are base pixel dimensions of the PNG (drawn at SCALE×)
const FURNITURE = [
  { key: 'bookshelf', tileCol: 1,                  tileRow: WALL_ROWS,      w: 16, h: 32 },
  { key: 'plant',     tileCol: ROOM_COLS - 2,       tileRow: ROOM_ROWS - 2,  w: 16, h: 24 },
  { key: 'wallArt',   tileCol: Math.floor(ROOM_COLS / 2) - 1, tileRow: 1,   w: 32, h: 24 },
];

function drawFurniture() {
  // Sort back-to-front (lower tileRow = further back)
  const sorted = [...FURNITURE].sort((a, b) => a.tileRow - b.tileRow);
  for (const f of sorted) {
    if (!sprites[f.key]) continue;
    ctx.drawImage(
      sprites[f.key],
      0, 0, f.w, f.h,
      roomX + f.tileCol * TS,
      roomY + f.tileRow * TS,
      f.w * SCALE,
      f.h * SCALE
    );
  }
}
```

- [ ] **Step 2: Update bootstrap to call drawFurniture()**

```javascript
loadSprites()
  .then(() => { drawRoom(); drawFurniture(); })
  .catch(err => console.error(err));
```

- [ ] **Step 3: Verify at http://localhost:8080**

Expected:
- Colorful bookshelf against the left wall
- Plant in the bottom-right corner
- Framed landscape painting centered on the purple wall strip

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: render furniture sprites at fixed room positions"
```

---

### Task 6: NPC data model, Y-sort, and bounds helpers

**Files:**
- Modify: `game.js`
- Modify: `tests/test.html`

- [ ] **Step 1: Add NPC constants and helper functions to game.js** (after FURNITURE, before the bootstrap)

```javascript
// ── NPC system ────────────────────────────────────────────────────────────────

// Walkable bounds (tile coords, inclusive)
const NPC_MIN_COL = 2;
const NPC_MAX_COL = ROOM_COLS - 3;
const NPC_MIN_ROW = WALL_ROWS + 1;
const NPC_MAX_ROW = ROOM_ROWS - 2;

const STATE = { IDLE: 'idle', WALKING: 'walking' };

// Sprite sheet row per direction
const DIR = { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3 };

// Walk animation: 4-step cycle 0→1→2→1 using a cycleIndex (0–3)
const WALK_CYCLE = [0, 1, 2, 1];

function createNPC(spriteKey, startCol, startRow) {
  return {
    spriteKey,
    x: startCol * TS,    // pixel X within room (local space)
    y: startRow * TS,    // pixel Y within room (local space)
    dir: DIR.DOWN,
    cycleIndex: 0,       // index into WALK_CYCLE
    frame: 0,            // current sprite sheet column = WALK_CYCLE[cycleIndex]
    frameTimer: 0,       // ms since last frame advance
    state: STATE.IDLE,
    idleTimer: Math.random() * 1500 + 500,
    targetX: startCol * TS,
    targetY: startRow * TS,
  };
}

function sortByY(npcs) {
  return [...npcs].sort((a, b) => a.y - b.y);
}

function clampNPCPos(px, py) {
  return {
    x: clamp(px, NPC_MIN_COL * TS, NPC_MAX_COL * TS),
    y: clamp(py, NPC_MIN_ROW * TS, NPC_MAX_ROW * TS),
  };
}

window.GameUtils = Object.assign(window.GameUtils, {
  createNPC, sortByY, clampNPCPos, WALK_CYCLE,
  STATE, DIR, NPC_MIN_COL, NPC_MAX_COL, NPC_MIN_ROW, NPC_MAX_ROW,
});
```

- [ ] **Step 2: Add NPC helper tests to tests/test.html** (inside the `<script>` block, before the summary lines)

```javascript
const G2 = window.GameUtils;

// ── createNPC ────────────────────────────────────────────────────────────────
const npc = G2.createNPC('npc1', 5, 6);
assert('createNPC x from tileCol',   npc.x,     5 * G2.TS);
assert('createNPC y from tileRow',   npc.y,     6 * G2.TS);
assert('createNPC state is IDLE',    npc.state, G2.STATE.IDLE);
assert('createNPC dir is DOWN',      npc.dir,   G2.DIR.DOWN);
assert('createNPC frame starts at 0', npc.frame, 0);
assert('createNPC cycleIndex starts at 0', npc.cycleIndex, 0);

// ── sortByY ──────────────────────────────────────────────────────────────────
const na = { y: 100 }, nb = { y: 50 }, nc = { y: 200 };
assert('sortByY ascending order',
  G2.sortByY([na, nb, nc]).map(n => n.y), [50, 100, 200]);
assert('sortByY does not mutate input', [na, nb, nc][0].y, 100);

// ── clampNPCPos ───────────────────────────────────────────────────────────────
assert('clampNPCPos mid unchanged',
  G2.clampNPCPos(10 * G2.TS, 8 * G2.TS), { x: 10 * G2.TS, y: 8 * G2.TS });
assert('clampNPCPos clamps left',
  G2.clampNPCPos(0, 8 * G2.TS), { x: G2.NPC_MIN_COL * G2.TS, y: 8 * G2.TS });
assert('clampNPCPos clamps right',
  G2.clampNPCPos(9999, 8 * G2.TS), { x: G2.NPC_MAX_COL * G2.TS, y: 8 * G2.TS });
assert('clampNPCPos clamps top',
  G2.clampNPCPos(10 * G2.TS, 0), { x: 10 * G2.TS, y: G2.NPC_MIN_ROW * G2.TS });
assert('clampNPCPos clamps bottom',
  G2.clampNPCPos(10 * G2.TS, 9999), { x: 10 * G2.TS, y: G2.NPC_MAX_ROW * G2.TS });

// ── WALK_CYCLE ────────────────────────────────────────────────────────────────
assert('WALK_CYCLE has 4 steps',   G2.WALK_CYCLE.length, 4);
assert('WALK_CYCLE step 0 is 0',   G2.WALK_CYCLE[0], 0);
assert('WALK_CYCLE step 1 is 1',   G2.WALK_CYCLE[1], 1);
assert('WALK_CYCLE step 2 is 2',   G2.WALK_CYCLE[2], 2);
assert('WALK_CYCLE step 3 is 1',   G2.WALK_CYCLE[3], 1);
```

- [ ] **Step 3: Open tests/test.html — verify all tests pass**

Expected: all green, 0 failed. Count should now be 11 (Task 2) + 16 (new) = 27 passed.

- [ ] **Step 4: Commit**

```bash
git add game.js tests/test.html
git commit -m "feat: NPC data model, Y-sort, and bounds helpers with tests"
```

---

### Task 7: NPC state machine — IDLE/WALK transitions

**Files:**
- Modify: `game.js`
- Modify: `tests/test.html`

- [ ] **Step 1: Add NPC_SPEED, FRAME_INTERVAL, pickTarget(), and updateNPC() to game.js** (after createNPC/sortByY/clampNPCPos, before the bootstrap)

```javascript
const NPC_SPEED     = TS / 400;  // pixels per millisecond (1 tile per 400ms)
const FRAME_INTERVAL = 150;       // ms per animation frame advance

function pickTarget(npc) {
  const col = Math.floor(Math.random() * (NPC_MAX_COL - NPC_MIN_COL + 1)) + NPC_MIN_COL;
  const row = Math.floor(Math.random() * (NPC_MAX_ROW - NPC_MIN_ROW + 1)) + NPC_MIN_ROW;
  npc.targetX = col * TS;
  npc.targetY = row * TS;

  const dx = npc.targetX - npc.x;
  const dy = npc.targetY - npc.y;
  npc.dir = (Math.abs(dx) >= Math.abs(dy))
    ? (dx >= 0 ? DIR.RIGHT : DIR.LEFT)
    : (dy >= 0 ? DIR.DOWN  : DIR.UP);

  npc.state = STATE.WALKING;
}

function updateNPC(npc, dt) {
  if (npc.state === STATE.IDLE) {
    npc.idleTimer -= dt;
    npc.frame      = 0;
    npc.frameTimer = 0;
    if (npc.idleTimer <= 0) pickTarget(npc);
    return;
  }

  // WALKING
  const dx   = npc.targetX - npc.x;
  const dy   = npc.targetY - npc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = NPC_SPEED * dt;

  if (dist <= step) {
    npc.x          = npc.targetX;
    npc.y          = npc.targetY;
    npc.state      = STATE.IDLE;
    npc.idleTimer  = Math.random() * 1500 + 500;
    npc.frame      = 0;
    npc.cycleIndex = 0;
  } else {
    npc.x += (dx / dist) * step;
    npc.y += (dy / dist) * step;

    npc.frameTimer += dt;
    if (npc.frameTimer >= FRAME_INTERVAL) {
      npc.frameTimer -= FRAME_INTERVAL;
      npc.cycleIndex  = (npc.cycleIndex + 1) % WALK_CYCLE.length;
      npc.frame       = WALK_CYCLE[npc.cycleIndex];
    }
  }
}

window.GameUtils = Object.assign(window.GameUtils, {
  updateNPC, pickTarget, NPC_SPEED, FRAME_INTERVAL,
});
```

- [ ] **Step 2: Add updateNPC tests to tests/test.html** (before the summary lines)

```javascript
const { updateNPC, STATE: ST, DIR: DR, NPC_SPEED: SPD, TS: TS3, WALK_CYCLE: WC } = window.GameUtils;

// IDLE: timer counts down
const npcA = window.GameUtils.createNPC('npc1', 5, 6);
npcA.idleTimer = 100;
window.GameUtils.updateNPC(npcA, 50);
assert('IDLE timer decrements',         npcA.idleTimer, 50);
assert('IDLE stays IDLE at 50ms',       npcA.state,     ST.IDLE);
assert('IDLE holds frame 0',            npcA.frame,     0);

// IDLE: transitions to WALKING when timer expires
window.GameUtils.updateNPC(npcA, 60); // total 110ms > 100ms threshold
assert('IDLE transitions to WALKING',   npcA.state, ST.WALKING);

// WALKING: NPC moves toward target
const npcB = window.GameUtils.createNPC('npc1', 5, 5);
npcB.targetX = (5 + 4) * TS3;
npcB.targetY = 5 * TS3;
npcB.dir   = DR.RIGHT;
npcB.state = ST.WALKING;
const xBefore = npcB.x;
window.GameUtils.updateNPC(npcB, 100);
assert('WALKING moves right',           npcB.x > xBefore, true);
assert('WALKING Y unchanged horizontally', npcB.y, 5 * TS3);

// WALKING: arrives and transitions to IDLE
const npcC = window.GameUtils.createNPC('npc1', 5, 5);
npcC.targetX = 5 * TS3 + 1;
npcC.targetY = 5 * TS3;
npcC.state = ST.WALKING;
window.GameUtils.updateNPC(npcC, 400);
assert('WALKING snaps to target',       npcC.x,     5 * TS3 + 1);
assert('WALKING transitions to IDLE',   npcC.state, ST.IDLE);
assert('WALKING resets frame on arrive', npcC.frame, 0);

// WALKING: frame animation advances
const npcD = window.GameUtils.createNPC('npc1', 5, 5);
npcD.targetX = (5 + 10) * TS3;
npcD.targetY = 5 * TS3;
npcD.state = ST.WALKING;
npcD.frameTimer = 140; // 10ms from advancing
window.GameUtils.updateNPC(npcD, 20); // pushes frameTimer to 160 > 150
assert('Frame advances after FRAME_INTERVAL', npcD.cycleIndex, 1);
assert('Frame value matches WALK_CYCLE[1]',   npcD.frame, WC[1]);
```

- [ ] **Step 3: Open tests/test.html — all tests pass**

Expected: all green, 0 failed.

- [ ] **Step 4: Commit**

```bash
git add game.js tests/test.html
git commit -m "feat: NPC state machine (IDLE/WALKING) with tests"
```

---

### Task 8: NPC sprite rendering

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add NPC instances and drawNPCs() to game.js** (after updateNPC, before the bootstrap)

```javascript
// ── NPC instances ─────────────────────────────────────────────────────────────

const NPCS = [
  createNPC('npc1', 8,  NPC_MIN_ROW + 1),
  createNPC('npc2', 14, NPC_MIN_ROW + 3),
  createNPC('npc3', 19, NPC_MIN_ROW + 5),
];

// ── NPC renderer ─────────────────────────────────────────────────────────────

function drawNPCs() {
  for (const npc of sortByY(NPCS)) {
    const img = sprites[npc.spriteKey];
    if (!img) continue;
    ctx.drawImage(
      img,
      npc.frame * TILE, npc.dir * TILE, TILE, TILE,  // source rect in sprite sheet
      roomX + npc.x,    roomY + npc.y,  TS,   TS     // dest rect on canvas
    );
  }
}
```

- [ ] **Step 2: Update bootstrap to also call drawNPCs()**

```javascript
loadSprites()
  .then(() => { drawRoom(); drawFurniture(); drawNPCs(); })
  .catch(err => console.error(err));
```

- [ ] **Step 3: Verify at http://localhost:8080**

Expected: 3 NPC sprites visible in the room at their starting positions (static — not yet animating). Each should show a distinct character (blue shirt, red hoodie, teal shirt).

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: render NPC sprites from sprite sheet frame/direction"
```

---

### Task 9: Full game loop, NPC animation, and vignette

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add drawVignette() to game.js** (after drawNPCs, before the bootstrap)

```javascript
// ── Vignette ──────────────────────────────────────────────────────────────────

function drawVignette() {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  const r  = Math.max(canvas.width, canvas.height) * 0.75;
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

- [ ] **Step 2: Replace the bootstrap block with the full game loop**

Remove the entire `loadSprites().then(...)` block and replace with:

```javascript
// ── Game loop ─────────────────────────────────────────────────────────────────

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100); // cap at 100ms (tab unfocus protection)
  lastTime = timestamp;

  for (const npc of NPCS) updateNPC(npc, dt);

  drawRoom();
  drawFurniture();
  drawNPCs();
  drawVignette();

  requestAnimationFrame(gameLoop);
}

loadSprites()
  .then(() => requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); }))
  .catch(err => console.error(err));
```

- [ ] **Step 3: Open http://localhost:8080 and watch the full scene**

Verify:
- Floor tiles, wall, furniture all visible
- 3 NPCs wander independently — idle briefly then walk to random tiles
- Vignette darkens the edges, brightens the center
- Name overlay readable at bottom
- Let run for 20 seconds: all 3 NPCs should change direction at least once
- Resize the window: room should re-center smoothly

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: game loop, NPC animation, and vignette — scene complete"
```

---

### Task 10: Deploy to GitHub Pages

**Files:**
- Create: `.nojekyll`

- [ ] **Step 1: Create .nojekyll**

```bash
touch .nojekyll
```

- [ ] **Step 2: Final local verification**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Confirm:
- Zero console errors
- All 3 NPCs animating
- Sprites load (check Network tab in DevTools — all PNGs 200 OK)

- [ ] **Step 3: Commit everything and push**

```bash
git add .nojekyll sprites/ generate_sprites.py tests/
git commit -m "feat: add deployment config and generated sprite assets"
git push origin main
```

- [ ] **Step 4: Enable GitHub Pages**

In GitHub: go to your repo → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save.

Wait ~60 seconds. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## Self-Review Checklist

- [x] Full-viewport canvas centered in browser ← Task 3
- [x] Wooden floor tiles drawn in code ← Task 3
- [x] Wall strip drawn in code ← Task 3
- [x] PNG sprites for furniture ← Tasks 4–5
- [x] PNG sprites for 3 NPC characters ← Tasks 4, 8
- [x] 3 ambient NPCs with independent state machines ← Tasks 6–9
- [x] Y-sort depth rendering ← Task 6
- [x] Frame animation ping-pong (0→1→2→1) via cycleIndex ← Task 7
- [x] Vignette overlay ← Task 9
- [x] Name/title CSS overlay ← Task 1
- [x] Window resize handling ← Task 3
- [x] dt capped at 100ms to prevent teleport on tab refocus ← Task 9
- [x] GitHub Pages deployment ← Task 10
- [x] Zero npm dependencies ← throughout
