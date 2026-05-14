# Portfolio Overlay Design

## Goal

Turn the existing full-screen pixel office scene into a personal portfolio page for Allen Wu without replacing the canvas experience. The office remains the primary visual surface; portfolio navigation and content appear as HTML overlays above it.

## Visual Direction

Use the cleaner "editorial overlay" direction selected in brainstorming:

- Keep the canvas visible as the background at all times.
- Add a persistent top navigation row above the canvas.
- Place `ALLEN WU` as a styled monospace logo at top-left.
- Place the `About`, `Projects`, and `Blogs` tab buttons at top-center on the same horizontal row as the logo.
- Keep the nav visible in its normal position before a tab is opened, while a modal is open, and after close.
- Use restrained dark translucent surfaces and light borders rather than a heavy in-game menu treatment.

## Room Mapping

The tab camera targets use fixed tile regions from `data/published-layout.json`:

- `About`: top-left room, approximately cols 1-15 and rows 1-10.
- `Blogs`: top-right room, approximately cols 16-31 and rows 1-10.
- `Projects`: bottom-right room, approximately cols 16-31 and rows 11-17.

These regions are expressed as tile bounds in the portfolio module so they are easy to adjust later without editing renderer internals.

## Architecture

Touch the minimum feature files:

- `index.html`: add the nav overlay, dim layer, and modal shell above the existing canvas.
- `css/main.css`: style the persistent nav, dim layer, modal, placeholder content, and responsive behavior.
- `js/portfolio.js`: new module that owns tab state, modal content, room camera targets, open/close animation, and reusable camera math.
- `js/sceneMain.js`: import and initialize the portfolio module, then pass its current camera state into each render.
- `js/renderer.js`: accept an optional camera object with `zoom`, `offsetX`, and `offsetY` so the same render path can draw either the default full-layout view or an animated room-focused view.

The renderer change is intentionally narrow: when no camera object is supplied, rendering uses the current `computeOffset` behavior unchanged.

## Behavior

On tab click:

1. Mark the tab active.
2. Animate the canvas camera from the default full-layout view toward the selected room bounds.
3. Fade in a dark dim layer over the canvas at about `rgba(0, 0, 0, 0.6)`.
4. Show a centered modal card with placeholder content for the selected section.

On close:

1. Hide the modal content.
2. Fade out the dim layer.
3. Animate the camera back to the default centered full-layout view.
4. Clear the active tab state.

The nav remains visible throughout both animations.

## Content Placeholders

`About` contains a short bio paragraph and a compact skills list.

`Projects` contains two or three project cards, each with a title, short description, and link.

`Blogs` contains two or three post entries, each with a title, date, and short excerpt.

Links can point to `#` placeholders until real destinations are provided.

## Testing

Add focused tests for pure camera math in `js/portfolio.js`, such as target zoom and offset calculations for the three room bounds. Run the existing in-browser test page after implementation.

Manual verification should cover:

- Default scene still fills the screen.
- Nav is visible and aligned as a single top row.
- Each tab focuses the intended room.
- Dim layer and modal appear on open.
- Close returns to the default view.
- The page remains usable at desktop and mobile viewport sizes.
