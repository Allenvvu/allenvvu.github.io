# Portfolio Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent Allen Wu portfolio nav over the pixel office canvas, with room-focused camera animation and modal content for About, Projects, and Blogs.

**Architecture:** `js/portfolio.js` owns room targets, pure camera math, DOM state, content rendering, and open/close transitions. `js/renderer.js` keeps its existing default behavior but accepts an optional camera override. `js/sceneMain.js` initializes the portfolio overlay and passes the current camera into `renderFrame`.

**Tech Stack:** Vanilla HTML, CSS, JavaScript ES modules, existing in-browser test harness at `tests.html`, no bundler.

---

## File Structure

- Create `js/portfolio.js`: portfolio room targets, camera math exports for tests, modal content, tab/close handlers, and `initPortfolio()`.
- Create `js/tests/portfolio.test.js`: pure tests for room target math, default camera math, interpolation, and easing.
- Modify `tests.html`: import and run the portfolio tests.
- Modify `js/renderer.js`: accept an optional camera object with `zoom`, `offsetX`, and `offsetY`.
- Modify `index.html`: add the HTML overlay shell above the canvas.
- Modify `css/main.css`: style the nav row, tabs, dim layer, modal, sample content, and mobile behavior.
- Modify `js/sceneMain.js`: initialize portfolio behavior and pass `portfolio.getCamera()` to the renderer.

## Task 1: Add Tested Portfolio Camera Math

**Files:**
- Create: `js/tests/portfolio.test.js`
- Create: `js/portfolio.js`
- Modify: `tests.html`

- [ ] **Step 1: Write the failing portfolio test file**

Create `js/tests/portfolio.test.js` with:

```js
import { assert, assertEqual } from './run.js';
import {
  ROOM_TARGETS,
  computeDefaultCamera,
  computeRoomCamera,
  easeOutCubic,
  mixCamera,
} from '../portfolio.js';

export function runTests() {
  const canvasWidth = 1280;
  const canvasHeight = 720;
  const layout = { cols: 32, rows: 18 };

  assertEqual(ROOM_TARGETS.about, { col: 1, row: 1, cols: 15, rows: 10 }, 'about target uses top-left room bounds');
  assertEqual(ROOM_TARGETS.blogs, { col: 16, row: 1, cols: 16, rows: 10 }, 'blogs target uses top-right room bounds');
  assertEqual(ROOM_TARGETS.projects, { col: 16, row: 11, cols: 16, rows: 7 }, 'projects target uses bottom-right room bounds');

  const defaultCamera = computeDefaultCamera(canvasWidth, canvasHeight, layout);
  assertEqual(defaultCamera, { zoom: 2, offsetX: 128, offsetY: 72 }, 'default camera matches full-layout centered view');

  const aboutCamera = computeRoomCamera(canvasWidth, canvasHeight, layout, ROOM_TARGETS.about);
  assertEqual(aboutCamera, { zoom: 5, offsetX: -40, offsetY: -120 }, 'about camera centers top-left room');

  const blogsCamera = computeRoomCamera(canvasWidth, canvasHeight, layout, ROOM_TARGETS.blogs);
  assertEqual(blogsCamera, { zoom: 5, offsetX: -1280, offsetY: -120 }, 'blogs camera centers top-right room');

  const projectsCamera = computeRoomCamera(canvasWidth, canvasHeight, layout, ROOM_TARGETS.projects);
  assertEqual(projectsCamera, { zoom: 6, offsetX: -1664, offsetY: -1032 }, 'projects camera centers bottom-right room');

  assertEqual(easeOutCubic(0), 0, 'easeOutCubic starts at 0');
  assertEqual(easeOutCubic(1), 1, 'easeOutCubic ends at 1');
  assertEqual(easeOutCubic(0.5), 0.875, 'easeOutCubic curves midpoint toward the target');

  const mixed = mixCamera(
    { zoom: 2, offsetX: 100, offsetY: 50 },
    { zoom: 6, offsetX: -300, offsetY: -150 },
    0.25,
  );
  assertEqual(mixed, { zoom: 3, offsetX: 0, offsetY: 0 }, 'mixCamera interpolates and rounds camera fields');

  const clampedLow = mixCamera(
    { zoom: 2, offsetX: 0, offsetY: 0 },
    { zoom: 4, offsetX: 100, offsetY: 100 },
    -1,
  );
  assertEqual(clampedLow, { zoom: 2, offsetX: 0, offsetY: 0 }, 'mixCamera clamps progress below 0');

  const clampedHigh = mixCamera(
    { zoom: 2, offsetX: 0, offsetY: 0 },
    { zoom: 4, offsetX: 100, offsetY: 100 },
    2,
  );
  assertEqual(clampedHigh, { zoom: 4, offsetX: 100, offsetY: 100 }, 'mixCamera clamps progress above 1');
}
```

