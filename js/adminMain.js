import { loadCatalog, loadFurnitureSprites, loadAllFloorTiles } from './furnitureLoader.js';
import { loadLayout, saveLayout, resetLayout, buildTileMap, buildBlockedTiles, buildFurnitureInstances } from './layoutStore.js';
import { renderFrame, computeZoom, pixelToTile, computeOffset } from './renderer.js';
import { TileType, TILE_SIZE } from './constants.js';

const ADMIN_PASSWORD = 'iloveemma'; // client-visible by design — PAT is the real credential

const FLOOR_NAME_TO_TYPE = { wooden: TileType.FLOOR, white: TileType.FLOOR_WHITE, gray: TileType.FLOOR_GRAY, gray_nogrid: TileType.FLOOR_GRAY_NOGRID };
function isFloorTile(v) { return v === TileType.FLOOR || v === TileType.FLOOR_WHITE || v === TileType.FLOOR_GRAY || v === TileType.FLOOR_GRAY_NOGRID; }

function migrateLayout(layout) {
  if (!layout.floorTile || layout.floorTile === 'wooden') { delete layout.floorTile; return layout; }
  const newType = FLOOR_NAME_TO_TYPE[layout.floorTile];
  if (newType) layout.tiles = layout.tiles.map(t => t === TileType.FLOOR ? newType : t);
  delete layout.floorTile;
  return layout;
}

// ── State ────────────────────────────────────────────────────

const state = {
  catalog: null,
  furnitureSprites: null,
  layout: null,
  tileMap: null,
  blockedTiles: null,
  furnitureInstances: null,
  zoom: 1,
  activeTool: 'select',
  floorImgs: null,
  activeFloorType: TileType.FLOOR_WHITE,
  activeItemId: 'DESK',
  activeVariantIdx: 0,
  isPainting: false,
  ghostCol: -1,
  ghostRow: -1,
  selectedUid: null,
  needsRender: true,
};

// ── DOM refs ─────────────────────────────────────────────────

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const selToolbar = document.getElementById('selection-toolbar');
const rotateBtn = document.getElementById('rotate-btn-overlay');
const deleteBtn = document.getElementById('delete-btn-overlay');
const variantBtn = document.getElementById('variant-btn');
const variantSection = document.getElementById('variant-section');
const furnitureTypeSelect = document.getElementById('furniture-type');
const floorTileSelect = document.getElementById('floor-tile-select');

// ── Helpers ──────────────────────────────────────────────────

function rebuildLayout() {
  state.tileMap = buildTileMap(state.layout);
  state.blockedTiles = buildBlockedTiles(state.layout.furniture, state.catalog);
  state.furnitureInstances = buildFurnitureInstances(state.layout.furniture, state.catalog, state.furnitureSprites);
  state.needsRender = true;
}

function getOffset() {
  return computeOffset(canvas.width, canvas.height, state.layout.cols, state.layout.rows, state.zoom);
}

function getActiveVariant() {
  const item = state.catalog.find(i => i.id === state.activeItemId);
  return item.variants[state.activeVariantIdx];
}

function canPlaceAt(col, row, variant, itemId = state.activeItemId) {
  const item = state.catalog.find(i => i.id === itemId);
  const category = item ? item.category : 'desks';
  for (let dr = 0; dr < variant.footprintH; dr++) {
    for (let dc = 0; dc < variant.footprintW; dc++) {
      const c = col + dc, r = row + dr;
      if (r < 0 || r >= state.layout.rows || c < 0 || c >= state.layout.cols) return false;
      if (category === 'items') continue;
      const tileVal = state.layout.tiles[r * state.layout.cols + c];
      if (category === 'wall') {
        if (tileVal !== TileType.WALL) return false;
      } else if (category === 'desks') {
        // top row of footprint may back against a wall tile
        if (dr === 0 ? (!isFloorTile(tileVal) && tileVal !== TileType.WALL) : !isFloorTile(tileVal)) return false;
      } else {
        if (!isFloorTile(tileVal)) return false;
      }
      if (state.blockedTiles.has(`${c},${r}`)) return false;
    }
  }
  return true;
}

