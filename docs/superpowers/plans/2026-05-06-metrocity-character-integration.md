# MetroCity Character Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three separate NPC sprite sheets with a single MetroCity character sprite using a different layout (24-figure single row vs. 4×4 grid).

**Architecture:** Add helper function to map game directions to MetroCity indices, update sprite drawing to calculate positions from single-row layout, change animation to 6-frame cycle, point all NPCs to shared MetroCity asset.

**Tech Stack:** Vanilla JavaScript, Canvas 2D, no dependencies

---

### Task 1: Add direction mapping helper and test

**Files:**
- Modify: `game.js`
- Modify: `tests/test.html`

- [ ] **Step 1: Add failing test for direction mapping**

In `tests/test.html`, add this test before the summary output:

```javascript
// ── Direction mapping to MetroCity ────────────────────────────────────────
const G3 = window.GameUtils;
assert('getMetroCityDirIndex DOWN → 0',
  G3.getMetroCityDirIndex(G3.DIR.DOWN), 0);
assert('getMetroCityDirIndex RIGHT → 1',
  G3.getMetroCityDirIndex(G3.DIR.RIGHT), 1);
assert('getMetroCityDirIndex UP → 2',
  G3.getMetroCityDirIndex(G3.DIR.UP), 2);
assert('getMetroCityDirIndex LEFT → 3',
  G3.getMetroCityDirIndex(G3.DIR.LEFT), 3);
```

- [ ] **Step 2: Run test to verify it fails**

Open `tests/test.html` in a browser.  
Expected: Four new failing tests (red) for `getMetroCityDirIndex`

- [ ] **Step 3: Implement direction mapping function**

In `game.js`, add this function after the `updateNPC` function (after line 216):

```javascript
function getMetroCityDirIndex(gameDir) {
  const map = {
    [DIR.DOWN]:  0,  // MetroCity: forward (cols 0-5)
    [DIR.RIGHT]: 1,  // MetroCity: right (cols 6-11)
    [DIR.UP]:    2,  // MetroCity: backward (cols 12-17)
    [DIR.LEFT]:  3,  // MetroCity: left (cols 18-23)
  };
  return map[gameDir];
}

window.GameUtils = Object.assign(window.GameUtils, {
  getMetroCityDirIndex,
});
```

- [ ] **Step 4: Run test to verify it passes**

Refresh `tests/test.html` in browser.  
Expected: Four new passing tests (green) for `getMetroCityDirIndex`

- [ ] **Step 5: Commit**

```bash
git add tests/test.html game.js
git commit -m "feat: add direction mapping for MetroCity layout"
```

---

### Task 2: Add sprite position calculation helper and test

**Files:**
- Modify: `game.js`
- Modify: `tests/test.html`

- [ ] **Step 1: Add failing test for sprite position calculation**

In `tests/test.html`, add these tests after the direction mapping tests:

```javascript
// ── MetroCity sprite position calculation ──────────────────────────────────
assert('calcMetroCitySourceX frame 0, dir 0',
  G3.calcMetroCitySourceX(0, 0), 0);
assert('calcMetroCitySourceX frame 3, dir 0',
  G3.calcMetroCitySourceX(3, 0), 3 * G3.TILE);
assert('calcMetroCitySourceX frame 0, dir 1 (right)',
  G3.calcMetroCitySourceX(0, 1), 6 * G3.TILE);
assert('calcMetroCitySourceX frame 2, dir 1 (right)',
  G3.calcMetroCitySourceX(2, 1), (6 + 2) * G3.TILE);
assert('calcMetroCitySourceX frame 0, dir 2 (up)',
  G3.calcMetroCitySourceX(0, 2), 12 * G3.TILE);
assert('calcMetroCitySourceY always 0',
  G3.calcMetroCitySourceY(), 0);
```

- [ ] **Step 2: Run test to verify it fails**

Refresh `tests/test.html` in browser.  
Expected: Six new failing tests (red) for sprite position functions

- [ ] **Step 3: Implement sprite position calculation functions**

In `game.js`, add these functions after `getMetroCityDirIndex`:

```javascript
function calcMetroCitySourceX(frame, metroDir) {
  return (metroDir * 6 + frame) * TILE;
}

function calcMetroCitySourceY() {
  return 0; // All frames in single row
}

window.GameUtils = Object.assign(window.GameUtils, {
  calcMetroCitySourceX, calcMetroCitySourceY,
});
```

- [ ] **Step 4: Run test to verify it passes**

Refresh `tests/test.html` in browser.  
Expected: Six new passing tests (green)

- [ ] **Step 5: Commit**

```bash
git add tests/test.html game.js
git commit -m "feat: add sprite position calculation for MetroCity single-row layout"
```

---

### Task 3: Update SPRITE_PATHS to point to MetroCity character

**Files:**
- Modify: `game.js:242-249`

