// game.js

const TILE  = 16;
const SCALE = 3;
const TS    = TILE * SCALE;  // 48px on screen

// Room dimensions from layout.js (loaded before this script)
const ROOM_COLS = LAYOUT.cols;
const ROOM_ROWS = LAYOUT.rows;
const WALL_ROWS = LAYOUT.wallRows;

// ── Utilities ─────────────────────────────────────────────────────────────────

function tileToPixel(tileCol, tileRow, roomX, roomY) {
  return {
    x: roomX + tileCol * TS,
    y: roomY + tileRow * TS,
  };
}

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

// ── Canvas setup ──────────────────────────────────────────────────────────────

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let roomX = 0, roomY = 0;

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
  const off = roomOffset(canvas.width, canvas.height);
  roomX = off.x;
  roomY = off.y;
}

window.addEventListener('resize', resize);
resize();

// ── Colors (wall fallback + page bg) ──────────────────────────────────────────

const COLORS = {
  page:       '#0d0d1a',
  wall:       '#2a1f3d',
  wallAccent: '#3d2f5a',
};

// ── Room renderer ─────────────────────────────────────────────────────────────

function drawRoom() {
  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor — tile-based (floor_0.png), falls back to flat color if not loaded
  const floorImg = sprites['__floor__'];
  for (let row = WALL_ROWS; row < ROOM_ROWS; row++) {
    for (let col = 0; col < ROOM_COLS; col++) {
      if (floorImg) {
        ctx.drawImage(floorImg, 0, 0, TILE, TILE,
          roomX + col * TS, roomY + row * TS, TS, TS);
      } else {
        ctx.fillStyle = (col + row) % 2 === 0 ? '#7a4f2e' : '#6b4226';
        ctx.fillRect(roomX + col * TS, roomY + row * TS, TS, TS);
      }
    }
  }

  // Wall strip — flat-color fallback until wall bitmask art is ready
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(roomX, roomY, ROOM_COLS * TS, WALL_ROWS * TS);

  // Baseboard accent
  ctx.fillStyle = COLORS.wallAccent;
  ctx.fillRect(roomX, roomY + WALL_ROWS * TS - 3, ROOM_COLS * TS, 3);
}

// ── Furniture renderer ────────────────────────────────────────────────────────

function drawFurniture() {
  // Attach sort metric and catalog entry for each layout item
  const items = LAYOUT.furniture
    .map(f => {
      const meta = CATALOG[f.type];
      if (!meta) return null;
      return { ...f, meta, sortY: f.row + meta.fh };
    })
    .filter(Boolean);

  // Back-to-front (ascending sortY)
  items.sort((a, b) => a.sortY - b.sortY);

  for (const f of items) {
    const img = sprites[f.uid];
    if (!img) continue;

    const x = roomX + f.col * TS;
    const y = roomY + f.row * TS;
    ctx.drawImage(img, 0, 0, f.meta.w, f.meta.h,
      x, y, f.meta.w * SCALE, f.meta.h * SCALE);
  }
}

// ── NPC system ────────────────────────────────────────────────────────────────

const NPC_MIN_COL = 2;
const NPC_MAX_COL = ROOM_COLS - 3;
const NPC_MIN_ROW = WALL_ROWS + 1;
const NPC_MAX_ROW = ROOM_ROWS - 2;

const STATE = { IDLE: 'idle', WALKING: 'walking' };

const DIR = { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3 };

// MetroCity: 6-frame walk cycle
const WALK_CYCLE = [0, 1, 2, 3, 4, 5];

// MetroCity sprite sheet: single horizontal strip, 4 dirs × 6 frames
const MC_FRAME_W = 32;  // 16px char + 16px padding
const MC_FRAME_H = 33;

// Maps game direction to MetroCity column group (DOWN=0, RIGHT=1, UP=2, LEFT=3)
function getMetroCityDirIndex(dir) {
  const map = { [DIR.DOWN]: 0, [DIR.RIGHT]: 1, [DIR.UP]: 2, [DIR.LEFT]: 3 };
  return map[dir] ?? 0;
}

function calcMetroCitySourceX(frame, metroDir) {
  return (metroDir * 6 + frame) * MC_FRAME_W;
}

function calcMetroCitySourceY() {
  return 0;
}

function createNPC(spriteKey, startCol, startRow) {
  return {
    spriteKey,
    x: startCol * TS,
    y: startRow * TS,
    dir: DIR.DOWN,
    cycleIndex: 0,
    frame: 0,
    frameTimer: 0,
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
  createNPC, sortByY, clampNPCPos,
  WALK_CYCLE, STATE, DIR,
  NPC_MIN_COL, NPC_MAX_COL, NPC_MIN_ROW, NPC_MAX_ROW,
  MC_FRAME_W, MC_FRAME_H,
  getMetroCityDirIndex, calcMetroCitySourceX, calcMetroCitySourceY,
});

const NPC_SPEED      = TS / 400;
const FRAME_INTERVAL = 150;

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
    npc.frame      = 0;
    npc.frameTimer = 0;
    npc.idleTimer -= dt;
    if (npc.idleTimer <= 0) pickTarget(npc);
    return;
  }

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

// ── NPC instances ─────────────────────────────────────────────────────────────

const NPCS = [
  createNPC('char_main', Math.floor(ROOM_COLS / 2), NPC_MIN_ROW + 3),
];

// ── NPC renderer ─────────────────────────────────────────────────────────────

function drawNPCs() {
  for (const npc of sortByY(NPCS)) {
    const img = sprites[npc.spriteKey];
    if (!img) continue;

    const metroDir = getMetroCityDirIndex(npc.dir);
    const sx = calcMetroCitySourceX(npc.frame, metroDir);
    const sy = calcMetroCitySourceY();
    ctx.drawImage(
      img,
      sx, sy, MC_FRAME_W, MC_FRAME_H,
      roomX + npc.x, roomY + npc.y, TS * 2, TS * 2
    );
  }
}

// ── Sprite loader ─────────────────────────────────────────────────────────────

// Floor and character sprite paths
const SPRITE_PATHS = {
  '__floor__':  'assets/floor_0.png',
  'char_main':  'assets/characters/Character Model.png',
};

// Auto-generate furniture paths from catalog
for (const [uid, item] of Object.entries(LAYOUT.furniture
    ? Object.fromEntries(LAYOUT.furniture.map(f => [f.uid, f])) : {})) {
  const meta = CATALOG[item.type];
  if (meta) SPRITE_PATHS[uid] = meta.file;
}

const sprites = {};

function loadSprites() {
  return Promise.all(
    Object.entries(SPRITE_PATHS).map(([key, src]) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload  = () => { sprites[key] = img; resolve(); };
        img.onerror = () => { console.warn('Missing sprite:', src); resolve(); };
        img.src = src;
      })
    )
  );
}

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

// ── Game loop ─────────────────────────────────────────────────────────────────

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100);
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
