import { assert, assertEqual } from './run.js';
import { createCharacter, getFrameSrcX } from '../character.js';
import { CharacterState, Direction } from '../constants.js';

export function runTests() {
  const ch = createCharacter(3, 5);
  assertEqual(ch.tileCol, 3, 'createCharacter sets tileCol');
  assertEqual(ch.tileRow, 5, 'createCharacter sets tileRow');
  assertEqual(ch.x, 3 * 16 + 8, 'createCharacter centers x on tile');
  assertEqual(ch.y, 5 * 16 + 8, 'createCharacter centers y on tile');
  assertEqual(ch.state, CharacterState.IDLE, 'createCharacter starts IDLE');
  assertEqual(ch.frame, 0, 'createCharacter starts at frame 0');

  // getFrameSrcX: IDLE always uses frame 0 of direction
  ch.dir = Direction.DOWN;
  ch.state = CharacterState.IDLE;
  ch.frame = 4;
  assertEqual(getFrameSrcX(ch), 0, 'IDLE DOWN always srcX=0 (dir offset 0, frame 0)');

  ch.dir = Direction.RIGHT;
  assertEqual(getFrameSrcX(ch), 96, 'IDLE RIGHT always srcX=96 (dir offset 96, frame 0)');

  ch.dir = Direction.UP;
  assertEqual(getFrameSrcX(ch), 192, 'IDLE UP always srcX=192 (dir offset 192, frame 0)');

  ch.dir = Direction.LEFT;
  assertEqual(getFrameSrcX(ch), 288, 'IDLE LEFT always srcX=288 (dir offset 288, frame 0)');

  // getFrameSrcX: WALK uses current frame
  ch.dir = Direction.DOWN;
  ch.state = CharacterState.WALK;
  ch.frame = 3;
  assertEqual(getFrameSrcX(ch), 0 + 3 * 16, 'WALK DOWN frame 3 srcX=48');

  ch.dir = Direction.RIGHT;
  ch.frame = 5;
  assertEqual(getFrameSrcX(ch), 96 + 5 * 16, 'WALK RIGHT frame 5 srcX=176');
}
