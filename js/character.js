import {
  TILE_SIZE, WALK_SPEED_PX_PER_SEC, WALK_FRAME_DURATION_SEC,
  WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC,
  CharacterState, Direction, DIR_SPRITE_OFFSET, CHAR_FRAME_STRIDE,
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
  return DIR_SPRITE_OFFSET[ch.dir] + frameIndex * CHAR_FRAME_STRIDE;
}

export function updateCharacter(ch, dt, tileMap, blockedTiles) {
  ch.frameTimer += dt;

  if (ch.state === CharacterState.IDLE) {
    ch.frameTimer = 0;
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
