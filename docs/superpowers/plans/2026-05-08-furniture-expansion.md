# Furniture Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 24 new furniture types to the pixel-office site (25 total including DESK), making them placeable via a `<select>` dropdown in the admin editor.

**Architecture:** Expand `data/catalog.json` with all new items using the existing flat variant schema. Add a 6-line canvas flip to `renderer.js` for `mirror: true` variants. Generalize `adminMain.js`/`admin.html` to drive placement from a `state.activeItemId` + `<select>` instead of the hardcoded `catalog[0]`/DESK reference.

**Tech Stack:** Vanilla JS ES modules, HTML5 Canvas, no build tools. Run with `python -m http.server 8000`, open `http://localhost:8000`.

---

### Task 1: Add regression tests for mirror-variant passthrough

These tests guard that `buildFurnitureInstances` passes `mirror: true` through from variant data (important because later tasks rely on this flowing into the renderer). They will pass immediately — they're regression guards, not TDD for new logic.

**Files:**
- Modify: `js/tests/layoutStore.test.js`
- Modify: `tests.html`

- [ ] **Step 1: Add two test cases to the bottom of `js/tests/layoutStore.test.js`**

Append inside the `runTests()` function, after the existing "unknown furniture" test:

```js
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
```

- [ ] **Step 2: Open `http://localhost:8000/tests.html` and verify all tests pass**

Expected: all existing tests pass plus the two new ones. If any existing test fails, stop and fix before continuing.

- [ ] **Step 3: Commit**

```bash
git add js/tests/layoutStore.test.js
git commit -m "test: mirror-variant passthrough and single-tile footprint regression tests"
```

---

### Task 2: Expand `data/catalog.json` with all 25 items

Replace the entire file. DESK stays unchanged at index 0. All 24 new items are appended in alphabetical order.

**Files:**
- Modify: `data/catalog.json`

- [ ] **Step 1: Replace `data/catalog.json` with the following complete content**

