# Admin Auth + Publish Design

**Date:** 2026-05-09  
**Status:** Approved

## Problem

The site is hosted on GitHub Pages. `admin.html` is publicly accessible — anyone who finds the URL can edit the layout. Additionally, admin edits currently only write to the editor's `localStorage`, so they never reach other visitors (who always read `data/default-layout.json` from the deployed repo).

## Goals

1. Gate `admin.html` behind a password so only the site owner can use it.
2. Add a Publish action that commits `data/default-layout.json` to the GitHub repo, triggering a Pages redeploy (~30s) so all visitors see the update.
3. Keep the existing Save button for fast local preview (localStorage only).

## Non-Goals

- True server-side authentication (not possible on GitHub Pages without paid add-ons).
- Persisting the GitHub token across page reloads (intentionally ephemeral).

## Architecture

### Password Gate (`admin.html` + `adminMain.js`)

A full-screen `<div id="auth-gate">` overlay renders on top of the hidden admin UI. It contains a single password `<input>` and an Enter button.

- Password is hardcoded as `ADMIN_PASSWORD` in `adminMain.js`.
- On correct entry: overlay hidden, `sessionStorage.setItem('admin-authed', '1')` set, admin UI shown.
- On page reload mid-session: `sessionStorage` check skips the gate automatically.
- On wrong entry: shake animation + "Incorrect password" error message.

### Admin Sidebar Changes (`admin.html`)

1. **GitHub Token field** — `<input type="password" id="gh-token-input">` below the existing buttons. Value stored in `sessionStorage['gh-token']` on change. Never committed to the repo.
2. **Publish button** — `<button id="publish-btn">Publish</button>` below the existing Save button. Disabled when `#gh-token-input` is empty.
3. **Save button** — unchanged; writes to `localStorage` only (fast local preview).

### GitHub Publish Module (`js/githubPublish.js`)

New ES6 module. Exports a single function:

```js
export async function publishLayout(layout, token)
```

Flow:
1. GET `https://api.github.com/repos/{OWNER}/{REPO}/contents/data/default-layout.json`  
   → extracts `sha` of the current file.
2. PUT the same URL with:
   - `content`: base64-encoded JSON of `layout`
   - `sha`: from step 1
   - `message`: `"data: publish layout via admin"`
   - `Authorization: Bearer {token}` header
3. Returns `{ ok: true }` on success, `{ ok: false, error: string }` on failure.

`OWNER` and `REPO` are hardcoded constants in this file (non-sensitive).

### Publish Button Wiring (`adminMain.js`)

```
click #publish-btn
  → saveLayout(state.layout)          // localStorage, same as Save
  → publishLayout(state.layout, token)
  → show "Publishing…" in sidebar status
  → on success: show "Published! (~30s to deploy)"
  → on failure: show GitHub error reason
```

### Public Page (`index.html`)

- Remove `<a id="admin-link" href="admin.html">admin →</a>`.
- No changes to data loading: visitors never write to `localStorage`, so `loadLayout()` always falls through to fetching `data/default-layout.json`, which updates automatically after each publish.

## Files Changed

| File | Change |
|---|---|
| `admin.html` | Add `#auth-gate` overlay, `#gh-token-input`, `#publish-btn`, `#sidebar-status` |
| `js/adminMain.js` | Password gate logic, sessionStorage auth check, wire Publish button |
| `js/githubPublish.js` | New module — GitHub API GET + PUT |
| `index.html` | Remove admin link |

## Security Notes

- The hardcoded `ADMIN_PASSWORD` in JS is visible to anyone who finds and reads `adminMain.js`. This is acceptable for a personal site where the goal is stopping casual visitors, not adversarial attackers.
- The GitHub PAT is scoped to `contents: write` on this repo only. Worst-case exposure: someone could overwrite `data/default-layout.json`. The PAT is never stored in the repo or in `localStorage`.
- The admin URL itself is not obfuscated; removing the public link reduces discoverability.

## Success Criteria

- Visiting `admin.html` shows a password gate; wrong password stays gated.
- Correct password reveals admin UI (same as today).
- Refreshing the page mid-session skips the gate.
- "Save" works as before (localStorage only).
- "Publish" with a valid PAT commits `default-layout.json` to the repo and shows a success message.
- "Publish" with no token or invalid token shows a clear error.
- The public page no longer shows an admin link.
- Visitors see published changes within ~30s of a successful publish.
