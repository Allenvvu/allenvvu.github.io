# Admin Auth + Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate `admin.html` behind a client-side password and add a Publish button that commits `data/default-layout.json` to the GitHub repo via API, triggering an automatic Pages redeploy.

**Architecture:** A full-screen auth overlay blocks the admin UI until the correct password is entered; auth state lives in `sessionStorage` so page refreshes skip the gate. A new `js/githubPublish.js` module handles the two-step GitHub API flow (GET current SHA → PUT new content). The existing Save button keeps its localStorage-only behavior; a new Publish button calls `publishLayout()` and shows inline status.

**Tech Stack:** Vanilla ES6 modules, GitHub Contents API v3, `sessionStorage`, `btoa` for base64 encoding.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `js/githubPublish.js` | Create | GitHub API GET + PUT logic |
| `js/tests/githubPublish.test.js` | Create | In-browser tests for publishLayout |
| `tests.html` | Modify | Register the new test file |
| `admin.html` | Modify | Auth gate overlay, token field, Publish button |
| `css/admin.css` | Modify | Styles for gate, token field, publish button, status |
| `js/adminMain.js` | Modify | Auth gate logic, token wiring, publish button handler |
| `index.html` | Modify | Remove admin link |
| `css/main.css` | Modify | Remove `#admin-link` styles |

---

## Task 1: Create `js/githubPublish.js` with tests

**Files:**
- Create: `js/tests/githubPublish.test.js`
- Create: `js/githubPublish.js`
- Modify: `tests.html`

- [ ] **Step 1: Write the failing test file**

Create `js/tests/githubPublish.test.js`:

```js
import { assert } from './run.js';
import { publishLayout } from '../githubPublish.js';

export async function runTests() {
  // success: GET returns SHA, PUT succeeds
  {
    const orig = window.fetch;
    let call = 0;
    window.fetch = async () => {
      call++;
      if (call === 1) return { ok: true, json: async () => ({ sha: 'abc123' }) };
      return { ok: true, json: async () => ({}) };
    };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === true, 'publishLayout: ok:true on success');
    window.fetch = orig;
  }

  // failure: GET returns 401
  {
    const orig = window.fetch;
    window.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Bad credentials' }) });
    const r = await publishLayout({ version: 1 }, 'bad');
    assert(r.ok === false, 'publishLayout: ok:false when GET fails');
    assert(typeof r.error === 'string', 'publishLayout: error is string when GET fails');
    window.fetch = orig;
  }

  // failure: network error on GET
  {
    const orig = window.fetch;
    window.fetch = async () => { throw new Error('NetworkError'); };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === false, 'publishLayout: ok:false on network error');
    assert(r.error.includes('NetworkError'), 'publishLayout: error includes thrown message');
    window.fetch = orig;
  }

  // failure: PUT returns 422
  {
    const orig = window.fetch;
    let call = 0;
    window.fetch = async () => {
      call++;
      if (call === 1) return { ok: true, json: async () => ({ sha: 'abc123' }) };
      return { ok: false, status: 422, json: async () => ({ message: 'Validation Failed' }) };
    };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === false, 'publishLayout: ok:false when PUT fails');
    assert(r.error === 'Validation Failed', 'publishLayout: error from PUT response message');
    window.fetch = orig;
  }
}
```

- [ ] **Step 2: Register the test in `tests.html` and open it**

In `tests.html`, add the import and async call. Replace the existing `<script type="module">` block with:

```html
<script type="module">
  import { getResults } from './js/tests/run.js';
  import { runTests as tileMapTests } from './js/tests/tileMap.test.js';
  import { runTests as characterTests } from './js/tests/character.test.js';
  import { runTests as layoutStoreTests } from './js/tests/layoutStore.test.js';
  import { runTests as githubPublishTests } from './js/tests/githubPublish.test.js';

  tileMapTests();
  characterTests();
  layoutStoreTests();
  await githubPublishTests();

  const out = document.getElementById('output');
  const results = getResults();
  const passed = results.filter(r => r.pass).length;
  out.innerHTML = `<p>${passed}/${results.length} passed</p>` +
    results.map(r =>
      `<div class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'} ${r.msg}</div>`
    ).join('');