- [ ] **Step 2: Register the failing test**

Modify the module imports in `tests.html` so the script imports and runs the portfolio tests:

```html
<script type="module">
  import { getResults } from './js/tests/run.js';
  import { runTests as tileMapTests } from './js/tests/tileMap.test.js';
  import { runTests as characterTests } from './js/tests/character.test.js';
  import { runTests as layoutStoreTests } from './js/tests/layoutStore.test.js';
  import { runTests as githubPublishTests } from './js/tests/githubPublish.test.js';
  import { runTests as portfolioTests } from './js/tests/portfolio.test.js';

  tileMapTests();
  characterTests();
  layoutStoreTests();
  await githubPublishTests();
  portfolioTests();

  const out = document.getElementById('output');
  const results = getResults();
  const passed = results.filter(r => r.pass).length;
  out.innerHTML = `<p>${passed}/${results.length} passed</p>` +
    results.map(r =>
      `<div class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${r.msg}</div>`
    ).join('');
</script>
```

- [ ] **Step 3: Run the test page and verify it fails for the missing module**

Run a local static server:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/tests.html` in the in-app browser.

Expected: the page fails to load the test module because `js/portfolio.js` does not exist yet, or the console reports that the requested portfolio exports are missing.

- [ ] **Step 4: Implement the minimal camera math exports**

Create `js/portfolio.js` with:

```js
import { TILE_SIZE } from './constants.js';
import { computeOffset, computeZoom } from './renderer.js';

export const ROOM_TARGETS = Object.freeze({
  about: Object.freeze({ col: 1, row: 1, cols: 15, rows: 10 }),
  projects: Object.freeze({ col: 16, row: 11, cols: 16, rows: 7 }),
  blogs: Object.freeze({ col: 16, row: 1, cols: 16, rows: 10 }),
});

export function computeDefaultCamera(canvasWidth, canvasHeight, layout) {
  const zoom = computeZoom(canvasWidth, canvasHeight, layout.cols, layout.rows);
  return { zoom, ...computeOffset(canvasWidth, canvasHeight, layout.cols, layout.rows, zoom) };
}

export function computeRoomCamera(canvasWidth, canvasHeight, layout, bounds) {
  const roomWidth = bounds.cols * TILE_SIZE;
  const roomHeight = bounds.rows * TILE_SIZE;
  const defaultCamera = computeDefaultCamera(canvasWidth, canvasHeight, layout);
  const zoom = Math.max(
    defaultCamera.zoom,
    Math.floor(Math.max(canvasWidth / roomWidth, canvasHeight / roomHeight)),
  );
  const centerX = (bounds.col * TILE_SIZE) + (roomWidth / 2);
  const centerY = (bounds.row * TILE_SIZE) + (roomHeight / 2);
  return {
    zoom,
    offsetX: Math.round((canvasWidth / 2) - (centerX * zoom)),
    offsetY: Math.round((canvasHeight / 2) - (centerY * zoom)),
  };
}

export function easeOutCubic(t) {
  const p = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - p, 3);
}

export function mixCamera(from, to, progress) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    zoom: Math.round(from.zoom + ((to.zoom - from.zoom) * p)),
    offsetX: Math.round(from.offsetX + ((to.offsetX - from.offsetX) * p)),
    offsetY: Math.round(from.offsetY + ((to.offsetY - from.offsetY) * p)),
  };
}
```

- [ ] **Step 5: Run tests and verify Task 1 is green**

Refresh `http://localhost:4173/tests.html`.

