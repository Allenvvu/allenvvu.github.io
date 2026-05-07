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
