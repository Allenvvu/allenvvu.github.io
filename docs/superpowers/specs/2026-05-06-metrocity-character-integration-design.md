# MetroCity Character Integration Design

**Date:** 2026-05-06  
**Status:** Approved

## Overview

Replace the current NPC sprites with a custom MetroCity character asset. The game currently uses three 4×4 sprite sheets (4 animation frames × 4 directions). MetroCity provides a single 24-figure sprite strip with 6 animation frames per direction.

## Character Asset Structure

**File:** `sprites/MetroCity/CharacterModel/Character Model.png` (customized)

- **Dimensions:** 16×32 pixels per figure
- **Layout:** All 24 figures in a single horizontal row
- **Total image size:** 384×32 pixels (24 × 16 = 384 wide)
- **Organization:** 4 directions × 6 frames per direction
- **Direction order:** forward, right, backward, left
- **Frames per direction:** 6 (all frames used, no subsetting)

## Direction Mapping

MetroCity direction order → Game direction constants:

| MetroCity Columns | MetroCity Name | Game Constant | Game Value |
|-------------------|----------------|---------------|-----------|
| 0-5               | Forward        | DIR.DOWN      | 0         |
| 6-11              | Right          | DIR.RIGHT     | 3         |
| 12-17             | Backward       | DIR.UP        | 1         |
| 18-23             | Left           | DIR.LEFT      | 2         |

## Code Changes

### 1. Sprite Asset Update
**File:** `game.js` (SPRITE_PATHS)

Replace the three separate NPC sprite paths with the new MetroCity character:
```
OLD: npc1/npc2/npc3: 'sprites/npc-1.png', etc.
NEW: All NPCs use single character asset: 'sprites/MetroCity/CharacterModel/Character Model.png'
```

All three NPCs (npc1, npc2, npc3) will use the same sprite asset.

### 2. Sprite Drawing Logic
**File:** `game.js` (drawNPCs function)

Update source rectangle calculation to handle single-row layout:

```
OLD: sourceX = npc.frame * TILE, sourceY = npc.dir * TILE
NEW: 
  - Map npc.dir to MetroCity direction index (0-3)
  - sourceX = (metroDir * 6 + npc.frame) * TILE
  - sourceY = 0
```

Direction mapping formula:
```javascript
const dirMap = [DIR.DOWN, DIR.LEFT, DIR.UP, DIR.RIGHT]; // MetroCity order
const metroDir = dirMap.indexOf(npc.dir);
```

### 3. Animation Cycle
**File:** `game.js` (WALK_CYCLE constant)

Change from 4-frame to 6-frame cycle:
```
OLD: [0, 1, 2, 1]
NEW: [0, 1, 2, 3, 4, 5]
```

### 4. Frame Timing (Optional)
**File:** `game.js` (FRAME_INTERVAL constant)

Current: 150ms per frame  
Assessment: With 6 frames, animation speed is 150ms × 6 = 900ms per cycle (vs. 600ms with 4 frames). If this feels too slow, reduce FRAME_INTERVAL to maintain similar animation speed.

Recommendation: Test after implementation; adjust if animation feels sluggish.

## Testing

Verify:
1. All three NPCs render with the MetroCity character
2. All 4 directions display correctly (no direction mapping errors)
3. Walking animation flows smoothly with 6 frames
4. Character clips correctly within tile bounds (16×32 asset into 48×48 on-screen tile)

## Files Modified

- `game.js` — sprite loading, drawing, animation constants
- No changes to NPC logic, state machine, or game loop

## Files Created

- This design doc

## Rollback Plan

If issues arise, revert `game.js` to previous commit and restore original sprite files from git history.
