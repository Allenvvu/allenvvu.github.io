export const TILE_SIZE = 16;
export const MAX_DELTA_TIME_SEC = 0.1;
export const WALK_SPEED_PX_PER_SEC = 48;
export const WALK_FRAME_DURATION_SEC = 0.15;
export const WANDER_PAUSE_MIN_SEC = 2.0;
export const WANDER_PAUSE_MAX_SEC = 20.0;

export const FLOOR_COLOR = '#808080';
export const WALL_COLOR = '#3A3A5C';

export const TileType = Object.freeze({ WALL: 0, FLOOR: 1, FLOOR_WHITE: 2, FLOOR_GRAY: 3, FLOOR_GRAY_NOGRID: 4, VOID: 255 });
export const FLOOR_TILE_NAMES = Object.freeze({ 1: 'wooden', 2: 'white', 3: 'gray', 4: 'gray_nogrid' });
export const CharacterState = Object.freeze({ IDLE: 'idle', WALK: 'walk' });
export const Direction = Object.freeze({ DOWN: 0, RIGHT: 1, UP: 2, LEFT: 3 });

// Pixel x-offset of direction's frame 0 in the actual 766×33 character strip.
// Frames are 16px wide but spaced 32px apart (16px gap between each), with a 5px leading offset.
export const DIR_SPRITE_OFFSET = Object.freeze({ 0: 5, 1: 199, 2: 391, 3: 584 });
export const CHAR_FRAME_STRIDE = 32;
