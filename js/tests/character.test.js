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
  assertEqual(getFrameSrcX(ch), 5, 'IDLE DOWN uses the updated sprite-strip offset');

  ch.dir = Direction.RIGHT;
  assertEqual(getFrameSrcX(ch), 199, 'IDLE RIGHT uses the updated sprite-strip offset');

  ch.dir = Direction.UP;
  assertEqual(getFrameSrcX(ch), 391, 'IDLE UP uses the updated sprite-strip offset');

  ch.dir = Direction.LEFT;
  assertEqual(getFrameSrcX(ch), 584, 'IDLE LEFT uses the updated sprite-strip offset');

  // getFrameSrcX: WALK uses current frame
  ch.dir = Direction.DOWN;
  ch.state = CharacterState.WALK;
  ch.frame = 3;
  assertEqual(getFrameSrcX(ch), 101, 'WALK DOWN frame 3 uses the corrected 32px stride');

  ch.dir = Direction.RIGHT;
  ch.frame = 5;
  assertEqual(getFrameSrcX(ch), 359, 'WALK RIGHT frame 5 uses the corrected 32px stride');
}
