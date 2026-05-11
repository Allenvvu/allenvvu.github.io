import { assertEqual } from './run.js';
import {
  ROOM_TARGETS,
  computeDefaultCamera,
  computeRoomCamera,
  easeOutCubic,
  mixCamera,
} from '../portfolio.js';

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
}
