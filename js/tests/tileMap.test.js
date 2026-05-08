import { assert, assertEqual } from './run.js';
import { isWalkable, getWalkableTiles, findPath } from '../tileMap.js';
import { TileType } from '../constants.js';

// 3×3 grid: walls on border, floor in center
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
  assert(!isWalkable(1, 1, [[TileType.VOID]], none), 'void tile is not walkable');

  const walkable = getWalkableTiles(map, none);
  assertEqual(walkable, [{ col: 1, row: 1 }], 'only center tile is walkable');

  // 5-tile straight corridor: row=1, cols 1-5 are floor
  const W = TileType.WALL, F = TileType.FLOOR;
  const corridor = [
    [W, W, W, W, W, W, W],
    [W, F, F, F, F, F, W],
    [W, W, W, W, W, W, W],
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