- [ ] **Step 1: Update sprite paths**

In `game.js`, replace the `SPRITE_PATHS` object (lines 242-249):

```javascript
const SPRITE_PATHS = {
  npc1:      'sprites/MetroCity/CharacterModel/Character Model.png',
  npc2:      'sprites/MetroCity/CharacterModel/Character Model.png',
  npc3:      'sprites/MetroCity/CharacterModel/Character Model.png',
  bookshelf: 'sprites/bookshelf.png',
  plant:     'sprites/plant.png',
  wallArt:   'sprites/wall-art.png',
};
```

- [ ] **Step 2: Commit**

```bash
git add game.js
git commit -m "feat: update NPC sprite paths to MetroCity character"
```

---

### Task 4: Update drawNPCs to use MetroCity layout

**Files:**
- Modify: `game.js:228-238`

- [ ] **Step 1: Replace drawNPCs function**

In `game.js`, replace the `drawNPCs` function (lines 228-238):

```javascript
function drawNPCs() {
  for (const npc of sortByY(NPCS)) {
    const img = sprites[npc.spriteKey];
    if (!img) continue;
    const metroDir = getMetroCityDirIndex(npc.dir);
    const sourceX = calcMetroCitySourceX(npc.frame, metroDir);
    const sourceY = calcMetroCitySourceY();
    ctx.drawImage(
      img,
      sourceX, sourceY, TILE, TILE,  // source rect in MetroCity strip
      roomX + npc.x, roomY + npc.y, TS, TS  // dest rect on canvas
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add game.js
git commit -m "feat: update NPC drawing for MetroCity single-row sprite layout"
```

---

### Task 5: Update WALK_CYCLE to use 6 frames

**Files:**
- Modify: `game.js:127`

- [ ] **Step 1: Update WALK_CYCLE constant**

In `game.js`, find the `WALK_CYCLE` constant (line 127) and replace it:

```javascript
const WALK_CYCLE = [0, 1, 2, 3, 4, 5];
```

- [ ] **Step 2: Update test expectations**

In `tests/test.html`, find the WALK_CYCLE tests (lines 87-92) and update them:

```javascript
// ── WALK_CYCLE ────────────────────────────────────────────────────────────
assert('WALK_CYCLE has 6 steps',   G2.WALK_CYCLE.length, 6);
assert('WALK_CYCLE step 0 is 0',   G2.WALK_CYCLE[0], 0);
assert('WALK_CYCLE step 1 is 1',   G2.WALK_CYCLE[1], 1);
assert('WALK_CYCLE step 2 is 2',   G2.WALK_CYCLE[2], 2);
assert('WALK_CYCLE step 3 is 3',   G2.WALK_CYCLE[3], 3);
assert('WALK_CYCLE step 4 is 4',   G2.WALK_CYCLE[4], 4);
assert('WALK_CYCLE step 5 is 5',   G2.WALK_CYCLE[5], 5);
```

- [ ] **Step 3: Run tests to verify they pass**

Open `tests/test.html` in browser.  
Expected: All tests pass (green)

- [ ] **Step 4: Commit**

```bash
git add game.js tests/test.html
git commit -m "feat: update walk cycle to 6 frames for MetroCity animation"
```

---

### Task 6: Manual game test — verify NPCs render correctly

**Files:**
- No code changes (verification only)

- [ ] **Step 1: Open game in browser**

Open `index.html` (or the main game page) in a browser.  
Verify the game loads without console errors.

- [ ] **Step 2: Verify NPCs render and animate**

- All three NPCs should be visible on screen
- Each NPC should animate with smooth 6-frame walking cycle
- NPCs should move around the room
- No visual glitches or clipping

- [ ] **Step 3: Verify direction rendering**

- Watch each NPC as it walks in all four directions (forward, right, backward, left)
- Character should face the correct direction
- No backwards/mirrored rendering

If any issues, use browser dev tools console to check for errors.

- [ ] **Step 4: Commit if needed**

If no issues found, no commit needed. Plan is complete.

If issues found, document them and address in a follow-up commit.

---

## Plan Self-Review

**Spec coverage:**
- ✓ Update SPRITE_PATHS (Task 3)
- ✓ Remap direction layout in drawNPCs (Task 4, using Task 1)
- ✓ Update WALK_CYCLE to 6 frames (Task 5)
- ✓ Direction order mapping (Task 1 helper function)
- ✓ Test that NPCs render correctly (Task 6)

**Placeholder scan:** No "TBD", "TODO", or incomplete sections. All code is complete.

**Type consistency:** 
- `getMetroCityDirIndex()` takes game direction, returns 0-3 ✓
- `calcMetroCitySourceX()` takes frame (0-5) and metroDir (0-3), returns pixel offset ✓
- All function names consistent across tasks ✓

**No gaps found.** Plan is complete.