Expected: all existing tests pass plus the portfolio camera tests. The result count increases by 13 assertions.

- [ ] **Step 6: Commit Task 1**

```bash
git add js/portfolio.js js/tests/portfolio.test.js tests.html
git commit -m "Add portfolio camera math tests"
```

## Task 2: Add Optional Camera Support To The Renderer

**Files:**
- Modify: `js/renderer.js`

- [ ] **Step 1: Update `renderFrame` to accept the optional camera**

Change the function signature and the initial zoom/offset calculation in `js/renderer.js`:

```js
export function renderFrame(ctx, layout, furnitureInstances, character, charImg, zoom, floorImgs = null, camera = null) {
  const { cols, rows, tileMap } = layout;
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const activeZoom = camera?.zoom ?? zoom;
  const { offsetX, offsetY } = camera ?? computeOffset(cw, ch, cols, rows, activeZoom);
  const s = TILE_SIZE * activeZoom;
```

Then replace the existing `zoom` references inside `renderFrame` that scale draw positions or sprite sizes with `activeZoom`:

```js
const fw = Math.round(f.variant.w * activeZoom);
const fh = Math.round(f.variant.h * activeZoom);
const footprintPxW = f.variant.footprintW * TILE_SIZE * activeZoom;
const footprintPxH = f.variant.footprintH * TILE_SIZE * activeZoom;
const drawX = Math.round(offsetX + character.x * activeZoom - (16 * activeZoom) / 2);
const drawY = Math.round(offsetY + character.y * activeZoom - 32 * activeZoom);
const czoom = activeZoom;
```

- [ ] **Step 2: Run tests and verify renderer changes did not break imports**

Refresh `http://localhost:4173/tests.html`.

Expected: all tests pass with no console import errors.

- [ ] **Step 3: Commit Task 2**

```bash
git add js/renderer.js
git commit -m "Support optional scene camera"
```

## Task 3: Add Portfolio Overlay HTML And CSS

**Files:**
- Modify: `index.html`
- Modify: `css/main.css`

- [ ] **Step 1: Add the overlay shell to `index.html`**

Replace the body contents with:

```html
<body>
  <canvas id="scene"></canvas>

  <div class="portfolio-shell" id="portfolio-shell">
    <header class="portfolio-nav" aria-label="Portfolio navigation">
      <div class="portfolio-logo" aria-label="Allen Wu">ALLEN WU</div>
      <nav class="portfolio-tabs" aria-label="Portfolio sections">
        <button class="portfolio-tab" type="button" data-portfolio-tab="about">About</button>
        <button class="portfolio-tab" type="button" data-portfolio-tab="projects">Projects</button>
        <button class="portfolio-tab" type="button" data-portfolio-tab="blogs">Blogs</button>
      </nav>
    </header>

    <div class="portfolio-dim" id="portfolio-dim" aria-hidden="true"></div>

    <section class="portfolio-modal" id="portfolio-modal" role="dialog" aria-modal="true" aria-labelledby="portfolio-modal-title" hidden>
      <button class="portfolio-close" id="portfolio-close" type="button" aria-label="Close portfolio section">&#10005;</button>
      <div class="portfolio-content" id="portfolio-content"></div>
    </section>
  </div>

  <script type="module" src="js/sceneMain.js"></script>
</body>
```

- [ ] **Step 2: Replace `css/main.css` with the complete overlay styling**

Use:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink: #f4f0e2;
  --muted: #aeb8c9;
  --panel: rgba(14, 18, 30, 0.94);
  --panel-soft: rgba(14, 18, 30, 0.72);
  --line: rgba(244, 240, 226, 0.32);
  --accent: #f6d36b;
  --accent-2: #78d5c7;
  --shadow: rgba(0, 0, 0, 0.46);
}

body {
  background: #1a1a2e;
  color: var(--ink);
  font-family: "Courier New", Courier, monospace;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

a { color: inherit; }

#scene {
  display: block;
  width: 100vw;
  height: 100vh;
}