</script>
```

Open `tests.html` in a browser. Expected: an error referencing `../githubPublish.js` (module not found).

- [ ] **Step 3: Create `js/githubPublish.js`**

```js
const OWNER = 'Allenvvu';
const REPO = 'allenvvu.github.io';
const FILE_PATH = 'data/default-layout.json';

export async function publishLayout(layout, token) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  let sha;
  try {
    const getRes = await fetch(url, { headers });
    if (!getRes.ok) {
      const body = await getRes.json();
      return { ok: false, error: body.message || `GET failed: ${getRes.status}` };
    }
    sha = (await getRes.json()).sha;
  } catch (e) {
    return { ok: false, error: `NetworkError: ${e.message}` };
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(layout, null, 2))));
  try {
    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: 'data: publish layout via admin', content, sha }),
    });
    if (!putRes.ok) {
      const body = await putRes.json();
      return { ok: false, error: body.message || `PUT failed: ${putRes.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `NetworkError: ${e.message}` };
  }
}
```

- [ ] **Step 4: Reload `tests.html` and verify tests pass**

Expected output (new tests at bottom):
```
✓ publishLayout: ok:true on success
✓ publishLayout: ok:false when GET fails
✓ publishLayout: error is string when GET fails
✓ publishLayout: ok:false on network error
✓ publishLayout: error includes thrown message
✓ publishLayout: ok:false when PUT fails
✓ publishLayout: error from PUT response message
```

All previously passing tests should still pass.

- [ ] **Step 5: Commit**

```bash
git add js/githubPublish.js js/tests/githubPublish.test.js tests.html
git commit -m "feat: add githubPublish module with tests"
```

---

## Task 2: Auth gate — HTML + CSS

**Files:**
- Modify: `admin.html`
- Modify: `css/admin.css`

- [ ] **Step 1: Add auth gate HTML to `admin.html`**

Insert the following block as the **first child of `<body>`**, before `<div id="canvas-wrap">`:

```html
<div id="auth-gate">
  <div id="auth-box">
    <h2>Admin</h2>
    <input type="password" id="auth-password" placeholder="Password" autofocus>
    <button id="auth-enter">Enter</button>
    <p id="auth-error" hidden>Incorrect password</p>
  </div>
</div>
```

- [ ] **Step 2: Add auth gate CSS to `css/admin.css`**

Append to the end of `css/admin.css`:

```css
#auth-gate {
  position: fixed;
  inset: 0;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
#auth-gate.hidden { display: none; }
#auth-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 2rem;
  background: #12122a;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  min-width: 220px;
}
#auth-box h2 {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
}
#auth-password {
  padding: 0.4rem 0.5rem;
  background: #1e1e3a;
  border: 1px solid #2a2a4a;
  color: #eee;
  font-family: monospace;
  font-size: 0.85rem;
  border-radius: 3px;
}
#auth-password:focus { outline: none; border-color: #007fd4; }
#auth-enter {
  padding: 0.4rem 0.5rem;
  background: #007fd4;
  border: none;
  color: #fff;
  font-family: monospace;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 3px;
}
#auth-enter:hover { background: #0070c0; }
#auth-error { color: #f44; font-size: 0.8rem; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
#auth-box.shake { animation: shake 0.4s ease; }
```

- [ ] **Step 3: Open `admin.html` in a browser**

Expected: the page shows only the auth gate — a dark centered box with a password field and Enter button. The admin canvas/sidebar should not be visible (covered by the gate).

- [ ] **Step 4: Commit**

```bash
git add admin.html css/admin.css
git commit -m "feat: add auth gate overlay HTML and CSS"
```

---

## Task 3: Auth gate — JS logic in `adminMain.js`

**Files:**
- Modify: `js/adminMain.js`

- [ ] **Step 1: Add the `ADMIN_PASSWORD` constant and import**

At the top of `js/adminMain.js`, after the existing imports, add:

```js
import { publishLayout } from './githubPublish.js';

const ADMIN_PASSWORD = 'your-password-here'; // change this to your chosen password
```

**Replace `'your-password-here'` with your actual password before saving.**

- [ ] **Step 2: Add `initAuth()` function**

Add this function after the `rafLoop` function (around line 210, before the tile-painting section). Insert it as a new block:

```js
// ── Auth gate ─────────────────────────────────────────────────

function initAuth() {
  const gate = document.getElementById('auth-gate');
  const passwordInput = document.getElementById('auth-password');
  const enterBtn = document.getElementById('auth-enter');
  const authError = document.getElementById('auth-error');
  const authBox = document.getElementById('auth-box');

  function attempt() {
    if (passwordInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin-authed', '1');
      gate.classList.add('hidden');
      main().catch(err => console.error('Admin failed to start:', err));
    } else {
      authError.hidden = false;
      authBox.classList.remove('shake');
      void authBox.offsetWidth;
      authBox.classList.add('shake');
      passwordInput.value = '';
    }
  }

  if (sessionStorage.getItem('admin-authed') === '1') {
    gate.classList.add('hidden');
    main().catch(err => console.error('Admin failed to start:', err));
    return;
  }

  enterBtn.addEventListener('click', attempt);
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}
```

- [ ] **Step 3: Replace the bottom call to `main()` with `initAuth()`**

Find the very last line of `js/adminMain.js`:

```js
main().catch(err => { console.error('Admin failed to start:', err); });
```

Replace it with:

```js
initAuth();
```

- [ ] **Step 4: Open `admin.html` and test the gate**

Test wrong password:
- Type anything wrong → Enter. Expected: "Incorrect password" appears, box shakes, input clears.

Test correct password:
- Type your chosen password → Enter. Expected: gate disappears, admin loads normally.

Test session persistence:
- After logging in, refresh the page. Expected: gate is skipped, admin loads immediately.

Test fresh session:
- Open an Incognito window and go to `admin.html`. Expected: gate appears.

- [ ] **Step 5: Commit**

```bash
git add js/adminMain.js
git commit -m "feat: wire auth gate with sessionStorage and password check"
```

---

## Task 4: Token field + Publish button — HTML, CSS, and JS

**Files:**
- Modify: `admin.html`
- Modify: `css/admin.css`
- Modify: `js/adminMain.js`

- [ ] **Step 1: Add token field and Publish button HTML to `admin.html`**

In the `<div id="sidebar">`, find the existing Reset button and scene link:

```html
    <button class="action-btn" id="reset-btn">Reset</button>
    <a id="scene-link" href="index.html">← View Scene</a>
```

Insert a new block between them:

```html
    <button class="action-btn" id="reset-btn">Reset</button>

    <hr class="sep">
    <span class="sidebar-label">GitHub Token</span>
    <input type="password" id="gh-token-input" placeholder="ghp_...">
    <button class="action-btn" id="publish-btn" disabled>Publish</button>
    <span id="sidebar-status"></span>

    <a id="scene-link" href="index.html">← View Scene</a>
```

- [ ] **Step 2: Add token field + Publish button CSS to `css/admin.css`**

Append to the end of `css/admin.css`:

```css
.sidebar-label { font-size: 0.7rem; color: #666; }
#gh-token-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  background: #1e1e3a;
  border: 1px solid #2a2a4a;
  color: #aaa;
  font-family: monospace;
  font-size: 0.8rem;
  border-radius: 3px;
}
#gh-token-input:focus { outline: none; border-color: #007fd4; }
#publish-btn { border-color: #4c4; color: #4c4; }
#publish-btn:hover:not(:disabled) { background: #4c4; color: #000; }
#publish-btn:disabled { opacity: 0.4; cursor: not-allowed; }
#sidebar-status { font-size: 0.75rem; min-height: 1.2em; display: block; }
```

- [ ] **Step 3: Add DOM refs and wiring to `js/adminMain.js`**

After the existing DOM refs block (around line 49, after `const floorTileSelect = ...`), add:

```js
const ghTokenInput = document.getElementById('gh-token-input');
const publishBtn = document.getElementById('publish-btn');
const sidebarStatus = document.getElementById('sidebar-status');
```

Then, after the `document.getElementById('reset-btn').addEventListener(...)` block (around line 361), add:

```js
// Restore token from session
const storedToken = sessionStorage.getItem('gh-token') || '';
if (storedToken) {
  ghTokenInput.value = storedToken;
  publishBtn.disabled = false;
}

ghTokenInput.addEventListener('input', () => {
  const val = ghTokenInput.value.trim();
  sessionStorage.setItem('gh-token', val);
  publishBtn.disabled = val.length === 0;
});

publishBtn.addEventListener('click', async () => {
  const token = ghTokenInput.value.trim();
  if (!token || !state.layout) return;
  saveLayout(state.layout);
  publishBtn.disabled = true;
  sidebarStatus.style.color = '#aaa';
  sidebarStatus.textContent = 'Publishing…';
  const result = await publishLayout(state.layout, token);
  publishBtn.disabled = false;
  if (result.ok) {
    sidebarStatus.style.color = '#4c4';
    sidebarStatus.textContent = 'Published! (~30s to deploy)';
  } else {
    sidebarStatus.style.color = '#f44';
    sidebarStatus.textContent = result.error;
  }
});
```

- [ ] **Step 4: Obtain a GitHub PAT**

Go to: `https://github.com/settings/tokens?type=beta` (Fine-grained tokens)

Create a token with:
- **Repository access:** Only `allenvvu.github.io`
- **Permissions → Contents:** Read and Write

Copy the token (starts with `ghp_` or `github_pat_`).

- [ ] **Step 5: Test the Publish button in `admin.html`**

Log in with your password. Paste your PAT into the GitHub Token field. Make a small tile change. Click Publish.

Expected:
- Button shows disabled while publishing
- "Publishing…" appears in status
- After ~2s: "Published! (~30s to deploy)" in green

Verify at `https://github.com/Allenvvu/allenvvu.github.io/commits/main` — a new commit "data: publish layout via admin" should appear.

Test with a bad token: paste garbage, click Publish. Expected: red error message from GitHub API (e.g. "Bad credentials").

- [ ] **Step 6: Commit**

```bash
git add admin.html css/admin.css js/adminMain.js
git commit -m "feat: add GitHub token field and Publish button to admin sidebar"
```

---

## Task 5: Remove admin link from public page

**Files:**
- Modify: `index.html`
- Modify: `css/main.css`

- [ ] **Step 1: Remove the admin link from `index.html`**

Find and delete this line in `index.html`:

```html
  <a id="admin-link" href="admin.html">admin →</a>
```

- [ ] **Step 2: Remove the admin link CSS from `css/main.css`**

Find and delete these lines in `css/main.css`:

```css
#admin-link {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  color: rgba(255,255,255,0.4);
  font-family: monospace;
  font-size: 0.75rem;
  text-decoration: none;
  letter-spacing: 0.05em;
}

#admin-link:hover { color: rgba(255,255,255,0.8); }
```

- [ ] **Step 3: Verify `index.html` in a browser**

Open `index.html`. Expected: the pixel office scene loads normally, no "admin →" link in the bottom-right corner.

- [ ] **Step 4: Commit**

```bash
git add index.html css/main.css
git commit -m "chore: remove public admin link from scene page"
```
