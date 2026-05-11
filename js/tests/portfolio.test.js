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
  const layout = { cols: 32, rows: 18 };

  assertEqual(
    ROOM_TARGETS.about,
    { col: 1, row: 1, cols: 15, rows: 10 },
    'ROOM_TARGETS.about matches the expected room bounds',
  );
  assertEqual(
    ROOM_TARGETS.blogs,
    { col: 16, row: 1, cols: 16, rows: 10 },
    'ROOM_TARGETS.blogs matches the expected room bounds',
  );
  assertEqual(
    ROOM_TARGETS.projects,
    { col: 16, row: 11, cols: 16, rows: 7 },
    'ROOM_TARGETS.projects matches the expected room bounds',
  );

  assertEqual(
    computeDefaultCamera(canvasWidth, canvasHeight, layout),
    { zoom: 2, offsetX: 128, offsetY: 72 },
    'computeDefaultCamera returns the centered full-scene camera',
  );

  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, layout, ROOM_TARGETS.about),
    { zoom: 5, offsetX: -40, offsetY: -120 },
    'computeRoomCamera frames the about room',
  );
  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, layout, ROOM_TARGETS.blogs),
    { zoom: 5, offsetX: -1280, offsetY: -120 },
    'computeRoomCamera frames the blogs room',
  );
  assertEqual(
    computeRoomCamera(canvasWidth, canvasHeight, layout, ROOM_TARGETS.projects),
    { zoom: 6, offsetX: -1664, offsetY: -1032 },
    'computeRoomCamera frames the projects room',
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
    'mixCamera interpolates and rounds camera fields',
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
