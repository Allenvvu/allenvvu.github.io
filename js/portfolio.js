import { TILE_SIZE } from './constants.js';
import { computeOffset, computeZoom } from './renderer.js';

export const ROOM_TARGETS = Object.freeze({
  about: Object.freeze({ zoom: 7, location: Object.freeze({ col: 8.5, row: 5 }) }),
  blogs: Object.freeze({ zoom: 7, location: Object.freeze({ col: 25, row: 5 }) }),
  projects: Object.freeze({ zoom: 7, location: Object.freeze({ col: 25, row: 12 }) }),
});

export function computeDefaultCamera(canvasWidth, canvasHeight, layout, zoomOverride = null) {
  const zoom = zoomOverride ?? computeZoom(canvasWidth, canvasHeight, layout.cols, layout.rows);
  return {
    zoom,
    ...computeOffset(canvasWidth, canvasHeight, layout.cols, layout.rows, zoom),
  };
}

export function computeRoomCamera(canvasWidth, canvasHeight, target, zoomOverride = null) {
  const zoom = zoomOverride ?? target.zoom;
  const centerX = target.location.col * TILE_SIZE;
  const centerY = target.location.row * TILE_SIZE;
  return {
    zoom,
    offsetX: Math.round(canvasWidth / 2 - centerX * zoom),
    offsetY: Math.round(canvasHeight / 2 - centerY * zoom),
  };
}

export function easeOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - (1 - clamped) ** 3;
}

export function mixCamera(fromCamera, toCamera, t) {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    zoom: fromCamera.zoom + (toCamera.zoom - fromCamera.zoom) * clamped,
    offsetX: fromCamera.offsetX + (toCamera.offsetX - fromCamera.offsetX) * clamped,
    offsetY: fromCamera.offsetY + (toCamera.offsetY - fromCamera.offsetY) * clamped,
  };
}

export const CAMERA_DURATION_MS = 650;
export const MODAL_SHOW_DELAY_MS = 140;

export const SECTION_CONTENT = Object.freeze({
  about: Object.freeze({
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
  }),
  projects: Object.freeze({
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
  }),
  blogs: Object.freeze({
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
  }),
});

export function initPortfolio({ canvas, getLayout, defaultZoom = null }) {
  const homeButton = document.getElementById('portfolio-home');
  const tabs = Array.from(document.querySelectorAll('[data-portfolio-tab]'));
  const dim = document.getElementById('portfolio-dim');
  const modal = document.getElementById('portfolio-modal');
  const closeButton = document.getElementById('portfolio-close');
  const content = document.getElementById('portfolio-content');

  let activeSection = null;
  let transition = null;
  let modalTimer = 0;
  let hideTimer = 0;

  function layoutInfo() {
    const layout = getLayout();
    return { cols: layout.cols, rows: layout.rows };
  }

  const initialLayout = layoutInfo();
  const lockedOverviewZoom = defaultZoom ?? computeZoom(
    canvas.width,
    canvas.height,
    initialLayout.cols,
    initialLayout.rows,
  );

  function cameraForSection(section) {
    return computeRoomCamera(canvas.width, canvas.height, ROOM_TARGETS[section]);
  }

  function defaultCamera() {
    return computeDefaultCamera(canvas.width, canvas.height, layoutInfo(), lockedOverviewZoom);
  }

  function currentCamera(now = performance.now()) {
    if (!transition) {
      return activeSection ? cameraForSection(activeSection) : null;
    }

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
    if (!entry) return;
    content.innerHTML = entry.html;
    modal.hidden = false;
    modal.setAttribute('aria-label', entry.title);
    requestAnimationFrame(() => {
      modal.classList.add('is-visible');
    });
  }

  function openSection(section) {
    if (!SECTION_CONTENT[section]) return;

    window.clearTimeout(modalTimer);
    window.clearTimeout(hideTimer);

    const from = currentCamera() ?? defaultCamera();
    const to = cameraForSection(section);

    activeSection = section;
    transition = {
      from,
      to,
      startedAt: performance.now(),
      finalSection: section,
    };

    setActiveTab(section);
    dim.classList.add('is-visible');
    modal.classList.remove('is-visible');
    modal.hidden = true;

    modalTimer = window.setTimeout(() => {
      showModal(section);
    }, MODAL_SHOW_DELAY_MS);
  }

  function closeSection() {
    if (!activeSection && !transition) return;

    window.clearTimeout(modalTimer);
    window.clearTimeout(hideTimer);

    const from = currentCamera() ?? defaultCamera();
    const to = defaultCamera();

    activeSection = null;
    transition = {
      from,
      to,
      startedAt: performance.now(),
      finalSection: null,
    };

    setActiveTab(null);
    dim.classList.remove('is-visible');
    modal.classList.remove('is-visible');
    hideTimer = window.setTimeout(() => {
      modal.hidden = true;
    }, 220);
  }

  for (const tab of tabs) {
    tab.setAttribute('aria-pressed', 'false');
    tab.addEventListener('click', () => {
      openSection(tab.dataset.portfolioTab);
    });
  }

  closeButton.addEventListener('click', closeSection);
  homeButton?.addEventListener('click', closeSection);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (activeSection || transition)) {
      closeSection();
    }
  });

  return {
    getCamera: () => currentCamera(),
    close: closeSection,
  };
}
