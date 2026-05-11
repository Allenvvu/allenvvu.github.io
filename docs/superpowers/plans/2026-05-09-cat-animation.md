# Cat Sprite Strip Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the CAT furniture item using its 21-frame PNG sprite strip while it stays in its placed position, via a generic animated-furniture mechanism.

**Architecture:** Add `frames`/`frameW`/`frameDuration` metadata to catalog variants. `buildFurnitureInstances` seeds `frameIndex`/`frameTimer` on animated instances. `updateFurnitureAnimations` ticks them each game-loop update. `renderFrame` slices the correct frame via the 6-argument `drawImage` form.

**Tech Stack:** Vanilla ES6 modules, no bundler. In-browser test harness at `tests.html` (`js/tests/run.js`).

---

### Task 1: Update catalog.json — swap CAT to strip with animation metadata

**Files:**
- Modify: `data/catalog.json` (CAT variant entry, ~line 302)

- [ ] **Step 1: Update the CAT variant**

Find the existing CAT variant:
```json
{ "id": "CAT", "file": "assets/furniture/CAT/CAT.gif", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2 }
```
Replace with:
```json
{ "id": "CAT", "file": "assets/furniture/CAT/CAT_STRIP.png", "w": 32, "h": 32, "footprintW": 2, "footprintH": 2, "frames": 21, "frameW": 315, "frameDuration": 0.1 }
```

- [ ] **Step 2: Commit**

```bash
git add data/catalog.json
git commit -m "feat: switch CAT to sprite strip with animation metadata"
```

---

### Task 2: Add animation state to `buildFurnitureInstances` + new `updateFurnitureAnimations`

**Files:**
- Modify: `js/layoutStore.js`
- Modify: `js/tests/layoutStore.test.js`

- [ ] **Step 1: Write failing tests**

Open `js/tests/layoutStore.test.js`. At the top, update the import to include `updateFurnitureAnimations`:
```js
import { assert, assertEqual } from './run.js';
import { buildTileMap, buildBlockedTiles, buildFurnitureInstances, updateFurnitureAnimations } from '../layoutStore.js';
```

Append these tests at the end of `runTests()`:

```js
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
```

- [ ] **Step 2: Open tests.html in browser and confirm the new tests FAIL**

Open `tests.html` in your browser. You should see failures like:
- `animated instance starts at frameIndex 0` — FAIL
- `updateFurnitureAnimations` — FAIL (function not exported)

- [ ] **Step 3: Implement in `js/layoutStore.js`**

Update `buildFurnitureInstances` (line 51-57) to seed animation state:
```js
export function buildFurnitureInstances(furniture, catalog, sprites) {
  return furniture.map(f => {
    const item = catalog.find(c => c.id === f.type);
    const variant = item ? item.variants.find(v => v.id === f.variantId) : null;
    const base = { ...f, variant, img: sprites[f.variantId] ?? null, isItem: item?.category === 'items' };
    if (variant?.frames > 1) {
      base.frameIndex = 0;
      base.frameTimer = 0;
    }
    return base;
  });
}
```

Add this new export after `buildFurnitureInstances`:
```js
export function updateFurnitureAnimations(instances, dt) {
  for (const f of instances) {
    if (!f.variant?.frames || f.variant.frames <= 1) continue;
    f.frameTimer += dt;
    while (f.frameTimer >= f.variant.frameDuration) {
      f.frameTimer -= f.variant.frameDuration;
      f.frameIndex = (f.frameIndex + 1) % f.variant.frames;
    }
  }
}
```

- [ ] **Step 4: Reload tests.html and confirm all tests PASS**

All previously failing tests should now be green. Total count should increase by 7 assertions.

- [ ] **Step 5: Commit**

```bash
git add js/layoutStore.js js/tests/layoutStore.test.js
git commit -m "feat: seed frameIndex/frameTimer on animated furniture instances, add updateFurnitureAnimations"
```

---

### Task 3: Wire `updateFurnitureAnimations` into the scene game loop

**Files:**
- Modify: `js/sceneMain.js`

- [ ] **Step 1: Import `updateFurnitureAnimations`**

In `js/sceneMain.js`, update the import from `layoutStore.js` (line 2):
```js
import { loadLayout, buildTileMap, buildBlockedTiles, buildFurnitureInstances, updateFurnitureAnimations } from './layoutStore.js';
```

- [ ] **Step 2: Add to the update callback**

Find the `startGameLoop` call (line 37-40) and update the `update` callback:
```js
startGameLoop(canvas, {
  update: (dt) => {
    updateCharacter(character, dt, tileMap, blockedTiles);
    updateFurnitureAnimations(furnitureInstances, dt);
  },
  render: (ctx) => renderFrame(ctx, { cols: layout.cols, rows: layout.rows, tileMap }, furnitureInstances, character, charImg, zoom, floorImgs),
});
```

- [ ] **Step 3: Commit**

```bash
git add js/sceneMain.js
git commit -m "feat: tick furniture animations in scene game loop"
```

---

### Task 4: Render the correct frame slice in `renderer.js`

**Files:**
- Modify: `js/renderer.js`

- [ ] **Step 1: Capture animation vars before the draw closure**

In `renderer.js`, find the furniture loop (starting at line 78). After the existing `const` captures and before `drawables.push(...)`, add:
```js
const isAnimated = (f.variant.frames ?? 1) > 1;
const animSrcX = isAnimated ? f.frameIndex * f.variant.frameW : 0;
const animFrameW = isAnimated ? f.variant.frameW : 0;
const animFrameH = isAnimated ? fimg.naturalHeight : 0;
```

- [ ] **Step 2: Branch `drawImage` calls inside the draw closure**

Replace the existing `draw` closure (lines 102-113):
```js
draw: (c) => {
  c.imageSmoothingEnabled = false;
  if (mirror) {
    c.save();
    c.translate(fx + fw, fy);
    c.scale(-1, 1);
    if (isAnimated) {
      c.drawImage(fimg, animSrcX, 0, animFrameW, animFrameH, 0, 0, fw, fh);
    } else {
      c.drawImage(fimg, 0, 0, fw, fh);
    }
    c.restore();
  } else {
    if (isAnimated) {
      c.drawImage(fimg, animSrcX, 0, animFrameW, animFrameH, fx, fy, fw, fh);
    } else {
      c.drawImage(fimg, fx, fy, fw, fh);
    }
  }
},
```

- [ ] **Step 3: Verify in browser**

1. Open `index.html` in a browser.
2. Make sure a CAT is placed in the layout (via admin or in `data/default-layout.json`).
3. Confirm the cat animates through its frames continuously.
4. Confirm all other furniture still renders correctly.
5. Open `tests.html` and confirm all 29+ tests still pass.

- [ ] **Step 4: Commit and push**

```bash
git add js/renderer.js
git commit -m "feat: slice animated furniture frames from sprite strip in renderer"
git push
```