.portfolio-shell {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.portfolio-nav {
  position: absolute;
  top: clamp(14px, 3vw, 28px);
  left: clamp(14px, 3vw, 32px);
  right: clamp(14px, 3vw, 32px);
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto minmax(120px, 1fr);
  align-items: center;
  gap: 16px;
  pointer-events: none;
  z-index: 3;
}

.portfolio-logo {
  color: var(--ink);
  font-size: clamp(1rem, 2.2vw, 1.6rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  text-shadow: 2px 2px 0 #101421;
}

.portfolio-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px;
  background: var(--panel-soft);
  border: 1px solid var(--line);
  box-shadow: 4px 4px 0 var(--shadow);
  pointer-events: auto;
}

.portfolio-tab,
.portfolio-close {
  color: var(--ink);
  font: inherit;
  line-height: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(244, 240, 226, 0.24);
  cursor: pointer;
}

.portfolio-tab {
  min-width: 88px;
  min-height: 34px;
  padding: 0 14px;
}

.portfolio-tab:hover,
.portfolio-tab:focus-visible,
.portfolio-tab.is-active {
  color: #111827;
  background: var(--accent);
  border-color: var(--accent);
  outline: none;
}

.portfolio-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 220ms ease;
  pointer-events: none;
  z-index: 1;
}

.portfolio-dim.is-visible {
  opacity: 1;
}

.portfolio-modal {
  position: absolute;
  left: 50%;
  top: 54%;
  width: min(680px, calc(100vw - 32px));
  max-height: min(72vh, 680px);
  overflow: auto;
  transform: translate(-50%, -50%) scale(0.98);
  opacity: 0;
  padding: clamp(22px, 4vw, 34px);
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: 8px 8px 0 var(--shadow);
  pointer-events: auto;
  transition: opacity 220ms ease, transform 220ms ease;
  z-index: 2;
}

.portfolio-modal.is-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.portfolio-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
}

.portfolio-close:hover,
.portfolio-close:focus-visible {
  color: #111827;
  background: var(--accent);
  outline: none;
}

.portfolio-content {
  display: grid;
  gap: 18px;
}

.portfolio-content h1 {
  max-width: calc(100% - 42px);
  color: var(--ink);
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  letter-spacing: 0;
  line-height: 1;
}

.portfolio-content p,
.portfolio-content li {
  color: var(--muted);
  font-size: clamp(0.9rem, 2vw, 1rem);
  line-height: 1.55;
}

.portfolio-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
}

.portfolio-skills li,
.portfolio-card,
.portfolio-post {
  border: 1px solid rgba(244, 240, 226, 0.18);
  background: rgba(255, 255, 255, 0.05);
}

.portfolio-skills li {
  padding: 7px 10px;
  color: var(--ink);
}

.portfolio-list {
  display: grid;
  gap: 12px;
}

.portfolio-card,
.portfolio-post {
  display: grid;
  gap: 8px;
  padding: 14px;
}

.portfolio-card h2,
.portfolio-post h2 {
  color: var(--ink);
  font-size: 1.05rem;
  letter-spacing: 0;
}

.portfolio-card a {
  width: max-content;
  color: var(--accent-2);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}

.portfolio-date {
  color: var(--accent);
  font-size: 0.82rem;
}

@media (max-width: 680px) {
  .portfolio-nav {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 10px;
  }

  .portfolio-tabs {
    width: 100%;
    justify-content: stretch;
  }

  .portfolio-tab {
    min-width: 0;
    flex: 1;
    padding: 0 8px;
  }

  .portfolio-modal {
    top: 56%;
    max-height: 68vh;
  }
}
```

- [ ] **Step 3: Verify overlay markup is present without script errors**

Refresh `http://localhost:4173/index.html`.

Expected: the canvas still renders, `ALLEN WU` appears top-left, the three tabs appear top-center on the same nav row on desktop, and no modal is visible before interaction.

- [ ] **Step 4: Commit Task 3**

```bash
git add index.html css/main.css
git commit -m "Add portfolio overlay markup"
```

## Task 4: Add Portfolio DOM Behavior And Scene Integration

**Files:**
- Modify: `js/portfolio.js`
- Modify: `js/sceneMain.js`

- [ ] **Step 1: Extend `js/portfolio.js` with content and `initPortfolio()`**

Append the following below the camera math exports:

```js
const CAMERA_DURATION_MS = 650;
const MODAL_SHOW_DELAY_MS = 140;

const SECTION_CONTENT = Object.freeze({
  about: {
    title: 'About',
    html: `
      <h1 id="portfolio-modal-title">About</h1>
      <p>Allen Wu is a builder who likes careful systems, playful interfaces, and software that feels pleasant to use. This is temporary copy for the portfolio introduction.</p>
      <ul class="portfolio-skills" aria-label="Skills">
        <li>JavaScript</li>
        <li>UI Engineering</li>
        <li>Product Design</li>
        <li>Creative Tools</li>
      </ul>
    `,
  },
  projects: {
    title: 'Projects',
    html: `
      <h1 id="portfolio-modal-title">Projects</h1>
      <div class="portfolio-list">
        <article class="portfolio-card">
          <h2>Pixel Office</h2>
          <p>A tiny interactive office scene with custom furniture, tile editing, and a wandering character.</p>
          <a href="#" aria-label="Open Pixel Office project">View project</a>
        </article>
        <article class="portfolio-card">
          <h2>Interface Lab</h2>
          <p>Experiments in practical tools, motion, and compact information design.</p>
          <a href="#" aria-label="Open Interface Lab project">View project</a>
        </article>
        <article class="portfolio-card">
          <h2>Writing Systems</h2>
          <p>Notes and prototypes around personal knowledge workflows and publishing.</p>
          <a href="#" aria-label="Open Writing Systems project">View project</a>
        </article>
      </div>
    `,
  },
  blogs: {
    title: 'Blogs',
    html: `
      <h1 id="portfolio-modal-title">Blogs</h1>
      <div class="portfolio-list">
        <article class="portfolio-post">
          <p class="portfolio-date">May 2026</p>
          <h2>Designing Small Worlds</h2>
          <p>Notes on making portfolio interfaces feel personal without making them hard to navigate.</p>
        </article>
        <article class="portfolio-post">
          <p class="portfolio-date">April 2026</p>
          <h2>Tools With Texture</h2>
          <p>A short reflection on software that keeps its utility while gaining a little personality.</p>
        </article>
        <article class="portfolio-post">
          <p class="portfolio-date">March 2026</p>
          <h2>Working In Public Drafts</h2>
          <p>How lightweight writing habits can make projects easier to revisit.</p>
        </article>
      </div>
    `,
  },
});

export function initPortfolio({ canvas, getLayout }) {
  const tabs = Array.from(document.querySelectorAll('[data-portfolio-tab]'));
  const dim = document.getElementById('portfolio-dim');
  const modal = document.getElementById('portfolio-modal');
  const close = document.getElementById('portfolio-close');
  const content = document.getElementById('portfolio-content');

  let activeSection = null;
  let transition = null;
  let modalTimer = 0;

  function layoutInfo() {
    const layout = getLayout();
    return { cols: layout.cols, rows: layout.rows };
  }

  function cameraForSection(section) {
    return computeRoomCamera(canvas.width, canvas.height, layoutInfo(), ROOM_TARGETS[section]);
  }

  function defaultCamera() {
    return computeDefaultCamera(canvas.width, canvas.height, layoutInfo());
  }

  function currentCamera(now = performance.now()) {
    if (!transition) return activeSection ? cameraForSection(activeSection) : null;
    const elapsed = now - transition.startedAt;
    const progress = easeOutCubic(elapsed / CAMERA_DURATION_MS);
    const camera = mixCamera(transition.from, transition.to, progress);
    if (elapsed >= CAMERA_DURATION_MS) {
      activeSection = transition.finalSection;
      transition = null;
      return activeSection ? cameraForSection(activeSection) : null;
    }
    return camera;
  }

  function setActiveTab(section) {
    for (const tab of tabs) {
      const isActive = tab.dataset.portfolioTab === section;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    }
  }

  function showModal(section) {
    const entry = SECTION_CONTENT[section];
    content.innerHTML = entry.html;
    modal.hidden = false;
    modal.setAttribute('aria-label', entry.title);
    requestAnimationFrame(() => modal.classList.add('is-visible'));
  }

  function openSection(section) {
    window.clearTimeout(modalTimer);
    const from = currentCamera() ?? defaultCamera();
    const to = cameraForSection(section);
    activeSection = section;
    transition = { from, to, startedAt: performance.now(), finalSection: section };
    setActiveTab(section);
    dim.classList.add('is-visible');
    modal.classList.remove('is-visible');
    modal.hidden = true;
    modalTimer = window.setTimeout(() => showModal(section), MODAL_SHOW_DELAY_MS);
  }

  function closeSection() {
    window.clearTimeout(modalTimer);
    const from = currentCamera() ?? defaultCamera();
    const to = defaultCamera();
    activeSection = null;
    transition = { from, to, startedAt: performance.now(), finalSection: null };
    setActiveTab(null);
    dim.classList.remove('is-visible');
    modal.classList.remove('is-visible');
    window.setTimeout(() => { modal.hidden = true; }, 220);
  }

  for (const tab of tabs) {
    tab.setAttribute('aria-pressed', 'false');
    tab.addEventListener('click', () => openSection(tab.dataset.portfolioTab));
  }
  close.addEventListener('click', closeSection);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (activeSection || transition)) closeSection();
  });

  return {
    getCamera: () => currentCamera(),
    close: closeSection,
  };
}
```