```json
[
  {
    "id": "DESK",
    "label": "Desk",
    "variants": [
      { "id": "DESK_FRONT", "file": "assets/furniture/DESK/DESK_FRONT.png", "w": 48, "h": 32, "footprintW": 3, "footprintH": 2 },
      { "id": "DESK_SIDE",  "file": "assets/furniture/DESK/DESK_SIDE.png",  "w": 16, "h": 64, "footprintW": 1, "footprintH": 4 }
    ]
  },
  {
    "id": "BIN",
    "label": "Bin",
    "variants": [
      { "id": "BIN", "file": "assets/furniture/BIN/BIN.png", "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 }
    ]
  },
  {
    "id": "BOOKSHELF",
    "label": "Bookshelf",
    "variants": [
      { "id": "BOOKSHELF", "file": "assets/furniture/BOOKSHELF/BOOKSHELF.png", "w": 32, "h": 16, "footprintW": 2, "footprintH": 1 }
    ]
  },
  {
    "id": "CACTUS",
    "label": "Cactus",
    "variants": [
      { "id": "CACTUS", "file": "assets/furniture/CACTUS/CACTUS.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "CLOCK",
    "label": "Clock",
    "variants": [
      { "id": "CLOCK", "file": "assets/furniture/CLOCK/CLOCK.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "COFFEE",
    "label": "Coffee",
    "variants": [
      { "id": "COFFEE", "file": "assets/furniture/COFFEE/COFFEE.png", "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 }
    ]
  },
  {
    "id": "COFFEE_TABLE",
    "label": "Coffee Table",
    "variants": [
      { "id": "COFFEE_TABLE", "file": "assets/furniture/COFFEE_TABLE/COFFEE_TABLE.png", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2 }
    ]
  },
  {
    "id": "CUSHIONED_BENCH",
    "label": "Cushioned Bench",
    "variants": [
      { "id": "CUSHIONED_BENCH", "file": "assets/furniture/CUSHIONED_BENCH/CUSHIONED_BENCH.png", "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 }
    ]
  },
  {
    "id": "CUSHIONED_CHAIR",
    "label": "Cushioned Chair",
    "variants": [
      { "id": "CUSHIONED_CHAIR_FRONT",       "file": "assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT.png", "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 },
      { "id": "CUSHIONED_CHAIR_SIDE",        "file": "assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_SIDE.png",  "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 },
      { "id": "CUSHIONED_CHAIR_BACK",        "file": "assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK.png",  "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 },
      { "id": "CUSHIONED_CHAIR_SIDE_MIRROR", "file": "assets/furniture/CUSHIONED_CHAIR/CUSHIONED_CHAIR_SIDE.png",  "w": 16, "h": 16, "footprintW": 1, "footprintH": 1, "mirror": true }
    ]
  },
  {
    "id": "DOUBLE_BOOKSHELF",
    "label": "Double Bookshelf",
    "variants": [
      { "id": "DOUBLE_BOOKSHELF", "file": "assets/furniture/DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF.png", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2 }
    ]
  },
  {
    "id": "HANGING_PLANT",
    "label": "Hanging Plant",
    "variants": [
      { "id": "HANGING_PLANT", "file": "assets/furniture/HANGING_PLANT/HANGING_PLANT.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "LARGE_PAINTING",
    "label": "Large Painting",
    "variants": [
      { "id": "LARGE_PAINTING", "file": "assets/furniture/LARGE_PAINTING/LARGE_PAINTING.png", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2 }
    ]
  },
  {
    "id": "LARGE_PLANT",
    "label": "Large Plant",
    "variants": [
      { "id": "LARGE_PLANT", "file": "assets/furniture/LARGE_PLANT/LARGE_PLANT.png", "w": 32, "h": 48, "footprintW": 2, "footprintH": 3 }
    ]
  },
  {
    "id": "PC",
    "label": "PC",
    "variants": [
      { "id": "PC_FRONT",       "file": "assets/furniture/PC/PC_FRONT_ON_1.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "PC_SIDE",        "file": "assets/furniture/PC/PC_SIDE.png",        "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "PC_BACK",        "file": "assets/furniture/PC/PC_BACK.png",        "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "PC_SIDE_MIRROR", "file": "assets/furniture/PC/PC_SIDE.png",        "w": 16, "h": 32, "footprintW": 1, "footprintH": 2, "mirror": true }
    ]
  },
  {
    "id": "PLANT",
    "label": "Plant",
    "variants": [
      { "id": "PLANT", "file": "assets/furniture/PLANT/PLANT.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "PLANT_2",
    "label": "Plant 2",
    "variants": [
      { "id": "PLANT_2", "file": "assets/furniture/PLANT_2/PLANT_2.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "POT",
    "label": "Pot",
    "variants": [
      { "id": "POT", "file": "assets/furniture/POT/POT.png", "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 }
    ]
  },
  {
    "id": "SMALL_PAINTING",
    "label": "Small Painting",
    "variants": [
      { "id": "SMALL_PAINTING", "file": "assets/furniture/SMALL_PAINTING/SMALL_PAINTING.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "SMALL_PAINTING_2",
    "label": "Small Painting 2",
    "variants": [
      { "id": "SMALL_PAINTING_2", "file": "assets/furniture/SMALL_PAINTING_2/SMALL_PAINTING_2.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 }
    ]
  },
  {
    "id": "SMALL_TABLE",
    "label": "Small Table",
    "variants": [
      { "id": "SMALL_TABLE_FRONT", "file": "assets/furniture/SMALL_TABLE/SMALL_TABLE_FRONT.png", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2 },
      { "id": "SMALL_TABLE_SIDE",  "file": "assets/furniture/SMALL_TABLE/SMALL_TABLE_SIDE.png",  "w": 16, "h": 48, "footprintW": 1, "footprintH": 3 }
    ]
  },
  {
    "id": "SOFA",
    "label": "Sofa",
    "variants": [
      { "id": "SOFA_FRONT",       "file": "assets/furniture/SOFA/SOFA_FRONT.png", "w": 32, "h": 16, "footprintW": 2, "footprintH": 1 },
      { "id": "SOFA_SIDE",        "file": "assets/furniture/SOFA/SOFA_SIDE.png",  "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "SOFA_BACK",        "file": "assets/furniture/SOFA/SOFA_BACK.png",  "w": 32, "h": 16, "footprintW": 2, "footprintH": 1 },
      { "id": "SOFA_SIDE_MIRROR", "file": "assets/furniture/SOFA/SOFA_SIDE.png",  "w": 16, "h": 32, "footprintW": 1, "footprintH": 2, "mirror": true }
    ]
  },
  {
    "id": "TABLE_FRONT",
    "label": "Table",
    "variants": [
      { "id": "TABLE_FRONT", "file": "assets/furniture/TABLE_FRONT/TABLE_FRONT.png", "w": 48, "h": 64, "footprintW": 3, "footprintH": 4 }
    ]
  },
  {
    "id": "WHITEBOARD",
    "label": "Whiteboard",
    "variants": [
      { "id": "WHITEBOARD", "file": "assets/furniture/WHITEBOARD/WHITEBOARD.png", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2 }
    ]
  },
  {
    "id": "WOODEN_BENCH",
    "label": "Wooden Bench",
    "variants": [
      { "id": "WOODEN_BENCH", "file": "assets/furniture/WOODEN_BENCH/WOODEN_BENCH.png", "w": 16, "h": 16, "footprintW": 1, "footprintH": 1 }
    ]
  },
  {
    "id": "WOODEN_CHAIR",
    "label": "Wooden Chair",
    "variants": [
      { "id": "WOODEN_CHAIR_FRONT",       "file": "assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_FRONT.png", "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "WOODEN_CHAIR_SIDE",        "file": "assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_SIDE.png",  "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "WOODEN_CHAIR_BACK",        "file": "assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_BACK.png",  "w": 16, "h": 32, "footprintW": 1, "footprintH": 2 },
      { "id": "WOODEN_CHAIR_SIDE_MIRROR", "file": "assets/furniture/WOODEN_CHAIR/WOODEN_CHAIR_SIDE.png",  "w": 16, "h": 32, "footprintW": 1, "footprintH": 2, "mirror": true }
    ]
  }
]
```

