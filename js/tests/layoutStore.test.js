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
