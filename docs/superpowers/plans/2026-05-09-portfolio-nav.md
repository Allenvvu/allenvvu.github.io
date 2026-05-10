# Portfolio Nav Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a glassmorphism nav bar to all pages and create plain stub pages for About, Projects, and Blog.

**Architecture:** Inline copy-paste approach — nav HTML is duplicated into each of 4 HTML files; all nav styles live in a single new `css/nav.css` file. New pages are minimal HTML documents with the dark body background and nav only.

**Tech Stack:** Vanilla HTML/CSS, no JS, no bundler.

---

## File Map

| File | Action |
|---|---|
| `css/nav.css` | Create — all nav styles |
| `index.html` | Modify — add `<link>` + `<nav>` before `<canvas>` |
| `about.html` | Create — plain HTML stub with nav |
| `projects.html` | Create — plain HTML stub with nav |
| `blog.html` | Create — plain HTML stub with nav |
| `.gitignore` | Modify — add `.superpowers/` |

---

### Task 1: Create `css/nav.css`

**Files:**
- Create: `css/nav.css`

- [ ] **Step 1: Create the file with all nav styles**

```css
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.nav-brand {
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-decoration: none;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 32px;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.7);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.15s;
}

.nav-links a:hover {
  color: #fff;
}

.nav-links a.active {
  color: #fff;
  border-bottom: 2px solid rgba(255, 255, 255, 0.8);
  padding-bottom: 2px;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/nav.css
git commit -m "feat: add glassmorphism nav styles"
```

---

### Task 2: Add nav to `index.html`

**Files:**
- Modify: `index.html`

The current file looks like this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel Office</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <canvas id="scene"></canvas>
  <script type="module" src="js/sceneMain.js"></script>
</body>
</html>
```

- [ ] **Step 1: Add nav stylesheet link and nav element**

Replace the entire file with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel Office</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/nav.css">
</head>
<body>
  <nav class="site-nav">
    <a class="nav-brand" href="index.html">ALLEN WU</a>
    <ul class="nav-links">
      <li><a href="about.html">About</a></li>
      <li><a href="projects.html">Projects</a></li>
      <li><a href="blog.html">Blog</a></li>
    </ul>
  </nav>
  <canvas id="scene"></canvas>
  <script type="module" src="js/sceneMain.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open `index.html` in a browser and verify**

Check:
- Pixel-art scene still runs full-screen with animated character
- Nav bar appears at top, fixed, overlaying the scene
- "ALLEN WU" is white and bold on the left
- "About", "Projects", "Blog" are dimmed white on the right
- Nav has a subtle frosted glass look (semi-transparent, blurred)
- No layout shift or broken canvas

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add nav bar to index.html"
```

---

### Task 3: Create `about.html`

**Files:**
- Create: `about.html`

- [ ] **Step 1: Create the file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About — Allen Wu</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/nav.css">
</head>
<body>
  <nav class="site-nav">
    <a class="nav-brand" href="index.html">ALLEN WU</a>
    <ul class="nav-links">
      <li><a href="about.html" class="active">About</a></li>
      <li><a href="projects.html">Projects</a></li>
      <li><a href="blog.html">Blog</a></li>
    </ul>
  </nav>
</body>
</html>
```

- [ ] **Step 2: Open `about.html` in a browser and verify**

Check:
- Dark `#1a1a2e` background (from `css/main.css`)
- Nav bar appears at top with glassmorphism style
- "About" link is bright white with bottom underline (active state)
- Other links are dimmed
- Page is otherwise blank

- [ ] **Step 3: Commit**

```bash
git add about.html
git commit -m "feat: add about.html stub"
```

---

### Task 4: Create `projects.html`

**Files:**
- Create: `projects.html`

- [ ] **Step 1: Create the file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Projects — Allen Wu</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/nav.css">
</head>
<body>
  <nav class="site-nav">
    <a class="nav-brand" href="index.html">ALLEN WU</a>
    <ul class="nav-links">
      <li><a href="about.html">About</a></li>
      <li><a href="projects.html" class="active">Projects</a></li>
      <li><a href="blog.html">Blog</a></li>
    </ul>
  </nav>
</body>
</html>
```

- [ ] **Step 2: Open `projects.html` in a browser and verify**

Check:
- Dark background, nav bar present
- "Projects" link is active (white + underline)
- Page is otherwise blank

- [ ] **Step 3: Commit**

```bash
git add projects.html
git commit -m "feat: add projects.html stub"
```

---

### Task 5: Create `blog.html`

**Files:**
- Create: `blog.html`

- [ ] **Step 1: Create the file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blog — Allen Wu</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/nav.css">
</head>
<body>
  <nav class="site-nav">
    <a class="nav-brand" href="index.html">ALLEN WU</a>
    <ul class="nav-links">
      <li><a href="about.html">About</a></li>
      <li><a href="projects.html">Projects</a></li>
      <li><a href="blog.html" class="active">Blog</a></li>
    </ul>
  </nav>
</body>
</html>
```

- [ ] **Step 2: Open `blog.html` in a browser and verify**

Check:
- Dark background, nav bar present
- "Blog" link is active (white + underline)
- Page is otherwise blank

- [ ] **Step 3: Commit**

```bash
git add blog.html
git commit -m "feat: add blog.html stub"
```

---

### Task 6: Update `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `.superpowers/` to `.gitignore`**

Append to the existing `.gitignore`:

```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers/ brainstorm artifacts"
```

---

## Verification Checklist

After all tasks complete, do a final pass:

- [ ] Navigate index.html → click "About" → lands on about.html, "About" is active
- [ ] Navigate about.html → click "Projects" → lands on projects.html, "Projects" is active
- [ ] Navigate projects.html → click "Blog" → lands on blog.html, "Blog" is active
- [ ] Navigate blog.html → click "ALLEN WU" → lands on index.html, no link is active
- [ ] On index.html: pixel scene still animates, nav overlays it without breaking layout
- [ ] On all pages: nav is visually consistent (same height, same glass effect)
- [ ] Hover a nav link: it becomes white
