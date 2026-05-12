import { assert, assertEqual } from './run.js';
import {
  initPortfolio,
  ROOM_TARGETS,
  computeDefaultCamera,
  computeRoomCamera,
  easeOutCubic,
  mixCamera,
} from '../portfolio.js';

function createPortfolioDom() {
  const fixture = document.createElement('div');
  fixture.innerHTML = `
    <div class="portfolio-shell" id="portfolio-shell">
      <header class="portfolio-nav" aria-label="Portfolio navigation">
        <button
          class="portfolio-logo"
          id="portfolio-home"
          type="button"
          aria-label="Allen Wu"
        >ALLEN WU</button>
        <nav class="portfolio-tabs" aria-label="Portfolio sections">
          <button class="portfolio-tab" type="button" data-portfolio-tab="about">About</button>
          <button class="portfolio-tab" type="button" data-portfolio-tab="projects">Projects</button>
          <button class="portfolio-tab" type="button" data-portfolio-tab="blogs">Blogs</button>
        </nav>
      </header>
      <div class="portfolio-dim" id="portfolio-dim" aria-hidden="true"></div>
      <section
        class="portfolio-modal"
        id="portfolio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-modal-title"
        hidden
      >
        <button class="portfolio-close" id="portfolio-close" type="button" aria-label="Close portfolio section">x</button>
        <div class="portfolio-content" id="portfolio-content"></div>
      </section>
    </div>
  `;
  document.body.appendChild(fixture);
  return fixture;
}

function createTimerControls() {
  const originalSetTimeout = window.setTimeout;
  const originalClearTimeout = window.clearTimeout;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  let nextTimerId = 1;
  const timers = new Map();

  window.setTimeout = (callback, delay = 0) => {
    const id = nextTimerId++;
    timers.set(id, { callback, delay });
    return id;
  };

  window.clearTimeout = (id) => {
    timers.delete(id);
  };

  window.requestAnimationFrame = (callback) => {
    callback(performance.now());
    return 1;
  };

  return {
    runAllTimers() {
      for (const [id, timer] of Array.from(timers.entries())) {
        timers.delete(id);
        timer.callback();
      }
    },
    restore() {
      window.setTimeout = originalSetTimeout;
      window.clearTimeout = originalClearTimeout;
      window.requestAnimationFrame = originalRequestAnimationFrame;
    },
  };
}

function createPortfolioHarness() {
  const fixture = createPortfolioDom();
  const timers = createTimerControls();
  const canvas = { width: 1280, height: 720 };
  const layout = { cols: 32, rows: 18 };
  const portfolio = initPortfolio({
    canvas,
    getLayout: () => layout,
    defaultZoom: 5,
  });

  return {
    portfolio,
    timers,
    fixture,
    elements: {
      homeButton: fixture.querySelector('#portfolio-home'),
      aboutTab: fixture.querySelector('[data-portfolio-tab="about"]'),
      dim: fixture.querySelector('#portfolio-dim'),
      modal: fixture.querySelector('#portfolio-modal'),
    },
  };
}

