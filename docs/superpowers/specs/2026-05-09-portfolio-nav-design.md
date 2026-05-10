# Portfolio Nav Bar — Design Spec
**Date:** 2026-05-09  
**Status:** Approved

## Goal

Add a persistent glassmorphism nav bar to all pages of the Pixel Office site, turning it into a personal portfolio for Allen Wu. Create stub pages for About, Projects, and Blog.

## Constraints

- Vanilla HTML/CSS only — no bundler, no npm, no TypeScript
- Do not modify any existing JS or data files
- `index.html` changes limited to adding the nav bar

## Files

| File | Action | Notes |
|---|---|---|
| `css/nav.css` | Create | All nav styles |
| `index.html` | Modify | Add `<link>` + nav HTML only |
| `about.html` | Create | Plain HTML + nav |
| `projects.html` | Create | Plain HTML + nav |
| `blog.html` | Create | Plain HTML + nav |

## Nav Bar

**Structure** — copied verbatim into all 4 pages:

```html
<nav class="site-nav">
  <a class="nav-brand" href="index.html">ALLEN WU</a>
  <ul class="nav-links">
    <li><a href="about.html">About</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="blog.html">Blog</a></li>
  </ul>
</nav>
```

Each page's own nav link gets class `active` on its `<a>` tag (e.g. about.html marks the About link active).

**Positioning:** `position: fixed; top: 0; left: 0; right: 0; z-index: 100; height: 48px`

**Glassmorphism style:**
- Background: `rgba(255,255,255,0.08)`
- Blur: `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(255,255,255,0.15)` on bottom edge
- Font: system-ui, sans-serif
- Brand ("ALLEN WU"): white, bold, letter-spacing, no underline
- Nav links: `rgba(255,255,255,0.7)` default, white on hover, no underline
- Active link: white + bottom underline (2px solid white or accent)

**On index.html:** Canvas is `position: static; width: 100vw; height: 100vh`. The fixed nav overlays it via z-index — canvas does not need padding-top since the nav floats above it.

## New Pages (about, projects, blog)

Each page is a minimal HTML document:
- `<head>`: charset, viewport, title, `css/main.css` (provides `#1a1a2e` body bg + reset), `css/nav.css`
- `<body>`: nav HTML only — otherwise empty, ready for future content

No pixel scene. No content card. Plain stub.

## Active Link Highlighting

Each page manually adds `class="active"` to its own nav link. The `active` style is defined in `css/nav.css`.
