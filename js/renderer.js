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
  // Items (things placed on desks) must render after the furniture beneath them,
  // so build a tile→maxZY map from non-item furniture first.
  const tileMaxZY = new Map();
  for (const f of furnitureInstances) {
    if (!f.variant || f.isItem) continue;
    const fzY = (f.row + f.variant.footprintH) * TILE_SIZE;
    for (let dr = 0; dr < f.variant.footprintH; dr++) {
      for (let dc = 0; dc < f.variant.footprintW; dc++) {
        const key = `${f.col + dc},${f.row + dr}`;
        const prev = tileMaxZY.get(key);
        if (prev === undefined || fzY > prev) tileMaxZY.set(key, fzY);
      }
    }
  }

  const drawables = [];

  for (const f of furnitureInstances) {
    if (!f.img || !f.variant) continue;
    const fw = Math.round(f.variant.w * zoom);
    const fh = Math.round(f.variant.h * zoom);
    const drawOffX = f.variant.centered ? Math.round((f.variant.footprintW * TILE_SIZE * zoom - fw) / 2) : 0;
    const drawOffY = f.variant.centered ? Math.round((f.variant.footprintH * TILE_SIZE * zoom - fh) / 2) : 0;
    const fx = offsetX + f.col * s + drawOffX;
    const fy = offsetY + f.row * s + drawOffY;
    const fimg = f.img;
    const mirror = !!f.variant.mirror;
    const isAnimated = (f.variant.frames ?? 1) > 1;
    if (isAnimated && fimg.naturalHeight === 0) continue;
    const animSrcX = isAnimated ? f.frameIndex * f.variant.frameW : 0;
    const animFrameW = isAnimated ? f.variant.frameW : 0;
    const animFrameH = isAnimated ? fimg.naturalHeight : 0;

    let zY = (f.row + f.variant.footprintH) * TILE_SIZE;
    if (f.isItem) {
      for (let dr = 0; dr < f.variant.footprintH; dr++) {
        for (let dc = 0; dc < f.variant.footprintW; dc++) {
          const under = tileMaxZY.get(`${f.col + dc},${f.row + dr}`) ?? 0;
          if (under > zY) zY = under;
        }
      }
      zY += 0.5;
    }

    drawables.push({
      zY,
      draw: (c) => {
        c.imageSmoothingEnabled = false;
        if (mirror) {
          c.save();
          c.translate(fx + fw, fy);
          c.scale(-1, 1);
          if (isAnimated) {
            c.drawImage(fimg, animSrcX, 0, animFrameW, animFrameH, 0, 0, fw, fh);
          } else {
            c.drawImage(fimg, 0, 0, fw, fh);
          }
          c.restore();
        } else {
          if (isAnimated) {
            c.drawImage(fimg, animSrcX, 0, animFrameW, animFrameH, fx, fy, fw, fh);
          } else {
            c.drawImage(fimg, fx, fy, fw, fh);
          }
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
