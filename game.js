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

loadSprites()
  .then(() => { drawRoom(); drawFurniture(); })
  .catch(err => console.error(err));