- [ ] **Step 2: Quick sanity check in browser console**

With the server running, open the browser console and run:

```js
fetch('data/catalog.json').then(r => r.json()).then(c => console.log(c.length, c.map(i => i.id)))
```

Expected: logs `25` and an array of all 25 IDs starting with `DESK`.

- [ ] **Step 3: Verify tests still pass at `http://localhost:8000/tests.html`**

All tests must still pass (catalog.json is not imported by the test suite, but double-check nothing broke).

- [ ] **Step 4: Commit**

```bash
git add data/catalog.json
git commit -m "data: expand catalog to 25 furniture types"
```

---

### Task 3: Add mirror flip to `js/renderer.js`

Replace the furniture-draw loop inside `renderFrame` with one that flips mirrored variants horizontally.

**Files:**
- Modify: `js/renderer.js:56-67`

- [ ] **Step 1: Replace the furniture loop in `renderFrame`**

Find this block (lines 56–67):

```js
  for (const f of furnitureInstances) {
    if (!f.img || !f.variant) continue;
    const fx = offsetX + f.col * s;
    const fy = offsetY + f.row * s;
    const fw = Math.round(f.variant.w * zoom);
    const fh = Math.round(f.variant.h * zoom);
    const fimg = f.img;
    drawables.push({
      zY: (f.row + f.variant.footprintH) * TILE_SIZE,
      draw: (c) => { c.imageSmoothingEnabled = false; c.drawImage(fimg, fx, fy, fw, fh); },
    });
  }
```

Replace it with:

```js
  for (const f of furnitureInstances) {
    if (!f.img || !f.variant) continue;
    const fx = offsetX + f.col * s;
    const fy = offsetY + f.row * s;
    const fw = Math.round(f.variant.w * zoom);
    const fh = Math.round(f.variant.h * zoom);
    const fimg = f.img;
    const mirror = !!f.variant.mirror;
    drawables.push({
      zY: (f.row + f.variant.footprintH) * TILE_SIZE,
      draw: (c) => {
        c.imageSmoothingEnabled = false;
        if (mirror) {
          c.save();
          c.translate(fx + fw, fy);
          c.scale(-1, 1);
          c.drawImage(fimg, 0, 0, fw, fh);
          c.restore();
        } else {
          c.drawImage(fimg, fx, fy, fw, fh);
        }
      },
    });
  }
```

- [ ] **Step 2: Verify tests still pass at `http://localhost:8000/tests.html`**

Expected: all tests pass (renderer.js is not imported by the test suite, but confirm nothing broke).

- [ ] **Step 3: Commit**

```bash
git add js/renderer.js
git commit -m "feat: horizontal flip for mirror:true furniture variants"
```

---

### Task 4: Generalize admin — `admin.html` + `js/adminMain.js`

Update the HTML first (adds the DOM elements), then update the JS (references them).

**Files:**
- Modify: `admin.html:27,29-31`
- Modify: `js/adminMain.js` (multiple locations)

- [ ] **Step 1: Update `admin.html`**

Find:
```html
    <button class="tool-btn" data-tool="desk">Desk</button>

    <div id="variant-section" hidden>
      <button id="variant-btn">DESK_FRONT</button>
    </div>
```

Replace with:
```html
    <button class="tool-btn" data-tool="furniture">Furniture</button>

    <div id="variant-section" hidden>
      <select id="furniture-type"></select>
      <button id="variant-btn">DESK_FRONT</button>
    </div>
```

- [ ] **Step 2: Add `activeItemId` to state and new DOM ref in `js/adminMain.js`**

Find the state object (line 8):
```js
const state = {
  catalog: null,
  furnitureSprites: null,
  layout: null,
  tileMap: null,
  blockedTiles: null,
  furnitureInstances: null,
  zoom: 1,
  activeTool: 'floor',
  activeVariantIdx: 0,
  isPainting: false,
  ghostCol: -1,
  ghostRow: -1,
  selectedUid: null,
  needsRender: true,
};
```

Replace with:
```js
const state = {
  catalog: null,
  furnitureSprites: null,
  layout: null,
  tileMap: null,
  blockedTiles: null,
  furnitureInstances: null,
  zoom: 1,
  activeTool: 'floor',
  activeItemId: 'DESK',
  activeVariantIdx: 0,
  isPainting: false,
  ghostCol: -1,
  ghostRow: -1,
  selectedUid: null,
  needsRender: true,
};
```

Find the DOM refs block (line 28):
```js
const variantBtn = document.getElementById('variant-btn');
const variantSection = document.getElementById('variant-section');
```

Replace with:
```js
const variantBtn = document.getElementById('variant-btn');
const variantSection = document.getElementById('variant-section');
const furnitureTypeSelect = document.getElementById('furniture-type');
```

- [ ] **Step 3: Update `getActiveVariant()` in `js/adminMain.js`**

Find:
```js
function getActiveVariant() {
  const desk = state.catalog[0];
  return desk.variants[state.activeVariantIdx];
}
```

Replace with:
```js
function getActiveVariant() {
  const item = state.catalog.find(i => i.id === state.activeItemId);
  return item.variants[state.activeVariantIdx];
}
```

- [ ] **Step 4: Rename `placeDeskAt` → `placeFurnitureAt` and use `activeItemId`**

Find:
```js
function placeDeskAt(col, row) {
  const variant = getActiveVariant();
  if (!canPlaceAt(col, row, variant)) return;
  state.layout.furniture.push({ uid: uid(), type: 'DESK', variantId: variant.id, col, row });
  rebuildLayout();
}
```

Replace with:
```js
function placeFurnitureAt(col, row) {
  const variant = getActiveVariant();
  if (!canPlaceAt(col, row, variant)) return;
  state.layout.furniture.push({ uid: uid(), type: state.activeItemId, variantId: variant.id, col, row });
  rebuildLayout();
}
```

