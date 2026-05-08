# Furniture Expansion — Design Spec

**Date:** 2026-05-08  
**Status:** Approved

## Summary

Expand the pixel-office site to support all 24 furniture types (DESK + 23 new assets downloaded from pixel-agents). Follow the existing DESK pattern: flat `catalog.json` variants, rotate button cycles variants, admin dropdown selects which item to place.

---

## 1. Data — `data/catalog.json`

Extend from 1 item (DESK) to 24 items. All items use the existing schema:

```
{ id, label, variants: [{ id, file, w, h, footprintW, footprintH, mirror? }] }
```

Three variant patterns:

### Single-sprite items (1 variant each)
BIN, BOOKSHELF, CACTUS, CLOCK, COFFEE, COFFEE_TABLE, CUSHIONED_BENCH, DOUBLE_BOOKSHELF, HANGING_PLANT, LARGE_PAINTING, LARGE_PLANT, PLANT, PLANT_2, POT, SMALL_PAINTING, SMALL_PAINTING_2, TABLE_FRONT, WHITEBOARD, WOODEN_BENCH

Each gets one variant entry where `id` = item id, `file` = `assets/furniture/<ITEM>/<ITEM>.png`, dimensions from the manifest.

### 2-way rotation (2 variants each)
**SMALL_TABLE**: SMALL_TABLE_FRONT (32×32, footprint 2×2) + SMALL_TABLE_SIDE (16×48, footprint 1×3)

### 3-way-mirror rotation (4 variants each)
**SOFA**, **WOODEN_CHAIR**, **CUSHIONED_CHAIR**, **PC**

Rotation order: FRONT → SIDE → BACK → SIDE_MIRROR

The `_MIRROR` variant reuses the SIDE PNG but adds `"mirror": true`. Example:
```json
{ "id": "SOFA_SIDE_MIRROR", "file": "assets/furniture/SOFA/SOFA_SIDE.png",
  "w": 16, "h": 32, "footprintW": 1, "footprintH": 2, "mirror": true }
```

**PC simplification:** PC has nested animation/state groups in its manifest. These are dropped. PC gets 4 variants using static PNGs: FRONT (PC_FRONT_ON_1.png), SIDE (PC_SIDE.png), BACK (PC_BACK.png), SIDE_MIRROR.

Full item list with dimensions (from manifests):

| Item | Variants | w×h | footprintW×H |
|------|----------|-----|--------------|
| DESK | DESK_FRONT, DESK_SIDE | 48×32, 16×64 | 3×2, 1×4 |
| BIN | BIN | 16×16 | 1×1 |
| BOOKSHELF | BOOKSHELF | 32×16 | 2×1 |
| CACTUS | CACTUS | 16×32 | 1×2 |
| CLOCK | CLOCK | 16×32 | 1×2 |
| COFFEE | COFFEE | 16×16 | 1×1 |
| COFFEE_TABLE | COFFEE_TABLE | 32×32 | 2×2 |
| CUSHIONED_BENCH | CUSHIONED_BENCH | 16×16 | 1×1 |
| CUSHIONED_CHAIR | FRONT/SIDE/BACK/SIDE_MIRROR | 16×16 | 1×1 |
| DOUBLE_BOOKSHELF | DOUBLE_BOOKSHELF | 32×32 | 2×2 |
| HANGING_PLANT | HANGING_PLANT | 16×32 | 1×2 |
| LARGE_PAINTING | LARGE_PAINTING | 32×32 | 2×2 |
| LARGE_PLANT | LARGE_PLANT | 32×48 | 2×3 |
| PC | FRONT/SIDE/BACK/SIDE_MIRROR | 16×32 | 1×2 |
| PLANT | PLANT | 16×32 | 1×2 |
| PLANT_2 | PLANT_2 | 16×32 | 1×2 |
| POT | POT | 16×16 | 1×1 |
| SMALL_PAINTING | SMALL_PAINTING | 16×32 | 1×2 |
| SMALL_PAINTING_2 | SMALL_PAINTING_2 | 16×32 | 1×2 |
| SMALL_TABLE | FRONT/SIDE | 32×32, 16×48 | 2×2, 1×3 |
| SOFA | FRONT/SIDE/BACK/SIDE_MIRROR | 32×16, 16×32 | 2×1, 1×2 |
| TABLE_FRONT | TABLE_FRONT | 48×64 | 3×4 |
| WHITEBOARD | WHITEBOARD | 32×32 | 2×2 |
| WOODEN_BENCH | WOODEN_BENCH | 16×16 | 1×1 |
| WOODEN_CHAIR | FRONT/SIDE/BACK/SIDE_MIRROR | 16×32 | 1×2 |

---

## 2. Renderer — `js/renderer.js`

Add horizontal flip support for `variant.mirror === true` in the furniture draw closure:

```js
draw: (c) => {
  c.imageSmoothingEnabled = false;
  if (f.variant.mirror) {
    c.save();
    c.translate(fx + fw, fy);
    c.scale(-1, 1);
    c.drawImage(fimg, 0, 0, fw, fh);
    c.restore();
  } else {
    c.drawImage(fimg, fx, fy, fw, fh);
  }
}
```

No other renderer changes. `furnitureLoader.js` needs no changes — it already loads sprites by `variant.id`, and the `_MIRROR` variant's `id` is distinct so it gets its own sprite entry (same image, different key — that's fine).

---

## 3. Admin — `js/adminMain.js` + `admin.html`

### State changes

Replace:
```js
activeVariantIdx: 0,
```
With:
```js
activeItemId: 'DESK',
activeVariantIdx: 0,
```

### Helper changes

`getActiveVariant()`: replace `state.catalog[0]` with `state.catalog.find(i => i.id === state.activeItemId)`.

`placeDeskAt()` → `placeFurnitureAt()`: use `state.activeItemId` as the placed instance `type`.

Ghost preview and `activeTool === 'desk'` checks → `activeTool === 'furniture'`.

### Admin HTML changes

- Rename the "Desk" tool button label to "Furniture" and its `data-tool` to `"furniture"`.
- Inside `#variant-section`, add a `<select id="furniture-type">` above the existing variant button. Populated on init by iterating `catalog` and inserting one `<option value="{id}">{label}</option>` per item.
- When the select changes: set `state.activeItemId`, reset `state.activeVariantIdx = 0`, update variant button label, set `needsRender = true`.
- Variant button: hide (or disable) when the active item has only 1 variant.

### Variant button label

Show `item.variants[state.activeVariantIdx].id` — same as current behaviour, just driven by active item rather than `catalog[0]`.

---

## Out of scope

- PC screen animation (on/off states, frame cycling) — static FRONT_ON_1 only
- `canPlaceOnWalls` / `canPlaceOnSurfaces` placement rules — walls are already not floor tiles, so the existing `TileType.FLOOR` check implicitly handles most cases
- Floor tile art — no floor sprite assets were downloaded; floor remains solid `#808080`
- `backgroundTiles` field — not used by the current renderer
- Ghost preview for mirrored variants shows the un-flipped image (the ghost in `renderOverlays` uses plain `drawImage`; mirror flip is only applied in `renderFrame`). Acceptable — ghost is just a placement hint.
