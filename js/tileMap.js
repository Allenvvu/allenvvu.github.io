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
