import { TILE_SIZE, TileType, FLOOR_COLOR, WALL_COLOR } from './constants.js';
import { getFrameSrcX } from './character.js';

export function computeZoom(canvasWidth, canvasHeight, cols, rows) {
  return Math.max(1, Math.floor(Math.min(canvasWidth / (cols * TILE_SIZE), canvasHeight / (rows * TILE_SIZE))));
}

/** Convert canvas pixel coords to tile col/row */
export function pixelToTile(px, py, offsetX, offsetY, zoom) {
  return {
    col: Math.floor((px - offsetX) / (TILE_SIZE * zoom)),
    row: Math.floor((py - offsetY) / (TILE_SIZE * zoom)),
  };
}

/** Compute top-left pixel offset so the tile map is centered in the canvas */
export function computeOffset(canvasWidth, canvasHeight, cols, rows, zoom) {
  return {
    offsetX: Math.floor((canvasWidth - cols * TILE_SIZE * zoom) / 2),
    offsetY: Math.floor((canvasHeight - rows * TILE_SIZE * zoom) / 2),
  };
}

/**
 * Render a full frame onto ctx.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ cols, rows, tileMap }} layout  tileMap is 2D array
 * @param {Array} furnitureInstances  each has { col, row, variant, img }
 * @param {object|null} character  null to skip character rendering
 * @param {HTMLImageElement|null} charImg
 * @param {number} zoom
 */
export function renderFrame(ctx, layout, furnitureInstances, character, charImg, zoom, floorImgs = null) {
  const { cols, rows, tileMap } = layout;
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const { offsetX, offsetY } = computeOffset(cw, ch, cols, rows, zoom);
  const s = TILE_SIZE * zoom;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cw, ch);

  // Tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = tileMap[r][c];
      if (tile === TileType.VOID) continue;
      if (tile === TileType.WALL) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
      } else if (floorImgs?.[tile]) {
        ctx.drawImage(floorImgs[tile], offsetX + c * s, offsetY + r * s, s, s);
      } else {
        ctx.fillStyle = FLOOR_COLOR;
        ctx.fillRect(offsetX + c * s, offsetY + r * s, s, s);
      }
    }
  }

  // Z-sorted drawables: furniture then character, sorted by bottom-edge Y
  const drawables = [];

  for (const f of furnitureInstances) {
    if (!f.img || !f.variant) continue;
    const fx = offsetX + f.col * s;
    const fy = offsetY + f.row * s;
    const fw = Math.round(f.variant.w * zoom);
    const fh = Math.round(f.variant.h * zoom);
    const fimg = f.img;
    const mirror = !!f.variant.mirror;
    drawables.push({
      zY: (f.row + f.variant.footprintH) * TILE_SIZE,
      draw: (c) => {
        c.imageSmoothingEnabled = false;
        if (mirror) {
          c.save();
          c.translate(fx + fw, fy);
          c.scale(-1, 1);
          c.drawImage(fimg, 0, 0, fw, fh);
          c.restore();
        } else {
          c.drawImage(fimg, fx, fy, fw, fh);
        }
      },
    });
  }

  if (character && charImg) {
    const srcX = getFrameSrcX(character);
    const drawX = Math.round(offsetX + character.x * zoom - (16 * zoom) / 2);
    const drawY = Math.round(offsetY + character.y * zoom - 32 * zoom);
    const charZY = character.y + TILE_SIZE / 2 + 0.5;
    const cimg = charImg;
    const czoom = zoom;
    const csrcX = srcX;
    drawables.push({
      zY: charZY,
      draw: (c) => { c.imageSmoothingEnabled = false; c.drawImage(cimg, csrcX, 0, 16, 32, drawX, drawY, 16 * czoom, 32 * czoom); },
    });
  }

  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) d.draw(ctx);
}
