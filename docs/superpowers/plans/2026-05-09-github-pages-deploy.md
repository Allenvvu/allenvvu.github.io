# GitHub Pages Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the Pixel Office scene viewer to allenvvu.github.io with the admin link removed.

**Architecture:** Single code edit to index.html, then merge the current feature branch into main and push. GitHub Pages serves main branch root automatically — no build step or CI needed.

**Tech Stack:** Vanilla HTML, Git, GitHub Pages

---

### Task 1: Remove admin link from index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Open index.html and locate the admin link**

The file currently contains this line inside `<body>`:

```html
<a id="admin-link" href="admin.html">admin →</a>
```

Remove that line entirely. The resulting `<body>` should look like:

```html
<body>
  <canvas id="scene"></canvas>
  <script type="module" src="js/sceneMain.js"></script>
</body>
```

- [ ] **Step 2: Verify in browser**

Open `index.html` locally. Confirm:
- No "admin →" link visible anywhere on the page
- Scene loads and renders correctly (canvas animates, character wanders)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore: remove admin link from public scene page"
```

---

### Task 2: Merge into main and push

**Files:** No file changes — git operations only.

- [ ] **Step 1: Switch to main and merge**

```bash
git checkout main
git merge retrace/admin-local
```

Expected: fast-forward or merge commit with no conflicts. All commits from `retrace/admin-local` (furniture features + deploy prep) are now on `main`.

- [ ] **Step 2: Verify the merged state**

```bash
git log --oneline -6
```

Expected: the top commits should include `chore: remove admin link from public scene page` and the recent furniture feature commits.

Also confirm `index.html` on `main` has no admin link:

```bash
grep "admin-link" index.html
```

Expected: no output.

- [ ] **Step 3: Push main to origin**

```bash
git push origin main
```

Expected: push succeeds. GitHub Pages will rebuild automatically within ~60 seconds.

- [ ] **Step 4: Confirm live site**

Visit `https://allenvvu.github.io/` and verify:
- Scene canvas renders
- No admin link visible
- Character animates
