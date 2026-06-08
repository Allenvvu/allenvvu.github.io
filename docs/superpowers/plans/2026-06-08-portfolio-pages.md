# Portfolio Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal two-page GitHub Pages portfolio site for Allen Wu with a home page, projects page, and shared styling inspired by `https://benjmann.net/`.

**Architecture:** The site uses plain static files served directly by GitHub Pages. `index.html` and `projects.html` own page content, `styles.css` owns the shared visual system, and `scripts/check-site.mjs` provides local smoke checks for required text, links, classes, and responsive CSS.

**Tech Stack:** HTML, CSS, Node.js standard library for local validation, GitHub Pages static hosting.

---

## File Structure

- Create `scripts/check-site.mjs`: Node smoke checker with targeted modes: `home`, `projects`, `styles`, and `all`.
- Create `index.html`: home page with dummy portrait block, Allen's name/tagline, LinkedIn/Projects/GitHub navigation, dummy quote, and dummy bio paragraphs.
- Create `projects.html`: projects page with matching layout, navigation, and three dummy project entries.
- Create `styles.css`: shared responsive typography, spacing, links, portrait block, quote, bio, and project-list styling.

---

### Task 1: Static Smoke Checker

**Files:**
- Create: `scripts/check-site.mjs`

- [ ] **Step 1: Write the failing smoke checker**

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const linkedinUrl = "https://www.linkedin.com/in/allen-w-307451229/";
const githubUrl = "https://github.com/Allenvvu";

function readRequired(fileName) {
  const filePath = join(root, fileName);
  assert.ok(existsSync(filePath), `Missing required file: ${fileName}`);
  return readFileSync(filePath, "utf8");
}

function assertIncludes(content, expected, label) {
  assert.ok(content.includes(expected), `${label} missing: ${expected}`);
}

const checks = {
  home() {
    const html = readRequired("index.html");

    assertIncludes(html, "<title>Allen Wu</title>", "home title");
    assertIncludes(html, '<link rel="stylesheet" href="styles.css">', "home stylesheet");
    assertIncludes(html, '<div class="portrait-placeholder"', "portrait dummy block");
    assertIncludes(html, '<h1 class="name">Allen Wu</h1>', "home name");
    assertIncludes(
      html,
      '<p class="tagline">Engineer, builder, artist, lifelong learner.</p>',
      "home tagline"
    );
    assertIncludes(html, `href="${linkedinUrl}"`, "home LinkedIn link");
    assertIncludes(html, 'href="projects.html"', "home Projects link");
    assertIncludes(html, `href="${githubUrl}"`, "home GitHub link");
    assertIncludes(html, '<blockquote class="quote">', "home quote block");
    assertIncludes(html, '<section class="bio"', "home bio section");
  },

  projects() {
    const html = readRequired("projects.html");

    assertIncludes(html, "<title>Projects | Allen Wu</title>", "projects title");
    assertIncludes(html, '<link rel="stylesheet" href="styles.css">', "projects stylesheet");
    assertIncludes(html, '<h1 class="name">Projects</h1>', "projects heading");
    assertIncludes(html, 'href="index.html"', "projects Home link");
    assertIncludes(html, `href="${linkedinUrl}"`, "projects LinkedIn link");
    assertIncludes(html, `href="${githubUrl}"`, "projects GitHub link");
    assertIncludes(html, '<section class="project-list"', "projects list");
    assertIncludes(html, "Project One", "first dummy project");
    assertIncludes(html, "Project Two", "second dummy project");
    assertIncludes(html, "Project Three", "third dummy project");
  },

  styles() {
    const css = readRequired("styles.css");

    for (const selector of [
      ".app-container",
      ".hero-section",
      ".portrait-placeholder",
      ".name",
      ".tagline",
      ".social-links",
      ".quote",
      ".bio",
      ".project-list",
      ".project-item",
    ]) {
      assertIncludes(css, selector, `CSS selector ${selector}`);
    }

    assert.match(css, /@media \(max-width: 768px\)/, "mobile media query");
    assertIncludes(css, "letter-spacing: 0;", "non-negative letter spacing");
  },
};

const mode = process.argv[2] ?? "all";

if (mode === "all") {
  checks.home();
  checks.projects();
  checks.styles();
} else if (checks[mode]) {
  checks[mode]();
} else {
  throw new Error(`Unknown check mode: ${mode}`);
}