export function runTests() {
  const canvasWidth = 1280;
  const canvasHeight = 720;
  const largeCanvasWidth = 2560;
  const largeCanvasHeight = 1440;
  const lockedOverviewZoom = 5;
  const aboutTarget = { zoom: 7, location: { col: 8.5, row: 5 } };
  const blogsTarget = { zoom: 7, location: { col: 25, row: 5 } };
  const projectsTarget = { zoom: 7, location: { col: 25, row: 12 } };
  const layout = { cols: 32, rows: 18 };

  assertEqual(
    ROOM_TARGETS.about,
    aboutTarget,
    'ROOM_TARGETS.about matches the expected zoom and focus location',
  );
  assertEqual(
    ROOM_TARGETS.blogs,
    blogsTarget,
    'ROOM_TARGETS.blogs matches the expected zoom and focus location',
  );
  assertEqual(
    ROOM_TARGETS.projects,
    projectsTarget,
    'ROOM_TARGETS.projects matches the expected zoom and focus location',
  );

  assertEqual(
    computeDefaultCamera(canvasWidth, canvasHeight, layout),
    { zoom: 2, offsetX: 128, offsetY: 72 },
    'computeDefaultCamera returns the centered full-scene camera',
  );
  assertEqual(
    computeDefaultCamera(largeCanvasWidth, largeCanvasHeight, layout, lockedOverviewZoom),
    { zoom: 5, offsetX: 0, offsetY: 0 },
    'computeDefaultCamera accepts a locked overview zoom on the reference desktop size',
  );
  assertEqual(
    computeDefaultCamera(canvasWidth, canvasHeight, layout, lockedOverviewZoom),
    { zoom: 5, offsetX: -640, offsetY: -360 },
    'computeDefaultCamera keeps the locked overview zoom on smaller windows',
  );

  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, aboutTarget),
    { zoom: 7, offsetX: -312, offsetY: -200 },
    'computeRoomCamera uses the about zoom and location target',
  );
  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, blogsTarget),
    { zoom: 7, offsetX: -2160, offsetY: -200 },
    'computeRoomCamera uses the blogs zoom and location target',
  );
  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, projectsTarget),
    { zoom: 7, offsetX: -2160, offsetY: -984 },
    'computeRoomCamera uses the projects zoom and location target',
  );
  assertEqual(
    computeRoomCamera(largeCanvasWidth, largeCanvasHeight, aboutTarget),
    { zoom: 7, offsetX: 328, offsetY: 160 },
    'computeRoomCamera recenters the about target on a larger viewport',
  );
  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, aboutTarget, 8),
    { zoom: 8, offsetX: -448, offsetY: -280 },
    'computeRoomCamera allows a zoom override for transitions',
  );
  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, projectsTarget),
    { zoom: 7, offsetX: -2160, offsetY: -984 },
    'computeRoomCamera keeps direct targets stable across repeated calls',
  );

  assertEqual(easeOutCubic(0), 0, 'easeOutCubic(0) returns 0');
  assertEqual(easeOutCubic(1), 1, 'easeOutCubic(1) returns 1');
  assertEqual(easeOutCubic(0.5), 0.875, 'easeOutCubic(0.5) returns the expected eased value');

  assertEqual(
    mixCamera(
      { zoom: 2, offsetX: 100, offsetY: 50 },
      { zoom: 6, offsetX: -300, offsetY: -150 },
      0.25,
    ),
    { zoom: 3, offsetX: 0, offsetY: 0 },
    'mixCamera interpolates camera fields at quarter progress',
  );
  assertEqual(
    mixCamera(
      { zoom: 5, offsetX: 0, offsetY: 0 },
      { zoom: 7, offsetX: -100, offsetY: -60 },
      0.2,
    ),
    { zoom: 5.4, offsetX: -20, offsetY: -12 },
    'mixCamera preserves fractional progress for smooth zoom animation',
  );
  assertEqual(
    mixCamera(
      { zoom: 2, offsetX: 0, offsetY: 0 },
      { zoom: 4, offsetX: 100, offsetY: 100 },
      -1,
    ),
    { zoom: 2, offsetX: 0, offsetY: 0 },
    'mixCamera clamps progress below 0',
  );
  assertEqual(
    mixCamera(
      { zoom: 2, offsetX: 0, offsetY: 0 },
      { zoom: 4, offsetX: 100, offsetY: 100 },
      2,
    ),
    { zoom: 4, offsetX: 100, offsetY: 100 },
    'mixCamera clamps progress above 1',
  );

  {
    const { portfolio, timers, fixture, elements } = createPortfolioHarness();

    elements.aboutTab.click();
    timers.runAllTimers();

    const openState = {
      activeTab: elements.aboutTab.getAttribute('aria-pressed'),
      dimVisible: elements.dim.classList.contains('is-visible'),
      modalHidden: elements.modal.hidden,
      cameraActive: portfolio.getCamera() !== null,
    };

    portfolio.close();
    timers.runAllTimers();
    const closeState = {
      activeTab: elements.aboutTab.getAttribute('aria-pressed'),
      dimVisible: elements.dim.classList.contains('is-visible'),
      modalHidden: elements.modal.hidden,
      cameraActive: portfolio.getCamera() !== null,
    };

    timers.restore();
    fixture.remove();

    assertEqual(
      openState,
      {
        activeTab: 'true',
        dimVisible: true,
        modalHidden: false,
        cameraActive: true,
      },
      'initPortfolio opens a section into the active tab, visible modal, and focused camera state',
    );
    assertEqual(
      closeState,
      {
        activeTab: 'false',
        dimVisible: false,
        modalHidden: true,
        cameraActive: true,
      },
      'portfolio.close clears the active section state and starts the overview reset transition',
    );
  }

  {
    const expectedHarness = createPortfolioHarness();

    expectedHarness.elements.aboutTab.click();
    expectedHarness.timers.runAllTimers();

    expectedHarness.portfolio.close();
    expectedHarness.timers.runAllTimers();
    const closeState = {
      activeTab: expectedHarness.elements.aboutTab.getAttribute('aria-pressed'),
      dimVisible: expectedHarness.elements.dim.classList.contains('is-visible'),
      modalHidden: expectedHarness.elements.modal.hidden,
      cameraActive: expectedHarness.portfolio.getCamera() !== null,
    };

    expectedHarness.timers.restore();
    expectedHarness.fixture.remove();

    const { portfolio, timers, fixture, elements } = createPortfolioHarness();

    elements.aboutTab.click();
    timers.runAllTimers();

    elements.homeButton.click();
    timers.runAllTimers();

    assertEqual(
      closeState,
      {
        activeTab: 'false',
        dimVisible: false,
        modalHidden: true,
        cameraActive: true,
      },
      'title reset comparison uses the existing closed-section state as its baseline',
    );

    assertEqual(
      {
        activeTab: elements.aboutTab.getAttribute('aria-pressed'),
        dimVisible: elements.dim.classList.contains('is-visible'),
        modalHidden: elements.modal.hidden,
        cameraActive: portfolio.getCamera() !== null,
      },
      closeState,
      'clicking the portfolio title uses the same reset state as the existing close action',
    );

    const homeStateBeforeSecondClick = {
      dimVisible: elements.dim.classList.contains('is-visible'),
      modalHidden: elements.modal.hidden,
      cameraActive: portfolio.getCamera() !== null,
    };

    elements.homeButton.click();
    timers.runAllTimers();

    assert(
      JSON.stringify({
        dimVisible: elements.dim.classList.contains('is-visible'),
        modalHidden: elements.modal.hidden,
        cameraActive: portfolio.getCamera() !== null,
      }) === JSON.stringify(homeStateBeforeSecondClick),
      'clicking the portfolio title from the home overview remains a no-op',
    );

    timers.restore();
    fixture.remove();
  }
}
