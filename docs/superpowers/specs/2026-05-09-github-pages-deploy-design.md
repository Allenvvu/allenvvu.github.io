# GitHub Pages Deploy Design

**Date:** 2026-05-09  
**Scope:** Publish index.html scene viewer to allenvvu.github.io; keep admin local-only.

## Decision

Option A — direct push from `main`. No CI workflow, no `docs/` subfolder, no build step.

## Code Change

Remove the admin link from `index.html`:

```html
<!-- remove this line -->
<a id="admin-link" href="admin.html">admin →</a>
```

That is the only file change required.

## Deploy Workflow

1. Merge `retrace/admin-local` → `main`
2. Push `main` to `origin`
3. GitHub Pages serves `main` root automatically (already configured)

## Ongoing Workflow

Edit locally on a feature branch → merge to `main` → push. Live site updates automatically.

## Excluded from linking (not from repo)

`admin.html`, `adminMain.js`, `admin.css`, `tests.html`, `js/tests/` remain in the repo and are accessible via direct URL. This is acceptable — the admin only reads/writes `localStorage` and cannot affect the published layout.
