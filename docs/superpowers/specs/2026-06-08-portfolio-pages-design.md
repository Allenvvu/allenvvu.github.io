# Portfolio Pages Design

## Goal

Create a minimal GitHub Pages portfolio site for Allen Wu inspired by the calm, centered style of `https://benjmann.net/`.

The first version should establish the structure and visual language while using dummy placeholder blocks for the portrait, quote, paragraph copy, and project entries. Allen will replace those placeholders later.

## Pages

### Home Page

Path: `/index.html`

The home page should use a centered single-column layout with a narrow max width. It should include:

- A circular dummy portrait block at the top.
- The name `Allen Wu`.
- The tagline `Engineer, builder, artist, lifelong learner.`
- Three inline navigation links separated by dot separators:
  - `LinkedIn` -> `https://www.linkedin.com/in/allen-w-307451229/`
  - `Projects` -> `/projects.html`
  - `GitHub` -> `https://github.com/Allenvvu`
- A placeholder quote block with a left border.
- Three short placeholder bio paragraphs.

### Projects Page

Path: `/projects.html`

The projects page should use the same visual system as the home page. It should include:

- A page title such as `Projects`.
- A short placeholder subtitle.
- Inline navigation links back to `Home`, `LinkedIn`, and `GitHub`.
- Placeholder project entries with dummy titles, short descriptions, and placeholder links or labels.

## Visual Direction

The site should feel quiet, personal, and lightweight:

- White background.
- Dark slate body text.
- Blue text links.
- Roboto/system sans-serif stack.
- Centered header section.
- Comfortable vertical spacing.
- No cards, gradients, decorative backgrounds, or heavy visual effects.

The project should borrow the reference site's layout rhythm without copying its personal content.

## Architecture

Use static files only:

- `index.html`
- `projects.html`
- `styles.css`

No JavaScript, package manager, or build step is needed for this first version. This keeps GitHub Pages deployment simple and makes the site easy to edit.

## Placeholder Strategy

Use visible but tasteful placeholders:

- Portrait: a circular gray block with initials or a simple label.
- Quote: neutral placeholder quote text.
- Bio: generic placeholder paragraphs that clearly read as replaceable copy.
- Projects: three placeholder project rows.

The placeholders should preserve final layout dimensions so later real content does not require redesign.

## Responsiveness

The layout should work on desktop and mobile:

- Main container max width around 720px.
- Horizontal padding on small screens.
- Slightly smaller name and portrait size on mobile.
- Link rows should wrap cleanly without overlap.

## Verification

Before considering implementation complete:

- Serve the site locally with `python3 -m http.server`.
- Open the home page and projects page in the browser.
- Check desktop and mobile widths for layout issues.
- Confirm external links point to Allen's LinkedIn and GitHub.
- Confirm `Projects` navigation opens the local projects page.

