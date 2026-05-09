const STORAGE_KEY = 'pixel-office-layout';

export async function loadLayout() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through to default */ }
  }
  const published = await fetch('data/published-layout.json');
  if (published.ok) return published.json();
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
    return { ...f, variant, img: sprites[f.variantId] ?? null, isItem: item?.category === 'items' };
  });
}
