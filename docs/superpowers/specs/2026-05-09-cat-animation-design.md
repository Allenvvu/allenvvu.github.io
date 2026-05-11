# Cat Sprite Strip Animation — Design Spec

**Date:** 2026-05-09
**Status:** Approved

## Goal

Animate the CAT furniture item using its 21-frame sprite strip (`CAT_STRIP.png`) while it stays in its placed position. Use a generic animated-furniture mechanism so future animated sprites work automatically.

## Data Changes

`data/catalog.json` — CAT variant updated:
- `file` → `assets/furniture/CAT/CAT_STRIP.png` (was `CAT.gif`)
- Add `"frames": 21` — total frame count
- Add `"frameW": 315` — pixel width of one frame in the strip (strip is 6615×280)
- Add `"frameDuration": 0.1` — seconds per frame (~10 fps)
- `w`, `h`, `footprintW`, `footprintH` unchanged

Any variant without `frames` (or `frames <= 1`) is treated as static — no behavior change for existing furniture.

## Module Changes

### `js/layoutStore.js`

**`buildFurnitureInstances`** — when a variant has `frames > 1`, initialize:
```js
frameIndex: 0,
frameTimer: 0,
```

**New export `updateFurnitureAnimations(instances, dt)`**:
```
for each instance whose variant.frames > 1:
  frameTimer += dt
  while frameTimer >= frameDuration:
    frameTimer -= frameDuration
    frameIndex = (frameIndex + 1) % frames
```

### `js/sceneMain.js`

Update callback:
```js
update: (dt) => {
  updateCharacter(character, dt, tileMap, blockedTiles);
  updateFurnitureAnimations(furnitureInstances, dt);
},
```

### `js/renderer.js`

In the furniture draw closure, branch on `f.variant.frames > 1`:
- **Animated:** `drawImage(img, srcX, 0, frameW, imgH, fx, fy, fw, fh)` where `srcX = frameIndex * frameW`
- **Static:** `drawImage(img, fx, fy, fw, fh)` (unchanged)
- Mirror transform wraps both cases as before.

## Out of Scope

- Admin editor animation (dirty-flag RAF has no dt; cat renders as frame 0 in admin — acceptable)
- `furnitureLoader.js` GIF handling — unchanged (kept for other potential GIFs)
- Character wander behavior for the cat — cat stays in place