console.log(`Static site smoke check passed: ${mode}`);
```

- [ ] **Step 2: Verify the checker currently fails against the missing home page**

Run: `node scripts/check-site.mjs home`

Expected: FAIL with `Missing required file: index.html`.

- [ ] **Step 3: Verify the checker has valid JavaScript syntax**

Run: `node --check scripts/check-site.mjs`

Expected: PASS with no output.

- [ ] **Step 4: Commit the checker**

```bash
git add scripts/check-site.mjs
git commit -m "Add static site smoke checker"
```

---

### Task 2: Home Page

**Files:**
- Create: `index.html`
- Test: `scripts/check-site.mjs`

- [ ] **Step 1: Run the targeted home check before implementation**

Run: `node scripts/check-site.mjs home`

Expected: FAIL with `Missing required file: index.html`.

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta
      name="description"
      content="Allen Wu - engineer, builder, artist, lifelong learner."
    >
    <title>Allen Wu</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div class="app-container">
      <header class="hero-section">
        <div class="portrait-placeholder" aria-label="Portrait placeholder">AW</div>
        <h1 class="name">Allen Wu</h1>
        <p class="tagline">Engineer, builder, artist, lifelong learner.</p>
        <nav class="social-links" aria-label="Primary links">
          <a
            class="social-link"
            href="https://www.linkedin.com/in/allen-w-307451229/"
          >LinkedIn</a>
          <span class="separator" aria-hidden="true">&middot;</span>
          <a class="social-link" href="projects.html">Projects</a>
          <span class="separator" aria-hidden="true">&middot;</span>
          <a class="social-link" href="https://github.com/Allenvvu">GitHub</a>
        </nav>
      </header>

      <main class="content-section">
        <blockquote class="quote">
          <p class="quote-text">"Replace this with a quote that keeps you moving."</p>
          <cite class="quote-author">- Future Allen</cite>
        </blockquote>

        <section class="bio" aria-label="About Allen">
          <p>
            This space will become a short introduction about who I am, what I
            care about, and what kind of work I want to keep building.
          </p>
          <p>
            I will use this paragraph to describe my engineering interests,
            creative practice, and the ideas I am currently exploring.
          </p>
          <p class="cta">
            I will use this closing line to point visitors toward the work,
            writing, or collaborations I want them to notice first.
          </p>
        </section>
      </main>
    </div>
  </body>
</html>
```

- [ ] **Step 3: Run the targeted home check**

Run: `node scripts/check-site.mjs home`

Expected: PASS with `Static site smoke check passed: home`.

- [ ] **Step 4: Commit the home page**

```bash
git add index.html
git commit -m "Add portfolio home page"
```

---

### Task 3: Projects Page

**Files:**
- Create: `projects.html`
- Test: `scripts/check-site.mjs`

- [ ] **Step 1: Run the targeted projects check before implementation**

Run: `node scripts/check-site.mjs projects`

Expected: FAIL with `Missing required file: projects.html`.

- [ ] **Step 2: Create `projects.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta
      name="description"
      content="Selected projects and experiments by Allen Wu."
    >
    <title>Projects | Allen Wu</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div class="app-container">
      <header class="hero-section">
        <h1 class="name">Projects</h1>
        <p class="tagline">A small index of things I am building, studying, and shaping.</p>
        <nav class="social-links" aria-label="Project page links">
          <a class="social-link" href="index.html">Home</a>
          <span class="separator" aria-hidden="true">&middot;</span>
          <a
            class="social-link"
            href="https://www.linkedin.com/in/allen-w-307451229/"
          >LinkedIn</a>
          <span class="separator" aria-hidden="true">&middot;</span>
          <a class="social-link" href="https://github.com/Allenvvu">GitHub</a>
        </nav>
      </header>

      <main class="content-section">
        <section class="project-list" aria-label="Project placeholders">
          <article class="project-item">
            <h2>Project One</h2>
            <p>
              Replace this with a concise description of a project, what it does,
              and why it matters.
            </p>
            <span class="project-status">Link coming soon</span>
          </article>

          <article class="project-item">
            <h2>Project Two</h2>
            <p>
              Replace this with a second project summary, including the tools,
              ideas, or outcomes worth highlighting.
            </p>
            <span class="project-status">Details coming soon</span>
          </article>

          <article class="project-item">
            <h2>Project Three</h2>
            <p>
              Replace this with another project entry once the portfolio content
              is ready.
            </p>
            <span class="project-status">Repository coming soon</span>
          </article>
        </section>
      </main>
    </div>
  </body>
</html>
```

- [ ] **Step 3: Run the targeted projects check**

Run: `node scripts/check-site.mjs projects`

Expected: PASS with `Static site smoke check passed: projects`.

- [ ] **Step 4: Commit the projects page**

```bash
git add projects.html
git commit -m "Add projects page"
```

---

### Task 4: Shared Styles

**Files:**
- Create: `styles.css`
- Test: `scripts/check-site.mjs`

- [ ] **Step 1: Run the targeted styles check before implementation**

Run: `node scripts/check-site.mjs styles`

Expected: FAIL with `Missing required file: styles.css`.

- [ ] **Step 2: Create `styles.css`**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  background: #fff;
  color: #2d3748;
  font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 80px 20px;
}

.hero-section {
  margin-bottom: 60px;
  text-align: center;
}

.portrait-placeholder {
  display: inline-flex;
  width: 140px;
  height: 140px;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0;
}

.name {
  margin-bottom: 12px;
  color: #1a202c;
  font-size: 2.8rem;
  font-weight: 700;
  letter-spacing: 0;
}