- [ ] **Step 5: Update the three `'desk'` → `'furniture'` occurrences**

In `mousedown` handler, find:
```js
  if (state.activeTool === 'desk') {
    placeDeskAt(col, row);
```
Replace with:
```js
  if (state.activeTool === 'furniture') {
    placeFurnitureAt(col, row);
```

In `renderOverlays`, find:
```js
  if (state.activeTool === 'desk' && state.ghostCol >= 0 && state.ghostRow >= 0) {
```
Replace with:
```js
  if (state.activeTool === 'furniture' && state.ghostCol >= 0 && state.ghostRow >= 0) {
```

In the tool button click handler, find:
```js
    variantSection.hidden = state.activeTool !== 'desk';
```
Replace with:
```js
    variantSection.hidden = state.activeTool !== 'furniture';
```

In the `click` canvas handler, find:
```js
  if (state.activeTool === 'desk') return;
```
Replace with:
```js
  if (state.activeTool === 'furniture') return;
```

- [ ] **Step 6: Update `variantBtn` click handler to use active item**

Find:
```js
variantBtn.addEventListener('click', () => {
  const desk = state.catalog[0];
  state.activeVariantIdx = (state.activeVariantIdx + 1) % desk.variants.length;
  variantBtn.textContent = desk.variants[state.activeVariantIdx].id;
  state.needsRender = true;
});
```

Replace with:
```js
variantBtn.addEventListener('click', () => {
  const item = state.catalog.find(i => i.id === state.activeItemId);
  state.activeVariantIdx = (state.activeVariantIdx + 1) % item.variants.length;
  variantBtn.textContent = item.variants[state.activeVariantIdx].id;
  state.needsRender = true;
});
```

- [ ] **Step 7: Add furniture-type select change handler (after the variantBtn listener)**

Add immediately after the `variantBtn.addEventListener` block:

```js
furnitureTypeSelect.addEventListener('change', () => {
  state.activeItemId = furnitureTypeSelect.value;
  state.activeVariantIdx = 0;
  const item = state.catalog.find(i => i.id === state.activeItemId);
  variantBtn.textContent = item.variants[0].id;
  variantBtn.hidden = item.variants.length <= 1;
  state.needsRender = true;
});
```

- [ ] **Step 8: Update `main()` init to populate the select and set initial variant button state**

Find in `main()`:
```js
  state.catalog = catalog;
  variantBtn.textContent = catalog[0].variants[0].id;
```

Replace with:
```js
  state.catalog = catalog;

  for (const item of catalog) {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.label;
    furnitureTypeSelect.appendChild(opt);
  }

  const initialItem = catalog.find(i => i.id === state.activeItemId);
  variantBtn.textContent = initialItem.variants[0].id;
  variantBtn.hidden = initialItem.variants.length <= 1;
```

- [ ] **Step 9: Open `http://localhost:8000/admin.html` and verify**

Check each of the following:
1. The sidebar shows "Furniture" button (not "Desk")
2. Clicking Furniture activates it and shows the variant section with a dropdown
3. The dropdown lists all 25 item labels (Desk, Bin, Bookshelf, …)
4. Selecting "Bin" from the dropdown and clicking a floor tile places a BIN
5. Selecting "Sofa" — the variant button shows `SOFA_FRONT`; clicking it cycles SOFA_FRONT → SOFA_SIDE → SOFA_BACK → SOFA_SIDE_MIRROR → SOFA_FRONT
6. Selecting a single-variant item (Bin, Cactus, etc.) — the variant button is hidden
7. Placing a SOFA_SIDE_MIRROR on the scene: the sprite appears flipped horizontally vs SOFA_SIDE
8. Rotate button on a selected SOFA cycles through its 4 variants
9. Save/Reset still work
10. `http://localhost:8000/tests.html` still shows all tests passing

- [ ] **Step 10: Commit**

```bash
git add admin.html js/adminMain.js
git commit -m "feat: furniture dropdown — generalize admin from DESK to all 25 types"
```
