import { assert, assertEqual } from './run.js';
import { buildTileMap, buildBlockedTiles, buildFurnitureInstances, updateFurnitureAnimations } from '../layoutStore.js';

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
  assert(sideBlocked.has('5,3'), 'blocks (5,3)');
  assert(sideBlocked.has('5,4'), 'blocks (5,4)');
  assert(sideBlocked.has('5,5'), 'blocks (5,5)');

  // buildFurnitureInstances: happy path
  const sprites = { DESK_FRONT: 'img-front-stub' };
  const instances = buildFurnitureInstances(furniture, catalog, sprites);
  assertEqual(instances.length, 1, 'buildFurnitureInstances returns one instance');
  assertEqual(instances[0].col, 2, 'instance col preserved');
  assertEqual(instances[0].variantId, 'DESK_FRONT', 'instance variantId preserved');
  assert(instances[0].variant !== null, 'instance has variant');
  assertEqual(instances[0].variant.footprintW, 3, 'instance variant footprintW is 3');
  assertEqual(instances[0].img, 'img-front-stub', 'instance img is from sprites');

  // buildFurnitureInstances: unknown catalog item → variant and img are null
  const unknownFurniture = [{ uid: 'z', type: 'UNKNOWN', variantId: 'X', col: 0, row: 0 }];
  const unknownInstances = buildFurnitureInstances(unknownFurniture, catalog, sprites);
  assertEqual(unknownInstances.length, 1, 'unknown furniture still included in result');
  assert(unknownInstances[0].variant === null, 'unknown furniture has null variant');
  assert(unknownInstances[0].img === null, 'unknown furniture has null img');

  // buildFurnitureInstances: mirror:true on variant flows through to instance
  const mirrorCatalog = [{
    id: 'SOFA',
    label: 'Sofa',
    variants: [
      { id: 'SOFA_FRONT',       file: '', w: 32, h: 16, footprintW: 2, footprintH: 1 },
      { id: 'SOFA_SIDE',        file: '', w: 16, h: 32, footprintW: 1, footprintH: 2 },
      { id: 'SOFA_BACK',        file: '', w: 32, h: 16, footprintW: 2, footprintH: 1 },
      { id: 'SOFA_SIDE_MIRROR', file: '', w: 16, h: 32, footprintW: 1, footprintH: 2, mirror: true },
    ],
  }];
  const mirrorFurniture = [{ uid: 'm1', type: 'SOFA', variantId: 'SOFA_SIDE_MIRROR', col: 0, row: 0 }];
  const mirrorInstances = buildFurnitureInstances(mirrorFurniture, mirrorCatalog, {});
  assert(mirrorInstances[0].variant.mirror === true, 'mirror variant: variant.mirror is true');

  // buildBlockedTiles: single-tile item (BIN, footprint 1×1) blocks exactly 1 tile
  const binCatalog = [{
    id: 'BIN', label: 'Bin',
    variants: [{ id: 'BIN', file: '', w: 16, h: 16, footprintW: 1, footprintH: 1 }],
  }];
  const binFurniture = [{ uid: 'b1', type: 'BIN', variantId: 'BIN', col: 3, row: 7 }];
  const binBlocked = buildBlockedTiles(binFurniture, binCatalog);
  assertEqual(binBlocked.size, 1, 'BIN blocks exactly 1 tile');
  assert(binBlocked.has('3,7'), 'BIN blocks (3,7)');

  // buildFurnitureInstances: animated variant gets frameIndex/frameTimer
  const animCatalog = [{
    id: 'CAT', label: 'Cat',
    variants: [{ id: 'CAT', file: '', w: 32, h: 32, footprintW: 2, footprintH: 2, frames: 21, frameW: 315, frameDuration: 0.1 }],
  }];
  const animFurniture = [{ uid: 'c1', type: 'CAT', variantId: 'CAT', col: 4, row: 4 }];
  const animInstances = buildFurnitureInstances(animFurniture, animCatalog, {});
  assertEqual(animInstances[0].frameIndex, 0, 'animated instance starts at frameIndex 0');
  assertEqual(animInstances[0].frameTimer, 0, 'animated instance starts at frameTimer 0');

  // buildFurnitureInstances: static variant does NOT get frameIndex/frameTimer
  const staticCatalog = [{
    id: 'BIN2', label: 'Bin2',
    variants: [{ id: 'BIN2', file: '', w: 16, h: 16, footprintW: 1, footprintH: 1 }],
  }];
  const staticFurniture = [{ uid: 's1', type: 'BIN2', variantId: 'BIN2', col: 0, row: 0 }];
  const staticInstances = buildFurnitureInstances(staticFurniture, staticCatalog, {});
  assert(staticInstances[0].frameIndex === undefined, 'static instance has no frameIndex');
  assert(staticInstances[0].frameTimer === undefined, 'static instance has no frameTimer');

  // updateFurnitureAnimations: advances frameIndex after frameDuration elapses
  const tickInst = { variant: { frames: 3, frameDuration: 0.1 }, frameIndex: 0, frameTimer: 0 };
  updateFurnitureAnimations([tickInst], 0.15);
  assertEqual(tickInst.frameIndex, 1, 'frameIndex advances to 1 after 0.15s (duration 0.1)');

  // updateFurnitureAnimations: wraps back to 0 after last frame
  const wrapInst = { variant: { frames: 3, frameDuration: 0.1 }, frameIndex: 2, frameTimer: 0 };
  updateFurnitureAnimations([wrapInst], 0.15);
  assertEqual(wrapInst.frameIndex, 0, 'frameIndex wraps from 2 back to 0');

  // updateFurnitureAnimations: skips non-animated instances (no variant.frames)
  const staticInst = { variant: { frames: 1 }, frameIndex: undefined, frameTimer: undefined };
  updateFurnitureAnimations([staticInst], 1.0);
  assert(staticInst.frameIndex === undefined, 'non-animated instance untouched');
}