.tagline {
  max-width: 560px;
  margin: 0 auto 35px;
  color: #64748b;
  font-size: 1.15rem;
  font-weight: 400;
  line-height: 1.6;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.05rem;
}

.social-link,
.text-link {
  color: #0969da;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.social-link {
  padding: 6px 10px;
}

.social-link:hover,
.text-link:hover {
  color: #0860d0;
  text-decoration: underline;
}

.separator {
  color: #94a3b8;
  padding: 0 4px;
}

.content-section {
  max-width: 650px;
  margin: 0 auto;
}

.quote {
  position: relative;
  margin: 60px 0 50px;
  padding: 0 0 0 24px;
  border-left: 3px solid #e2e8f0;
}

.quote-text {
  margin-bottom: 12px;
  color: #475569;
  font-size: 1.35rem;
  font-style: italic;
  font-weight: 300;
  line-height: 1.7;
}

.quote-author {
  display: block;
  color: #94a3b8;
  font-size: 0.95rem;
  font-weight: 400;
}

.bio {
  color: #334155;
  font-size: 1.08rem;
  font-weight: 400;
  line-height: 1.85;
}

.bio p {
  margin-bottom: 24px;
}

.cta {
  margin-top: 32px;
}

.project-list {
  display: grid;
  gap: 0;
}

.project-item {
  min-height: 128px;
  padding: 28px 0;
  border-top: 1px solid #e2e8f0;
}

.project-item:last-child {
  border-bottom: 1px solid #e2e8f0;
}

.project-item h2 {
  margin-bottom: 10px;
  color: #1a202c;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0;
}

.project-item p {
  margin-bottom: 12px;
  color: #334155;
  font-size: 1.02rem;
  line-height: 1.75;
}

.project-status {
  color: #94a3b8;
  font-size: 0.95rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .app-container {
    padding: 50px 20px;
  }

  .hero-section {
    margin-bottom: 48px;
  }

  .portrait-placeholder {
    width: 120px;
    height: 120px;
    font-size: 1.5rem;
  }

  .name {
    font-size: 2.2rem;
  }

  .tagline {
    font-size: 1.02rem;
  }

  .quote-text {
    font-size: 1.2rem;
  }

  .bio {
    font-size: 1.02rem;
  }

  .project-item {
    min-height: 112px;
    padding: 24px 0;
  }
}
```

- [ ] **Step 3: Run the targeted styles check**

Run: `node scripts/check-site.mjs styles`

Expected: PASS with `Static site smoke check passed: styles`.

- [ ] **Step 4: Run the full smoke check**

Run: `node scripts/check-site.mjs all`

Expected: PASS with `Static site smoke check passed: all`.

- [ ] **Step 5: Commit the shared styles**

```bash
git add styles.css
git commit -m "Add shared portfolio styles"
```

---

### Task 5: Local Browser Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Start a local static server**

Run: `python3 -m http.server 8000`

Expected: server starts and serves from `/Users/jukermacmini/Documents/portfolio-site`.

- [ ] **Step 2: Open and inspect the home page**

Open: `http://localhost:8000/`

Expected:
- Dummy circular `AW` block appears above `Allen Wu`.
- Tagline reads `Engineer, builder, artist, lifelong learner.`
- Link row reads `LinkedIn`, `Projects`, `GitHub`.
- Quote and bio dummy text are visible.
- No text overlaps at desktop width.

- [ ] **Step 3: Open and inspect the projects page**

Open: `http://localhost:8000/projects.html`

Expected:
- Page title reads `Projects`.
- Navigation includes `Home`, `LinkedIn`, `GitHub`.
- Three dummy project entries are visible.
- No text overlaps at desktop width.

- [ ] **Step 4: Inspect mobile width**

Use the browser responsive viewport or resize to roughly 390px wide.

Expected:
- Link rows wrap cleanly if needed.
- Name, tagline, quote, and project entries fit without overlap.
- The dummy portrait remains circular.

- [ ] **Step 5: Stop the local server**

Stop the server with `Ctrl-C`.

- [ ] **Step 6: Confirm repository status**

Run: `git status -sb`

Expected: clean working tree on `main`, ahead of `origin/main` by the local implementation commits until pushed.

---

### Task 6: Publish to GitHub Pages

**Files:**
- No code changes expected.

- [ ] **Step 1: Confirm the local branch is ready to publish**

Run: `git status -sb`

Expected: clean working tree on `main`, ahead of `origin/main`.

- [ ] **Step 2: Push the completed site**

Run: `git push origin main`

Expected: PASS with `main -> main` or `Everything up-to-date`.

- [ ] **Step 3: Check the GitHub Pages URL after propagation**

Open: `https://allenvvu.github.io/`

Expected:
- The home page shows `Allen Wu`.
- The `Projects` link opens `https://allenvvu.github.io/projects.html`.
- The `LinkedIn` and `GitHub` links point to Allen's accounts.
