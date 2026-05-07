// catalog.js — manifest-driven furniture metadata
// Adding new furniture: drop PNG → add entry here → add entry to layout.js

const CATALOG = {
  DESK_FRONT: {
    file: 'assets/furniture/DESK/DESK_FRONT.png',
    w: 48, h: 32,
    fw: 3, fh: 2,
  },
  DESK_SIDE: {
    file: 'assets/furniture/DESK/DESK_SIDE.png',
    w: 16, h: 64,
    fw: 1, fh: 4,
  },
  BOOKSHELF: {
    file: 'assets/furniture/BOOKSHELF/BOOKSHELF.png',
    w: 32, h: 16,
    fw: 2, fh: 1,
    wallItem: true,
  },
  PLANT: {
    file: 'assets/furniture/PLANT/PLANT.png',
    w: 16, h: 32,
    fw: 1, fh: 2,
  },
};