- [ ] **Step 2: Integrate `initPortfolio()` in `js/sceneMain.js`**

Add the import:

```js
import { initPortfolio } from './portfolio.js';
```

After the character is created, initialize the portfolio controller:

```js
const portfolio = initPortfolio({
  canvas,
  getLayout: () => layout,
});
```

Update the render callback:

```js
render: (ctx) => renderFrame(
  ctx,
  { cols: layout.cols, rows: layout.rows, tileMap },
  furnitureInstances,
  character,
  charImg,
  zoom,
  floorImgs,
  portfolio.getCamera(),
),
```

- [ ] **Step 3: Verify tab behavior manually**

Refresh `http://localhost:4173/index.html`.

Expected:
- Clicking `About` pans and zooms toward the top-left room, dims the canvas, and opens the About modal.
- Clicking `Blogs` pans and zooms toward the top-right room and swaps to Blogs content.
- Clicking `Projects` pans and zooms toward the bottom-right room and swaps to Projects content.
- The nav remains visible and aligned as one top row on desktop while modals are open.
- Clicking the close button or pressing Escape fades the dim layer, hides the modal, and returns to the default full-layout camera.

- [ ] **Step 4: Run tests after integration**

Refresh `http://localhost:4173/tests.html`.

Expected: all tests pass, including the portfolio camera tests.

- [ ] **Step 5: Commit Task 4**

```bash
git add js/portfolio.js js/sceneMain.js
git commit -m "Wire portfolio overlay interactions"
```

## Task 5: Final Responsive Verification

**Files:**
- Modify only if verification reveals a concrete issue.

- [ ] **Step 1: Check desktop viewport**

Open `http://localhost:4173/index.html` at the browser's default desktop viewport.

Expected:
- Logo is top-left.
- Tabs are centered on the same row.
- The canvas remains pixel sharp.
- No text overlaps inside the nav or modal.

- [ ] **Step 2: Check mobile-width behavior**

Use the in-app browser viewport controls or narrow the viewport to about `390px` wide.

Expected:
- Logo remains visible.
- Tabs wrap into the second row only on narrow screens where a single row would collide.
- Modal fits within the viewport and scrolls internally if content is taller than available space.

- [ ] **Step 3: Run final tests**

Refresh `http://localhost:4173/tests.html`.

Expected: all tests pass.

- [ ] **Step 4: Review the diff**

```bash
git diff --stat
git diff -- index.html css/main.css js/portfolio.js js/sceneMain.js js/renderer.js tests.html js/tests/portfolio.test.js
```

Expected: changes are limited to the planned feature files and no unrelated edits are present.

- [ ] **Step 5: Commit responsive fixes only if any were needed**

If Step 1 or Step 2 required edits, commit those edits:

```bash
git add index.html css/main.css js/portfolio.js js/sceneMain.js js/renderer.js tests.html js/tests/portfolio.test.js
git commit -m "Polish portfolio overlay responsiveness"
```