function canvasToTile(e) {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const { offsetX, offsetY } = getOffset();
  return pixelToTile(px, py, offsetX, offsetY, state.zoom);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function updateSelectionToolbar() {
  if (!state.selectedUid) { selToolbar.style.display = 'none'; return; }
  const f = state.layout.furniture.find(x => x.uid === state.selectedUid);
  if (!f) { selToolbar.style.display = 'none'; return; }
  const item = state.catalog.find(c => c.id === f.type);
  const variant = item.variants.find(v => v.id === f.variantId);
  const { offsetX, offsetY } = getOffset();
  const s = TILE_SIZE * state.zoom;
  const x = offsetX + (f.col + variant.footprintW) * s;
  const y = offsetY + f.row * s;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  selToolbar.style.display = 'flex';
  selToolbar.style.left = `${x * scaleX}px`;
  selToolbar.style.top = `${(y - 28) * scaleY}px`;
}

// ── Render overlays ──────────────────────────────────────────

function renderOverlays() {
  const { offsetX, offsetY } = getOffset();
  const s = TILE_SIZE * state.zoom;

  // Grid
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= state.layout.cols; c++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + c * s + 0.5, offsetY);
    ctx.lineTo(offsetX + c * s + 0.5, offsetY + state.layout.rows * s);
    ctx.stroke();
  }
  for (let r = 0; r <= state.layout.rows; r++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + r * s + 0.5);
    ctx.lineTo(offsetX + state.layout.cols * s, offsetY + r * s + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // Ghost preview
  if (state.activeTool === 'furniture' && state.ghostCol >= 0 && state.ghostRow >= 0) {
    const variant = getActiveVariant();
    const img = state.furnitureSprites[variant.id];
    if (img) {
      const valid = canPlaceAt(state.ghostCol, state.ghostRow, variant);
      const gw = Math.round(variant.w * state.zoom);
      const gh = Math.round(variant.h * state.zoom);
      const ghostOffX = variant.centered ? Math.round((variant.footprintW * TILE_SIZE * state.zoom - gw) / 2) : 0;
      const ghostOffY = variant.centered ? Math.round((variant.footprintH * TILE_SIZE * state.zoom - gh) / 2) : 0;
      const gx = offsetX + state.ghostCol * s + ghostOffX;
      const gy = offsetY + state.ghostRow * s + ghostOffY;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.imageSmoothingEnabled = false;
      if (variant.mirror) {
        ctx.translate(gx + gw, gy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, gw, gh);
      } else {
        ctx.drawImage(img, gx, gy, gw, gh);
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = valid ? '#00ff00' : '#ff0000';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.restore();
    }
  }

  // Selection highlight
  if (state.selectedUid) {
    const f = state.layout.furniture.find(x => x.uid === state.selectedUid);
    if (f) {
      const item = state.catalog.find(c => c.id === f.type);
      const variant = item.variants.find(v => v.id === f.variantId);
      const x = offsetX + f.col * s + 0.5;
      const y = offsetY + f.row * s + 0.5;
      const w = variant.footprintW * s - 1;
      const h = variant.footprintH * s - 1;
      ctx.save();
      ctx.strokeStyle = '#007fd4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }
}

function render() {
  renderFrame(ctx, { cols: state.layout.cols, rows: state.layout.rows, tileMap: state.tileMap }, state.furnitureInstances, null, null, state.zoom, state.floorImgs);
  renderOverlays();
  updateSelectionToolbar();
  state.needsRender = false;
}

// ── RAF render loop ──────────────────────────────────────────

function rafLoop() {
  if (state.needsRender) render();
  requestAnimationFrame(rafLoop);
}

// ── Auth gate ─────────────────────────────────────────────────

function initAuth() {
  const gate = document.getElementById('auth-gate');
  const passwordInput = document.getElementById('auth-password');
  const enterBtn = document.getElementById('auth-enter');
  const authError = document.getElementById('auth-error');
  const authBox = document.getElementById('auth-box');

  let started = false;

  function attempt() {
    if (started) return;
    if (passwordInput.value === ADMIN_PASSWORD) {
      started = true;
      sessionStorage.setItem('admin-authed', '1');
      gate.classList.add('hidden');
      main().catch(err => console.error('Admin failed to start:', err));
    } else {
      authError.hidden = false;
      authBox.classList.remove('shake');
      void authBox.offsetWidth;
      authBox.classList.add('shake');
      passwordInput.value = '';
    }
  }

  if (sessionStorage.getItem('admin-authed') === '1') {
    gate.classList.add('hidden');
    main().catch(err => console.error('Admin failed to start:', err));
    return;
  }

  enterBtn.addEventListener('click', attempt);
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

// ── Tile painting ────────────────────────────────────────────

function paintTile(col, row) {
  if (col < 0 || col >= state.layout.cols || row < 0 || row >= state.layout.rows) return;
  const tileVal = state.activeTool === 'floor' ? state.activeFloorType
    : state.activeTool === 'wall' ? TileType.WALL
    : TileType.VOID;
  state.layout.tiles[row * state.layout.cols + col] = tileVal;
  rebuildLayout();
}

// ── Furniture actions ─────────────────────────────────────────

function placeFurnitureAt(col, row) {
  const variant = getActiveVariant();
  if (!canPlaceAt(col, row, variant)) return;
  state.layout.furniture.push({ uid: uid(), type: state.activeItemId, variantId: variant.id, col, row });
  rebuildLayout();
}

function selectFurnitureAt(col, row) {
  const found = state.layout.furniture.find(f => {
    const item = state.catalog.find(c => c.id === f.type);
    const variant = item.variants.find(v => v.id === f.variantId);
    return col >= f.col && col < f.col + variant.footprintW
        && row >= f.row && row < f.row + variant.footprintH;
  });
  state.selectedUid = found ? found.uid : null;
  state.needsRender = true;
}

function deleteSelected() {
  if (!state.selectedUid) return;
  state.layout.furniture = state.layout.furniture.filter(f => f.uid !== state.selectedUid);
  state.selectedUid = null;
  rebuildLayout();
}

function rotateSelected() {
  if (!state.selectedUid) return;
  const f = state.layout.furniture.find(x => x.uid === state.selectedUid);
  if (!f) return;
  const item = state.catalog.find(c => c.id === f.type);
  const idx = item.variants.findIndex(v => v.id === f.variantId);
  const nextVariant = item.variants[(idx + 1) % item.variants.length];
  // Check if rotated footprint fits (excluding this piece from blocked tiles)
  const othersBlocked = buildBlockedTiles(
    state.layout.furniture.filter(x => x.uid !== f.uid),
    state.catalog
  );
  const prevBlocked = state.blockedTiles;
  state.blockedTiles = othersBlocked;
  const fits = canPlaceAt(f.col, f.row, nextVariant, f.type);
  state.blockedTiles = prevBlocked;
  if (!fits) return;
  f.variantId = nextVariant.id;
  rebuildLayout();
}

// ── Mouse events ──────────────────────────────────────────────

canvas.addEventListener('mousedown', (e) => {
  const { col, row } = canvasToTile(e);
  if (state.activeTool === 'furniture') {
    placeFurnitureAt(col, row);
  } else if (['floor', 'wall', 'void'].includes(state.activeTool)) {
    state.isPainting = true;
    paintTile(col, row);
  } else {
    selectFurnitureAt(col, row);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const { col, row } = canvasToTile(e);
  state.ghostCol = col;
  state.ghostRow = row;
  state.needsRender = true;
  if (state.isPainting) paintTile(col, row);
});

canvas.addEventListener('mouseleave', () => {
  state.isPainting = false;
  state.ghostCol = -1;
  state.ghostRow = -1;
  state.needsRender = true;
});

canvas.addEventListener('mouseup', () => { state.isPainting = false; });
window.addEventListener('mouseup', () => { state.isPainting = false; });

canvas.addEventListener('click', (e) => {
  if (['floor', 'wall', 'void'].includes(state.activeTool)) return;
  if (state.activeTool === 'furniture') return;
  const { col, row } = canvasToTile(e);
  selectFurnitureAt(col, row);
});

// ── Tool buttons ─────────────────────────────────────────────

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeTool = btn.dataset.tool;
    state.selectedUid = null;
    variantSection.hidden = state.activeTool !== 'furniture';
    floorTileSelect.hidden = state.activeTool !== 'floor';
    state.needsRender = true;
  });
});

variantBtn.addEventListener('click', () => {
  const item = state.catalog.find(i => i.id === state.activeItemId);
  state.activeVariantIdx = (state.activeVariantIdx + 1) % item.variants.length;
  variantBtn.textContent = item.variants[state.activeVariantIdx].id;
  state.needsRender = true;
});

furnitureTypeSelect.addEventListener('change', () => {
  state.activeItemId = furnitureTypeSelect.value;
  state.activeVariantIdx = 0;
  const item = state.catalog.find(i => i.id === state.activeItemId);
  variantBtn.textContent = item.variants[0].id;
  variantBtn.hidden = item.variants.length <= 1;
  state.needsRender = true;
});

floorTileSelect.addEventListener('change', () => {
  state.activeFloorType = FLOOR_NAME_TO_TYPE[floorTileSelect.value] ?? TileType.FLOOR;
  state.needsRender = true;
});

deleteBtn.addEventListener('click', deleteSelected);
rotateBtn.addEventListener('click', rotateSelected);

document.getElementById('save-btn').addEventListener('click', () => {
  if (!state.layout) return;
  saveLayout(state.layout);
  const btn = document.getElementById('save-btn');
  btn.textContent = 'Saved ✓';
  setTimeout(() => { btn.textContent = 'Save'; }, 1500);
});

document.getElementById('publish-btn').addEventListener('click', async () => {
  if (!state.layout) return;
  saveLayout(state.layout);
  const json = JSON.stringify(state.layout, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const btn = document.getElementById('publish-btn');
  try {
    if (window.showSaveFilePicker) {
      const fh = await window.showSaveFilePicker({
        suggestedName: 'published-layout.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await fh.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'published-layout.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    btn.textContent = 'Published ✓';
    setTimeout(() => { btn.textContent = 'Publish'; }, 1500);
  } catch (e) {
    if (e.name !== 'AbortError') { btn.textContent = 'Failed'; setTimeout(() => { btn.textContent = 'Publish'; }, 1500); }
  }
});

document.getElementById('reset-btn').addEventListener('click', async () => {
  if (!state.layout) return;
  if (!confirm('Reset layout to default? This clears all edits.')) return;
  resetLayout();
  const res = await fetch('data/default-layout.json');
  state.layout = await res.json();
  state.selectedUid = null;
  rebuildLayout();
});

// ── Init ──────────────────────────────────────────────────────

async function main() {
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = window.innerHeight;

  const [catalog, rawLayout] = await Promise.all([loadCatalog(), loadLayout()]);
  const layout = migrateLayout(rawLayout);
  const [furnitureSprites, floorImgs] = await Promise.all([
    loadFurnitureSprites(catalog),
    loadAllFloorTiles(),
  ]);

  state.catalog = catalog;

  const CATEGORIES = [
    { id: 'desks',  label: 'Desks' },
    { id: 'chairs', label: 'Chairs' },
    { id: 'wall',   label: 'Wall' },
    { id: 'items',  label: 'Items' },
  ];
  for (const cat of CATEGORIES) {
    const group = document.createElement('optgroup');
    group.label = cat.label;
    for (const item of catalog.filter(i => i.category === cat.id)) {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.label;
      group.appendChild(opt);
    }
    furnitureTypeSelect.appendChild(group);
  }

  const initialItem = catalog.find(i => i.id === state.activeItemId);
  variantBtn.textContent = initialItem.variants[0].id;
  variantBtn.hidden = initialItem.variants.length <= 1;
  state.floorImgs = floorImgs;
  state.furnitureSprites = furnitureSprites;
  state.layout = layout;
  state.zoom = computeZoom(canvas.width, canvas.height, layout.cols, layout.rows);

  rebuildLayout();
  requestAnimationFrame(rafLoop);

  window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = window.innerHeight;
    state.zoom = computeZoom(canvas.width, canvas.height, state.layout.cols, state.layout.rows);
    state.needsRender = true;
  });
}

initAuth();
