// layout.js — single editable room config
// Move or add furniture here without touching engine logic.

const LAYOUT = {
  cols:     21,
  rows:     22,
  wallRows: 3,

  furniture: [
    { uid: 'bookshelf-1', type: 'BOOKSHELF',  col: 4,  row: 2 },
    { uid: 'bookshelf-2', type: 'BOOKSHELF',  col: 7,  row: 2 },
    { uid: 'bookshelf-3', type: 'BOOKSHELF',  col: 13, row: 2 },
    { uid: 'desk-1',      type: 'DESK_FRONT', col: 7,  row: 14 },
    { uid: 'desk-2',      type: 'DESK_SIDE',  col: 13, row: 11 },
    { uid: 'plant-1',     type: 'PLANT',      col: 18, row: 18 },
    { uid: 'plant-2',     type: 'PLANT',      col: 2,  row: 16 },
  ],
};
